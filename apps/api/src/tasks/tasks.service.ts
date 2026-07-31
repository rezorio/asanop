import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AutomationTrigger, Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AutomationsService } from '../automations/automations.service';
import {
  assertCanCreateTask,
  assertCanEditTask,
  canEditMapForTasks,
  userCanEditTask,
} from '../common/task-access';
import {
  CreateCommentDto,
  CreateTaskDto,
  UpdateTaskDto,
  AddDependencyDto,
} from './dto/task.dto';

const dependencyTaskSelect = {
  id: true,
  title: true,
  status: true,
  projectId: true,
  parentId: true,
} as const;

const subtaskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  _count: { select: { comments: true } },
};

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } },
  section: { select: { id: true, name: true, position: true } },
  comments: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      author: { select: { id: true, name: true, email: true } },
      mentions: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  },
  activity: {
    orderBy: { createdAt: 'desc' as const },
    take: 20,
    include: {
      actor: { select: { id: true, name: true } },
    },
  },
  subtasks: {
    orderBy: [{ position: 'asc' as const }, { createdAt: 'asc' as const }],
    include: subtaskInclude,
  },
  fieldValues: {
    include: { field: true },
  },
  attachments: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      uploadedBy: { select: { id: true, name: true } },
    },
  },
  parent: {
    select: { id: true, title: true },
  },
  blockedBy: {
    include: { dependsOn: { select: dependencyTaskSelect } },
  },
  blocking: {
    include: { task: { select: dependencyTaskSelect } },
  },
  _count: {
    select: { subtasks: true, comments: true },
  },
};

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly automations: AutomationsService,
  ) {}

  async listByProject(workspaceId: string, projectId: string, userId: string) {
    await this.assertProjectInWorkspace(projectId, workspaceId);
    const tasks = await this.prisma.task.findMany({
      where: { projectId, parentId: null },
      orderBy: [
        { section: { position: 'asc' } },
        { position: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        section: { select: { id: true, name: true, position: true } },
        _count: { select: { comments: true, subtasks: true } },
        fieldValues: { include: { field: true } },
        blockedBy: {
          include: { dependsOn: { select: dependencyTaskSelect } },
        },
      },
    });

    const editMap = await canEditMapForTasks(this.prisma, workspaceId, userId, tasks);
    return tasks.map((task) => ({
      ...this.withBlockState(task),
      canEdit: editMap.get(task.id) ?? false,
    }));
  }

  async listForCalendar(workspaceId: string, fromIso: string, toIso: string) {
    const from = new Date(fromIso);
    const to = new Date(toIso);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException('Invalid from/to date');
    }
    if (from > to) {
      throw new BadRequestException('from must be before to');
    }

    // Cap range to ~92 days to keep responses light
    const maxMs = 92 * 24 * 60 * 60 * 1000;
    if (to.getTime() - from.getTime() > maxMs) {
      throw new BadRequestException('Date range cannot exceed 92 days');
    }

    return this.prisma.task.findMany({
      where: {
        dueDate: { gte: from, lte: to },
        project: { workspaceId, archivedAt: null },
      },
      orderBy: [{ dueDate: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        startDate: true,
        projectId: true,
        parentId: true,
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });
  }

  async listForTimeline(
    workspaceId: string,
    fromIso: string,
    toIso: string,
    userId: string,
  ) {
    const from = new Date(fromIso);
    const to = new Date(toIso);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException('Invalid from/to date');
    }
    if (from > to) {
      throw new BadRequestException('from must be before to');
    }

    const maxMs = 180 * 24 * 60 * 60 * 1000;
    if (to.getTime() - from.getTime() > maxMs) {
      throw new BadRequestException('Date range cannot exceed 180 days');
    }

    const timelineSelect = {
      id: true,
      title: true,
      status: true,
      priority: true,
      startDate: true,
      dueDate: true,
      projectId: true,
      assigneeId: true,
      assignee: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, createdById: true } },
      blockedBy: {
        select: {
          dependsOnId: true,
          dependsOn: {
            select: {
              id: true,
              title: true,
              status: true,
              startDate: true,
              dueDate: true,
            },
          },
        },
      },
      blocking: {
        select: {
          taskId: true,
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              startDate: true,
              dueDate: true,
            },
          },
        },
      },
    } as const;

    const windowTasks = await this.prisma.task.findMany({
      where: {
        parentId: null,
        project: { workspaceId, archivedAt: null },
        OR: [
          { dueDate: { gte: from, lte: to } },
          { startDate: { gte: from, lte: to } },
          {
            AND: [{ startDate: { lte: to } }, { dueDate: { gte: from } }],
          },
        ],
      },
      orderBy: [
        { project: { name: 'asc' } },
        { startDate: 'asc' },
        { dueDate: 'asc' },
      ],
      select: timelineSelect,
    });

    const visibleIds = new Set(windowTasks.map((task) => task.id));
    const relatedIds = new Set<string>();
    for (const task of windowTasks) {
      for (const edge of task.blockedBy) relatedIds.add(edge.dependsOnId);
      for (const edge of task.blocking) relatedIds.add(edge.taskId);
    }

    const missingIds = [...relatedIds].filter((id) => !visibleIds.has(id));
    const linkedTasks =
      missingIds.length === 0
        ? []
        : await this.prisma.task.findMany({
            where: {
              id: { in: missingIds },
              parentId: null,
              project: { workspaceId, archivedAt: null },
            },
            orderBy: [
              { project: { name: 'asc' } },
              { startDate: 'asc' },
              { dueDate: 'asc' },
            ],
            select: timelineSelect,
          });

    const mapTask = (
      task: (typeof windowTasks)[number],
      linkedOnly = false,
      canEdit = false,
    ) => {
      const isMilestone = !task.startDate && !!task.dueDate;
      const start = task.startDate ?? task.dueDate;
      const end = task.dueDate ?? task.startDate;
      const { blocking: _blocking, ...rest } = task;
      return {
        ...rest,
        barStart: start,
        barEnd: end,
        isMilestone,
        linkedOnly,
        canEdit,
        isBlocked: task.blockedBy.some(
          (d) => d.dependsOn.status !== TaskStatus.DONE,
        ),
      };
    };

    const all = [...windowTasks, ...linkedTasks];
    const editMap = await canEditMapForTasks(this.prisma, workspaceId, userId, all);

    return [
      ...windowTasks.map((task) =>
        mapTask(task, false, editMap.get(task.id) ?? false),
      ),
      ...linkedTasks.map((task) =>
        mapTask(task, true, editMap.get(task.id) ?? false),
      ),
    ];
  }

  async listMine(workspaceId: string, userId: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: TaskStatus.DONE },
        project: { workspaceId, archivedAt: null },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        parent: { select: { id: true, title: true } },
        _count: { select: { subtasks: true, comments: true } },
        fieldValues: { include: { field: true } },
      },
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const buckets = {
      overdue: [] as typeof tasks,
      today: [] as typeof tasks,
      upcoming: [] as typeof tasks,
      later: [] as typeof tasks,
    };

    for (const task of tasks) {
      if (!task.dueDate) {
        buckets.later.push(task);
      } else if (task.dueDate < startOfToday) {
        buckets.overdue.push(task);
      } else if (task.dueDate < endOfToday) {
        buckets.today.push(task);
      } else if (task.dueDate < endOfWeek) {
        buckets.upcoming.push(task);
      } else {
        buckets.later.push(task);
      }
    }

    return buckets;
  }

  async getOne(workspaceId: string, taskId: string, viewerUserId?: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        ...taskInclude,
        project: {
          select: { id: true, workspaceId: true, name: true, createdById: true },
        },
      },
    });
    if (!task || task.project.workspaceId !== workspaceId) {
      throw new NotFoundException('Task not found');
    }

    const completedSubtasks = task.subtasks.filter(
      (s) => s.status === TaskStatus.DONE,
    ).length;

    const canEdit = viewerUserId
      ? await userCanEditTask(this.prisma, workspaceId, viewerUserId, task)
      : false;

    return this.withBlockState({
      ...task,
      canEdit,
      subtaskProgress: {
        total: task.subtasks.length,
        completed: completedSubtasks,
      },
    });
  }

  async create(
    workspaceId: string,
    projectId: string,
    userId: string,
    dto: CreateTaskDto,
    options?: { skipAutomations?: boolean },
  ) {
    await this.assertProjectInWorkspace(projectId, workspaceId);
    if (dto.assigneeId) {
      await this.assertAssigneeInWorkspace(workspaceId, dto.assigneeId);
    }

    let parentId: string | null = null;
    let sectionId: string | null = null;

    if (dto.parentId) {
      const parent = await this.prisma.task.findFirst({
        where: { id: dto.parentId, projectId },
      });
      if (!parent) {
        throw new BadRequestException('Parent task not found in this project');
      }
      if (parent.parentId) {
        throw new BadRequestException('Only one level of subtasks is allowed');
      }
      await assertCanEditTask(this.prisma, workspaceId, userId, parent);
      parentId = parent.id;
      sectionId = parent.sectionId;
    } else {
      await assertCanCreateTask(this.prisma, workspaceId, userId);
      if (dto.sectionId) {
        sectionId = await this.assertSectionInProject(projectId, dto.sectionId);
      } else {
        sectionId = await this.ensureDefaultSection(projectId);
      }
    }

    const task = await this.prisma.task.create({
      data: {
        projectId,
        sectionId,
        parentId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        status: dto.status ?? TaskStatus.TODO,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        assigneeId: dto.assigneeId || null,
        createdById: userId,
      },
    });

    await this.prisma.activityEvent.create({
      data: {
        taskId: parentId ?? task.id,
        actorId: userId,
        type: parentId ? 'SUBTASK_CREATED' : 'TASK_CREATED',
        meta: { title: task.title, taskId: task.id, parentId },
      },
    });

    if (task.assigneeId) {
      const actorName = await this.getUserName(userId);
      await this.notifications.notifyAssignment({
        workspaceId,
        taskId: task.id,
        taskTitle: task.title,
        assigneeId: task.assigneeId,
        actorId: userId,
        actorName,
      });
    }

    if (!options?.skipAutomations && !parentId) {
      await this.automations.evaluate({
        workspaceId,
        projectId,
        taskId: task.id,
        taskTitle: task.title,
        trigger: AutomationTrigger.TASK_CREATED,
        actorId: userId,
      });
    }

    return this.getOne(workspaceId, parentId ?? task.id, userId);
  }

  async update(
    workspaceId: string,
    taskId: string,
    userId: string,
    dto: UpdateTaskDto,
  ) {
    const existing = await this.getOne(workspaceId, taskId, userId);
    await assertCanEditTask(this.prisma, workspaceId, userId, existing);

    if (dto.assigneeId) {
      await this.assertAssigneeInWorkspace(workspaceId, dto.assigneeId);
    }

    const data: Prisma.TaskUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.startDate !== undefined) {
      data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }
    if (dto.assigneeId !== undefined) {
      data.assignee = dto.assigneeId
        ? { connect: { id: dto.assigneeId } }
        : { disconnect: true };
    }
    if (dto.sectionId !== undefined) {
      if (dto.sectionId) {
        await this.assertSectionInProject(existing.projectId, dto.sectionId);
        data.section = { connect: { id: dto.sectionId } };
      } else {
        data.section = { disconnect: true };
      }
    }

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data,
    });

    const events: Array<{ type: string; meta: Prisma.InputJsonValue }> = [];
    if (dto.status && dto.status !== existing.status) {
      events.push({
        type: 'STATUS_CHANGED',
        meta: { from: existing.status, to: dto.status },
      });
    }
    if (
      dto.assigneeId !== undefined &&
      dto.assigneeId !== existing.assigneeId
    ) {
      events.push({
        type: 'ASSIGNED',
        meta: { assigneeId: dto.assigneeId },
      });
    }

    if (events.length) {
      await this.prisma.activityEvent.createMany({
        data: events.map((e) => ({
          taskId: task.id,
          actorId: userId,
          type: e.type,
          meta: e.meta,
        })),
      });
    }

    const actorName = await this.getUserName(userId);

    if (
      dto.assigneeId &&
      dto.assigneeId !== existing.assigneeId
    ) {
      await this.notifications.notifyAssignment({
        workspaceId,
        taskId: task.id,
        taskTitle: task.title,
        assigneeId: dto.assigneeId,
        actorId: userId,
        actorName,
      });
    }

    if (dto.status && dto.status !== existing.status) {
      await this.notifications.notifyStatusChange({
        workspaceId,
        taskId: task.id,
        taskTitle: task.title,
        recipientId: task.assigneeId ?? existing.assigneeId,
        actorId: userId,
        actorName,
        from: existing.status,
        to: dto.status,
      });

      await this.automations.evaluate({
        workspaceId,
        projectId: existing.projectId,
        taskId: task.id,
        taskTitle: task.title,
        trigger: AutomationTrigger.STATUS_CHANGED,
        fromStatus: existing.status,
        toStatus: dto.status,
        actorId: userId,
      });
    }

    // Return parent when updating a subtask so drawer can refresh rollup
    const refreshId = existing.parentId ?? taskId;
    return this.getOne(workspaceId, refreshId, userId);
  }

  async addComment(
    workspaceId: string,
    taskId: string,
    userId: string,
    dto: CreateCommentDto,
  ) {
    const existing = await this.getOne(workspaceId, taskId);
    const mentionedUserIds = [...new Set(dto.mentionedUserIds ?? [])].filter(
      (id) => id !== userId,
    );

    if (mentionedUserIds.length) {
      const members = await this.prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          userId: { in: mentionedUserIds },
        },
        select: { userId: true },
      });
      if (members.length !== mentionedUserIds.length) {
        throw new BadRequestException(
          'Mentions must be workspace members',
        );
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        taskId,
        authorId: userId,
        body: dto.body.trim(),
        mentions: mentionedUserIds.length
          ? {
              create: mentionedUserIds.map((mentionedId) => ({
                userId: mentionedId,
              })),
            }
          : undefined,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        mentions: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    await this.prisma.activityEvent.create({
      data: {
        taskId,
        actorId: userId,
        type: 'COMMENT_ADDED',
        meta: {
          commentId: comment.id,
          mentionedUserIds,
        },
      },
    });

    const mentionSet = new Set(mentionedUserIds);
    const recipients = [existing.assigneeId, existing.createdBy?.id].filter(
      (id): id is string => typeof id === 'string' && !mentionSet.has(id),
    );

    await this.notifications.notifyComment({
      workspaceId,
      taskId,
      taskTitle: existing.title,
      recipientIds: recipients,
      actorId: userId,
      actorName: comment.author.name,
      excerpt: comment.body,
    });

    if (mentionedUserIds.length) {
      await this.notifications.notifyMentions({
        workspaceId,
        taskId,
        taskTitle: existing.title,
        mentionedUserIds,
        actorId: userId,
        actorName: comment.author.name,
        excerpt: comment.body,
      });
    }

    return comment;
  }

  async addDependency(
    workspaceId: string,
    taskId: string,
    userId: string,
    dto: AddDependencyDto,
  ) {
    const task = await this.getOne(workspaceId, taskId, userId);
    await assertCanEditTask(this.prisma, workspaceId, userId, task);
    if (dto.dependsOnId === taskId) {
      throw new BadRequestException('A task cannot depend on itself');
    }

    const blocker = await this.prisma.task.findFirst({
      where: {
        id: dto.dependsOnId,
        projectId: task.projectId,
      },
    });
    if (!blocker) {
      throw new BadRequestException('Dependency task must be in the same project');
    }

    if (await this.wouldCreateCycle(taskId, dto.dependsOnId)) {
      throw new BadRequestException('That dependency would create a cycle');
    }

    try {
      await this.prisma.taskDependency.create({
        data: {
          taskId,
          dependsOnId: dto.dependsOnId,
        },
      });
    } catch {
      throw new BadRequestException('Dependency already exists');
    }

    await this.prisma.activityEvent.create({
      data: {
        taskId,
        actorId: userId,
        type: 'DEPENDENCY_ADDED',
        meta: { dependsOnId: dto.dependsOnId, dependsOnTitle: blocker.title },
      },
    });

    return this.getOne(workspaceId, task.parentId ?? taskId, userId);
  }

  async removeDependency(
    workspaceId: string,
    taskId: string,
    dependsOnId: string,
    userId: string,
  ) {
    const task = await this.getOne(workspaceId, taskId, userId);
    await assertCanEditTask(this.prisma, workspaceId, userId, task);
    const existing = await this.prisma.taskDependency.findUnique({
      where: { taskId_dependsOnId: { taskId, dependsOnId } },
    });
    if (!existing) {
      throw new NotFoundException('Dependency not found');
    }

    await this.prisma.taskDependency.delete({
      where: { id: existing.id },
    });

    await this.prisma.activityEvent.create({
      data: {
        taskId,
        actorId: userId,
        type: 'DEPENDENCY_REMOVED',
        meta: { dependsOnId },
      },
    });

    return this.getOne(workspaceId, task.parentId ?? taskId, userId);
  }

  private withBlockState<
    T extends {
      blockedBy?: Array<{ dependsOn: { id: string; status: TaskStatus; title: string } }>;
      blocking?: Array<{ task: { id: string; status: TaskStatus; title: string } }>;
    },
  >(task: T) {
    const blockedByTasks = (task.blockedBy ?? []).map((d) => d.dependsOn);
    const blockingTasks = (task.blocking ?? []).map((d) => d.task);
    const openBlockers = blockedByTasks.filter((t) => t.status !== TaskStatus.DONE);

    return {
      ...task,
      blockedByTasks,
      blockingTasks,
      isBlocked: openBlockers.length > 0,
      openBlockers,
    };
  }

  /** True if making `taskId` depend on `dependsOnId` would create a cycle. */
  private async wouldCreateCycle(taskId: string, dependsOnId: string) {
    // Walk upstream from the blocker: if we reach taskId, cycle.
    const visited = new Set<string>();
    const queue = [dependsOnId];

    while (queue.length) {
      const current = queue.shift()!;
      if (current === taskId) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      const upstream = await this.prisma.taskDependency.findMany({
        where: { taskId: current },
        select: { dependsOnId: true },
      });
      for (const edge of upstream) {
        queue.push(edge.dependsOnId);
      }
    }

    return false;
  }

  private async getUserName(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    return user?.name ?? 'Someone';
  }

  private async assertProjectInWorkspace(projectId: string, workspaceId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, archivedAt: null },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  private async assertAssigneeInWorkspace(
    workspaceId: string,
    assigneeId: string,
  ) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: assigneeId },
      },
    });
    if (!member) {
      throw new BadRequestException('Assignee must be a workspace member');
    }
  }

  private async assertSectionInProject(projectId: string, sectionId: string) {
    const section = await this.prisma.projectSection.findFirst({
      where: { id: sectionId, projectId },
    });
    if (!section) {
      throw new BadRequestException('Section not found in this project');
    }
    return section.id;
  }

  private async ensureDefaultSection(projectId: string) {
    const existing = await this.prisma.projectSection.findFirst({
      where: { projectId },
      orderBy: { position: 'asc' },
    });
    if (existing) return existing.id;
    const created = await this.prisma.projectSection.create({
      data: { projectId, name: 'Untitled section', position: 0 },
    });
    return created.id;
  }
}
