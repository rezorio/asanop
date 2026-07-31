import {

  BadRequestException,

  Injectable,

  NotFoundException,

} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateWorkspaceDto } from './dto/workspace.dto';

import { defaultCustomFieldCreateMany } from '../custom-fields/default-fields';

import {

  SYSTEM_ROLE_KEYS,

  seedSystemRoles,

} from '../common/permissions';



@Injectable()

export class WorkspacesService {

  constructor(private readonly prisma: PrismaService) {}



  async listForUser(userId: string) {

    const memberships = await this.prisma.workspaceMember.findMany({

      where: { userId },

      include: {

        role: true,

        workspace: {

          include: {

            _count: { select: { members: true, projects: true } },

          },

        },

      },

      orderBy: { createdAt: 'asc' },

    });



    return memberships.map((m) => ({

      id: m.workspace.id,

      name: m.workspace.name,

      slug: m.workspace.slug,

      roleId: m.role.id,

      roleName: m.role.name,

      roleKey: m.role.key,

      permissions: m.role.permissions,

      memberCount: m.workspace._count.members,

      projectCount: m.workspace._count.projects,

    }));

  }



  async create(userId: string, dto: CreateWorkspaceDto) {

    const slugBase = this.slugify(dto.name) || 'workspace';

    const slug = await this.uniqueSlug(slugBase);



    const workspace = await this.prisma.$transaction(async (tx) => {

      const created = await tx.workspace.create({

        data: { name: dto.name.trim(), slug },

      });

      const roles = await seedSystemRoles(tx, created.id);

      await tx.workspaceMember.create({

        data: {

          workspaceId: created.id,

          userId,

          roleId: roles[SYSTEM_ROLE_KEYS.PROJECT_MANAGER].id,

        },

      });

      await tx.customFieldDefinition.createMany({

        data: defaultCustomFieldCreateMany(created.id),

      });

      return { created, roles };

    });



    const pm = workspace.roles[SYSTEM_ROLE_KEYS.PROJECT_MANAGER];

    const pmRole = await this.prisma.workspaceRole.findUniqueOrThrow({

      where: { id: pm.id },

    });



    return {

      id: workspace.created.id,

      name: workspace.created.name,

      slug: workspace.created.slug,

      roleId: pmRole.id,

      roleName: pmRole.name,

      roleKey: pmRole.key,

      permissions: pmRole.permissions,

      memberCount: 1,

      projectCount: 0,

    };

  }



  async remove(workspaceId: string, userId: string) {

    await this.getOrThrow(workspaceId);



    const managedCount = await this.prisma.workspaceMember.count({

      where: {

        userId,

        role: { key: SYSTEM_ROLE_KEYS.PROJECT_MANAGER },

      },

    });

    if (managedCount <= 1) {

      throw new BadRequestException(

        'You must keep at least one workspace where you are Project Manager. Create another workspace first, then delete this one.',

      );

    }



    await this.prisma.workspace.delete({ where: { id: workspaceId } });

    return { ok: true, id: workspaceId };

  }



  async getMembers(workspaceId: string) {

    const members = await this.prisma.workspaceMember.findMany({

      where: { workspaceId },

      include: {

        user: { select: { id: true, email: true, name: true } },

        role: true,

      },

      orderBy: { createdAt: 'asc' },

    });



    return members.map((m) => ({

      id: m.id,

      roleId: m.role.id,

      roleName: m.role.name,

      roleKey: m.role.key,

      permissions: m.role.permissions,

      user: m.user,

      joinedAt: m.createdAt,

    }));

  }



  async getOrThrow(workspaceId: string) {

    const workspace = await this.prisma.workspace.findUnique({

      where: { id: workspaceId },

    });

    if (!workspace) {

      throw new NotFoundException('Workspace not found');

    }

    return workspace;

  }



  private slugify(value: string) {

    return value

      .toLowerCase()

      .trim()

      .replace(/[^a-z0-9]+/g, '-')

      .replace(/^-+|-+$/g, '')

      .slice(0, 40);

  }



  private async uniqueSlug(base: string) {

    let slug = base;

    let i = 1;

    while (await this.prisma.workspace.findUnique({ where: { slug } })) {

      slug = `${base}-${i++}`;

    }

    return slug;

  }

}


