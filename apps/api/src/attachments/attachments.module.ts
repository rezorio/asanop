import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { WorkspaceMemberGuard } from '../common/guards';

@Module({
  controllers: [AttachmentsController],
  providers: [AttachmentsService, WorkspaceMemberGuard],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
