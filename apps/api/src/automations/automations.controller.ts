import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AutomationsService } from './automations.service';
import {
  CreateAutomationDto,
  UpdateAutomationDto,
} from './dto/automation.dto';
import { RequirePermissions } from '../common/decorators';
import { JwtAuthGuard, WorkspaceMemberGuard } from '../common/guards';

@Controller('workspaces/:workspaceId/automations')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get()
  list(@Param('workspaceId') workspaceId: string) {
    return this.automationsService.list(workspaceId);
  }

  @Post()
  @RequirePermissions('automations.manage')
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateAutomationDto,
  ) {
    return this.automationsService.create(workspaceId, dto);
  }

  @Patch(':ruleId')
  @RequirePermissions('automations.manage')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateAutomationDto,
  ) {
    return this.automationsService.update(workspaceId, ruleId, dto);
  }

  @Delete(':ruleId')
  @RequirePermissions('automations.manage')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('ruleId') ruleId: string,
  ) {
    return this.automationsService.remove(workspaceId, ruleId);
  }
}
