import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard, WorkspaceMemberGuard } from '../common/guards';

@Controller('workspaces/:workspaceId/dashboard')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  get(@Param('workspaceId') workspaceId: string) {
    return this.dashboardService.getWorkspaceDashboard(workspaceId);
  }
}
