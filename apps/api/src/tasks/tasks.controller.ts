import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import {
  AddDependencyDto,
  CreateCommentDto,
  CreateTaskDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { CurrentUser } from '../common/decorators';
import type { AuthUser } from '../common/decorators';
import { JwtAuthGuard, WorkspaceMemberGuard } from '../common/guards';
import { CustomFieldsService } from '../custom-fields/custom-fields.service';
import { UpsertFieldValueDto } from '../custom-fields/dto/custom-field.dto';

@Controller('workspaces/:workspaceId')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly customFieldsService: CustomFieldsService,
  ) {}

  @Get('my-tasks')
  myTasks(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.listMine(workspaceId, user.id);
  }

  @Get('calendar')
  calendar(
    @Param('workspaceId') workspaceId: string,
    @Query('from') from = '',
    @Query('to') to = '',
  ) {
    return this.tasksService.listForCalendar(workspaceId, from, to);
  }

  @Get('timeline')
  timeline(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUser,
    @Query('from') from = '',
    @Query('to') to = '',
  ) {
    return this.tasksService.listForTimeline(workspaceId, from, to, user.id);
  }

  @Get('projects/:projectId/tasks')
  list(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.listByProject(workspaceId, projectId, user.id);
  }

  @Post('projects/:projectId/tasks')
  create(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(workspaceId, projectId, user.id, dto);
  }

  @Get('tasks/:taskId')
  getOne(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.getOne(workspaceId, taskId, user.id);
  }

  @Patch('tasks/:taskId')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(workspaceId, taskId, user.id, dto);
  }

  @Post('tasks/:taskId/comments')
  comment(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.tasksService.addComment(workspaceId, taskId, user.id, dto);
  }

  @Post('tasks/:taskId/dependencies')
  addDependency(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: AddDependencyDto,
  ) {
    return this.tasksService.addDependency(workspaceId, taskId, user.id, dto);
  }

  @Delete('tasks/:taskId/dependencies/:dependsOnId')
  removeDependency(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Param('dependsOnId') dependsOnId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.removeDependency(
      workspaceId,
      taskId,
      dependsOnId,
      user.id,
    );
  }

  @Put('tasks/:taskId/fields/:fieldId')
  upsertField(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Param('fieldId') fieldId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpsertFieldValueDto,
  ) {
    return this.customFieldsService.upsertValue(
      workspaceId,
      taskId,
      fieldId,
      user.id,
      dto,
    );
  }
}
