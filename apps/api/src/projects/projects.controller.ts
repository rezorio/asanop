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
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { CurrentUser, RequirePermissions } from '../common/decorators';
import type { AuthUser } from '../common/decorators';
import { JwtAuthGuard, WorkspaceMemberGuard } from '../common/guards';

@Controller('workspaces/:workspaceId/projects')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(@Param('workspaceId') workspaceId: string) {
    return this.projectsService.list(workspaceId);
  }

  @Get(':projectId')
  getOne(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.getOne(projectId, workspaceId);
  }

  @Post()
  @RequirePermissions('projects.create')
  create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(workspaceId, user.id, dto);
  }

  @Patch(':projectId')
  @RequirePermissions('projects.manage')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(projectId, workspaceId, dto);
  }

  @Delete(':projectId')
  @RequirePermissions('projects.manage')
  archive(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.archive(projectId, workspaceId);
  }
}
