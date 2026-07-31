import { Module } from '@nestjs/common';
import { CustomFieldsService } from './custom-fields.service';
import { CustomFieldsController } from './custom-fields.controller';
import { WorkspaceMemberGuard } from '../common/guards';

@Module({
  controllers: [CustomFieldsController],
  providers: [CustomFieldsService, WorkspaceMemberGuard],
  exports: [CustomFieldsService],
})
export class CustomFieldsModule {}
