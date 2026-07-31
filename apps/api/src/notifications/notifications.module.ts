import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { WorkspaceMemberGuard } from '../common/guards';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, WorkspaceMemberGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
