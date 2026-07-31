import {

  BadRequestException,

  ConflictException,

  Injectable,

  NotFoundException,

} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';

import { CreateInviteDto } from '../workspaces/dto/workspace.dto';

import { SYSTEM_ROLE_KEYS } from '../common/permissions';



@Injectable()

export class InvitesService {

  constructor(

    private readonly prisma: PrismaService,

    private readonly config: ConfigService,

  ) {}



  async create(workspaceId: string, createdById: string, dto: CreateInviteDto) {

    const email = dto.email.toLowerCase().trim();

    const roleId = await this.resolveInviteRoleId(workspaceId, dto.roleId);



    const existingMember = await this.prisma.workspaceMember.findFirst({

      where: {

        workspaceId,

        user: { email },

      },

    });

    if (existingMember) {

      throw new ConflictException('User is already a workspace member');

    }



    const pending = await this.prisma.workspaceInvite.findFirst({

      where: { workspaceId, email, status: 'PENDING' },

      include: {

        workspace: { select: { name: true } },

        role: true,

      },

    });

    if (pending && pending.expiresAt > new Date()) {

      return this.toInviteResponse(pending);

    }



    const token = randomBytes(24).toString('hex');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);



    const invite = await this.prisma.workspaceInvite.create({

      data: {

        workspaceId,

        email,

        token,

        roleId,

        expiresAt,

        createdById,

      },

      include: {

        workspace: { select: { name: true } },

        role: true,

      },

    });



    return this.toInviteResponse(invite);

  }



  async listForWorkspace(workspaceId: string) {

    const invites = await this.prisma.workspaceInvite.findMany({

      where: { workspaceId },

      orderBy: { createdAt: 'desc' },

      include: {

        workspace: { select: { name: true } },

        role: true,

      },

    });

    return invites.map((invite) => this.toInviteResponse(invite));

  }



  async preview(token: string) {

    const invite = await this.findValidInvite(token);

    return {

      email: invite.email,

      roleId: invite.role.id,

      roleName: invite.role.name,

      roleKey: invite.role.key,

      workspace: {

        id: invite.workspace.id,

        name: invite.workspace.name,

      },

      expiresAt: invite.expiresAt,

    };

  }



  async accept(token: string, userId: string) {

    const invite = await this.findValidInvite(token);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {

      throw new NotFoundException('User not found');

    }



    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {

      throw new BadRequestException(

        `This invite is for ${invite.email}. Sign in with that email to accept.`,

      );

    }



    await this.prisma.$transaction(async (tx) => {

      const existing = await tx.workspaceMember.findUnique({

        where: {

          workspaceId_userId: {

            workspaceId: invite.workspaceId,

            userId,

          },

        },

      });



      if (!existing) {

        await tx.workspaceMember.create({

          data: {

            workspaceId: invite.workspaceId,

            userId,

            roleId: invite.roleId,

          },

        });

      }



      await tx.workspaceInvite.update({

        where: { id: invite.id },

        data: { status: 'ACCEPTED' },

      });

    });



    return {

      workspaceId: invite.workspaceId,

      workspaceName: invite.workspace.name,

      roleId: invite.role.id,

      roleName: invite.role.name,

      roleKey: invite.role.key,

    };

  }



  private async resolveInviteRoleId(workspaceId: string, roleId?: string) {

    if (roleId) {

      const role = await this.prisma.workspaceRole.findFirst({

        where: { id: roleId, workspaceId },

      });

      if (!role) {

        throw new BadRequestException('Invalid role for this workspace');

      }

      if (role.key === SYSTEM_ROLE_KEYS.PROJECT_MANAGER) {

        throw new BadRequestException(

          'Cannot invite someone directly as Project Manager',

        );

      }

      return role.id;

    }



    const contributor = await this.prisma.workspaceRole.findUnique({

      where: {

        workspaceId_key: {

          workspaceId,

          key: SYSTEM_ROLE_KEYS.CONTRIBUTOR,

        },

      },

    });

    if (!contributor) {

      throw new NotFoundException('Default Contributor role not found');

    }

    return contributor.id;

  }



  private async findValidInvite(token: string) {

    const invite = await this.prisma.workspaceInvite.findUnique({

      where: { token },

      include: { workspace: true, role: true },

    });



    if (!invite || invite.status !== 'PENDING') {

      throw new NotFoundException('Invite not found or already used');

    }

    if (invite.expiresAt < new Date()) {

      throw new BadRequestException('Invite has expired');

    }

    return invite;

  }



  private toInviteResponse(invite: {

    id: string;

    email: string;

    token: string;

    status: string;

    expiresAt: Date;

    createdAt: Date;

    workspace?: { name: string };

    role: { id: string; name: string; key: string };

  }) {

    const webOrigin =

      this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:5173';



    return {

      id: invite.id,

      email: invite.email,

      roleId: invite.role.id,

      roleName: invite.role.name,

      roleKey: invite.role.key,

      status: invite.status,

      expiresAt: invite.expiresAt,

      createdAt: invite.createdAt,

      workspaceName: invite.workspace?.name,

      inviteUrl: `${webOrigin}/invite/${invite.token}`,

      token: invite.token,

    };

  }

}


