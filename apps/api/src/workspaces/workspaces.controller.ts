import {

  Body,

  Controller,

  Delete,

  Get,

  Param,

  Post,

  UseGuards,

} from '@nestjs/common';

import { WorkspacesService } from './workspaces.service';

import { CreateWorkspaceDto } from './dto/workspace.dto';

import { CurrentUser, RequirePermissions } from '../common/decorators';

import type { AuthUser } from '../common/decorators';

import { JwtAuthGuard, WorkspaceMemberGuard } from '../common/guards';

import { InvitesService } from '../invites/invites.service';

import { CreateInviteDto } from './dto/workspace.dto';



@Controller('workspaces')

@UseGuards(JwtAuthGuard)

export class WorkspacesController {

  constructor(

    private readonly workspacesService: WorkspacesService,

    private readonly invitesService: InvitesService,

  ) {}



  @Get()

  list(@CurrentUser() user: AuthUser) {

    return this.workspacesService.listForUser(user.id);

  }



  @Post()

  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkspaceDto) {

    return this.workspacesService.create(user.id, dto);

  }



  @Delete(':workspaceId')

  @UseGuards(WorkspaceMemberGuard)

  @RequirePermissions('workspace.manage')

  remove(

    @Param('workspaceId') workspaceId: string,

    @CurrentUser() user: AuthUser,

  ) {

    return this.workspacesService.remove(workspaceId, user.id);

  }



  @Get(':workspaceId/members')

  @UseGuards(WorkspaceMemberGuard)

  members(@Param('workspaceId') workspaceId: string) {

    return this.workspacesService.getMembers(workspaceId);

  }



  @Get(':workspaceId/invites')

  @UseGuards(WorkspaceMemberGuard)

  @RequirePermissions('members.invite')

  listInvites(@Param('workspaceId') workspaceId: string) {

    return this.invitesService.listForWorkspace(workspaceId);

  }



  @Post(':workspaceId/invites')

  @UseGuards(WorkspaceMemberGuard)

  @RequirePermissions('members.invite')

  createInvite(

    @Param('workspaceId') workspaceId: string,

    @CurrentUser() user: AuthUser,

    @Body() dto: CreateInviteDto,

  ) {

    return this.invitesService.create(workspaceId, user.id, dto);

  }

}


