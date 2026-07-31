import { Module } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { SectionsController } from './sections.controller';
import { WorkspaceMemberGuard } from '../common/guards';

@Module({
  controllers: [SectionsController],
  providers: [SectionsService, WorkspaceMemberGuard],
  exports: [SectionsService],
})
export class SectionsModule {}
