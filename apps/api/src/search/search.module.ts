import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { WorkspaceMemberGuard } from '../common/guards';

@Module({
  controllers: [SearchController],
  providers: [SearchService, WorkspaceMemberGuard],
})
export class SearchModule {}
