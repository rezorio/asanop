import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { RolesService } from './roles.service'
import { AssignMemberRoleDto, CreateRoleDto, UpdateRoleDto } from './dto/role.dto'
import { RequirePermissions } from '../common/decorators'
import { JwtAuthGuard, WorkspaceMemberGuard } from '../common/guards'

@Controller('workspaces/:workspaceId')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('roles')
  list(@Param('workspaceId') workspaceId: string) {
    return this.rolesService.list(workspaceId)
  }

  @Post('roles')
  @RequirePermissions('roles.manage')
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.create(workspaceId, dto)
  }

  @Patch('roles/:roleId')
  @RequirePermissions('roles.manage')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(workspaceId, roleId, dto)
  }

  @Delete('roles/:roleId')
  @RequirePermissions('roles.manage')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rolesService.remove(workspaceId, roleId)
  }

  @Patch('members/:memberId/role')
  @RequirePermissions('members.manage')
  assignMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() dto: AssignMemberRoleDto,
  ) {
    return this.rolesService.assignMemberRole(
      workspaceId,
      memberId,
      dto.roleId,
    )
  }
}
