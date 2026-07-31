import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard, WorkspaceMemberGuard } from '../common/guards';

@Controller('workspaces/:workspaceId/search')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Param('workspaceId') workspaceId: string,
    @Query('q') q = '',
  ) {
    return this.searchService.search(workspaceId, q);
  }
}
