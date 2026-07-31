import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { WorkspaceMemberGuard } from '../common/guards';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, WorkspaceMemberGuard],
})
export class DashboardModule {}
