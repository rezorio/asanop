import {

  createParamDecorator,

  ExecutionContext,

  SetMetadata,

} from '@nestjs/common';

import type { Permission } from './permissions';



export type AuthUser = {

  id: string;

  email: string;

  name: string;

};



export type WorkspaceMembershipContext = {

  workspaceId: string;

  roleId: string;

  roleKey: string;

  roleName: string;

  permissions: string[];

};



export const CURRENT_USER_KEY = 'user';

export const PERMISSIONS_KEY = 'permissions';



export const CurrentUser = createParamDecorator(

  (_data: unknown, ctx: ExecutionContext): AuthUser => {

    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();

    return request.user;

  },

);



export const WorkspaceMembership = createParamDecorator(

  (_data: unknown, ctx: ExecutionContext): WorkspaceMembershipContext => {

    const request = ctx.switchToHttp().getRequest<{

      workspaceMembership: WorkspaceMembershipContext;

    }>();

    return request.workspaceMembership;

  },

);



/** Require all listed permissions on the active workspace membership. */

export const RequirePermissions = (...permissions: Permission[]) =>

  SetMetadata(PERMISSIONS_KEY, permissions);


