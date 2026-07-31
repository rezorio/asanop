import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { WorkspaceMemberGuard } from '../common/guards';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, WorkspaceMemberGuard],
  exports: [ProjectsService],
})
export class ProjectsModule {}
