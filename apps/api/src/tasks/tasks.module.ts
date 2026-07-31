import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { WorkspaceMemberGuard } from '../common/guards';
import { CustomFieldsModule } from '../custom-fields/custom-fields.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AutomationsModule } from '../automations/automations.module';

@Module({
  imports: [CustomFieldsModule, NotificationsModule, AutomationsModule],
  controllers: [TasksController],
  providers: [TasksService, WorkspaceMemberGuard],
  exports: [TasksService],
})
export class TasksModule {}
