import {

  CanActivate,

  ExecutionContext,

  ForbiddenException,

  Injectable,

  UnauthorizedException,

} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { Reflector } from '@nestjs/core';

import { PrismaService } from '../prisma/prisma.service';

import {

  AuthUser,

  PERMISSIONS_KEY,

  WorkspaceMembershipContext,

} from './decorators';

import { hasPermission, type Permission } from './permissions';



@Injectable()

export class JwtAuthGuard extends AuthGuard('jwt') {}



@Injectable()

export class WorkspaceMemberGuard implements CanActivate {

  constructor(

    private readonly prisma: PrismaService,

    private readonly reflector: Reflector,

  ) {}



  async canActivate(context: ExecutionContext): Promise<boolean> {

    const request = context.switchToHttp().getRequest<{

      user?: AuthUser;

      params: Record<string, string>;

      body: Record<string, unknown>;

      query: Record<string, unknown>;

      workspaceMembership?: WorkspaceMembershipContext;

    }>();



    if (!request.user) {

      throw new UnauthorizedException();

    }



    const workspaceId =

      request.params.workspaceId ??

      (typeof request.body?.workspaceId === 'string'

        ? request.body.workspaceId

        : undefined) ??

      (typeof request.query?.workspaceId === 'string'

        ? request.query.workspaceId

        : undefined);



    if (!workspaceId) {

      throw new ForbiddenException('Workspace context required');

    }



    const membership = await this.prisma.workspaceMember.findUnique({

      where: {

        workspaceId_userId: {

          workspaceId,

          userId: request.user.id,

        },

      },

      include: {

        role: {

          select: {

            id: true,

            key: true,

            name: true,

            permissions: true,

          },

        },

      },

    });



    if (!membership) {

      throw new ForbiddenException('Not a member of this workspace');

    }



    const required = this.reflector.getAllAndOverride<Permission[]>(

      PERMISSIONS_KEY,

      [context.getHandler(), context.getClass()],

    );



    if (

      required?.length &&

      !hasPermission(membership.role.permissions, required)

    ) {

      throw new ForbiddenException('Insufficient workspace permissions');

    }



    request.workspaceMembership = {

      workspaceId: membership.workspaceId,

      roleId: membership.role.id,

      roleKey: membership.role.key,

      roleName: membership.role.name,

      permissions: membership.role.permissions,

    };



    return true;

  }

}


