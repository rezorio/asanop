import { Module } from '@nestjs/common'
import { RolesService } from './roles.service'
import { RolesController } from './roles.controller'
import { WorkspaceMemberGuard } from '../common/guards'

@Module({
  controllers: [RolesController],
  providers: [RolesService, WorkspaceMemberGuard],
  exports: [RolesService],
})
export class RolesModule {}
