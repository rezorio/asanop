import { Module, forwardRef } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { InvitesModule } from '../invites/invites.module';
import { WorkspaceMemberGuard } from '../common/guards';

@Module({
  imports: [forwardRef(() => InvitesModule)],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceMemberGuard],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
