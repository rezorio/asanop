import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
  ALL_PERMISSIONS,
  SYSTEM_ROLE_KEYS,
  isPermission,
  slugifyRoleKey,
  type Permission,
} from '../common/permissions'
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto'

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string) {
    const roles = await this.prisma.workspaceRole.findMany({
      where: { workspaceId },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: {
        _count: { select: { members: true } },
      },
    })

    return roles.map((r) => this.toResponse(r))
  }

  async create(workspaceId: string, dto: CreateRoleDto) {
    const name = dto.name.trim()
    let key = slugifyRoleKey(name)
    const existingKeys = await this.prisma.workspaceRole.findMany({
      where: { workspaceId },
      select: { key: true },
    })
    const used = new Set(existingKeys.map((r) => r.key))
    if (used.has(key)) {
      let i = 2
      while (used.has(`${key}_${i}`)) i++
      key = `${key}_${i}`
    }

    const permissions = this.normalizePermissions(dto.permissions ?? [])
    const role = await this.prisma.workspaceRole.create({
      data: {
        workspaceId,
        name,
        key,
        isSystem: false,
        permissions,
      },
      include: { _count: { select: { members: true } } },
    })
    return this.toResponse(role)
  }

  async update(workspaceId: string, roleId: string, dto: UpdateRoleDto) {
    const role = await this.getOrThrow(workspaceId, roleId)

    if (
      role.key === SYSTEM_ROLE_KEYS.PROJECT_MANAGER &&
      dto.permissions !== undefined
    ) {
      const next = this.normalizePermissions(dto.permissions)
      if (
        !next.includes('workspace.manage') ||
        !next.includes('roles.manage')
      ) {
        throw new BadRequestException(
          'Project Manager must keep workspace.manage and roles.manage',
        )
      }
    }

    const data: { name?: string; permissions?: string[] } = {}
    if (dto.name !== undefined) {
      if (role.isSystem) {
        throw new BadRequestException('System role names cannot be changed')
      }
      data.name = dto.name.trim()
    }
    if (dto.permissions !== undefined) {
      data.permissions = this.normalizePermissions(dto.permissions)
    }

    const updated = await this.prisma.workspaceRole.update({
      where: { id: role.id },
      data,
      include: { _count: { select: { members: true } } },
    })
    return this.toResponse(updated)
  }

  async remove(workspaceId: string, roleId: string) {
    const role = await this.getOrThrow(workspaceId, roleId)
    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted')
    }

    const memberCount = await this.prisma.workspaceMember.count({
      where: { roleId: role.id },
    })
    if (memberCount > 0) {
      throw new ConflictException(
        'Reassign members to another role before deleting this role',
      )
    }

    const inviteCount = await this.prisma.workspaceInvite.count({
      where: { roleId: role.id, status: 'PENDING' },
    })
    if (inviteCount > 0) {
      throw new ConflictException(
        'Revoke or wait for pending invites using this role before deleting',
      )
    }

    await this.prisma.workspaceRole.delete({ where: { id: role.id } })
    return { ok: true, id: roleId }
  }

  async assignMemberRole(
    workspaceId: string,
    memberId: string,
    roleId: string,
  ) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
      include: { role: true },
    })
    if (!member) {
      throw new NotFoundException('Member not found')
    }

    const nextRole = await this.getOrThrow(workspaceId, roleId)

    if (
      member.role.key === SYSTEM_ROLE_KEYS.PROJECT_MANAGER &&
      nextRole.key !== SYSTEM_ROLE_KEYS.PROJECT_MANAGER
    ) {
      const pmCount = await this.prisma.workspaceMember.count({
        where: {
          workspaceId,
          role: { key: SYSTEM_ROLE_KEYS.PROJECT_MANAGER },
        },
      })
      if (pmCount <= 1) {
        throw new BadRequestException(
          'Workspace must keep at least one Project Manager',
        )
      }
    }

    const updated = await this.prisma.workspaceMember.update({
      where: { id: member.id },
      data: { roleId: nextRole.id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        role: true,
      },
    })

    return {
      id: updated.id,
      roleId: updated.role.id,
      roleName: updated.role.name,
      roleKey: updated.role.key,
      permissions: updated.role.permissions,
      user: updated.user,
      joinedAt: updated.createdAt,
    }
  }

  async getRoleIdByKey(workspaceId: string, key: string) {
    const role = await this.prisma.workspaceRole.findUnique({
      where: { workspaceId_key: { workspaceId, key } },
    })
    if (!role) {
      throw new NotFoundException(`Role ${key} not found`)
    }
    return role.id
  }

  private async getOrThrow(workspaceId: string, roleId: string) {
    const role = await this.prisma.workspaceRole.findFirst({
      where: { id: roleId, workspaceId },
    })
    if (!role) {
      throw new NotFoundException('Role not found')
    }
    return role
  }

  private normalizePermissions(input: string[]): Permission[] {
    const set = new Set<Permission>()
    for (const p of input) {
      if (isPermission(p)) set.add(p)
    }
    return ALL_PERMISSIONS.filter((p) => set.has(p))
  }

  private toResponse(role: {
    id: string
    name: string
    key: string
    isSystem: boolean
    permissions: string[]
    _count?: { members: number }
  }) {
    return {
      id: role.id,
      name: role.name,
      key: role.key,
      isSystem: role.isSystem,
      permissions: role.permissions,
      memberCount: role._count?.members ?? 0,
    }
  }
}
