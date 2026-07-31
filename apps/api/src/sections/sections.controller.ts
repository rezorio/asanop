import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SectionsService } from './sections.service';
import {
  CreateSectionDto,
  ReorderSectionsDto,
  UpdateSectionDto,
} from './dto/section.dto';
import { JwtAuthGuard, WorkspaceMemberGuard } from '../common/guards';

@Controller('workspaces/:workspaceId/projects/:projectId/sections')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  list(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.sectionsService.list(workspaceId, projectId);
  }

  @Post()
  create(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.sectionsService.create(workspaceId, projectId, dto);
  }

  @Patch('reorder')
  reorder(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Body() dto: ReorderSectionsDto,
  ) {
    return this.sectionsService.reorder(workspaceId, projectId, dto);
  }

  @Patch(':sectionId')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.sectionsService.update(workspaceId, projectId, sectionId, dto);
  }

  @Delete(':sectionId')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.sectionsService.remove(workspaceId, projectId, sectionId);
  }
}
