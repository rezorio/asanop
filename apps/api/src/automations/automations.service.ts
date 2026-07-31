import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AutomationAction,
  AutomationTrigger,
  TaskStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateAutomationDto,
  UpdateAutomationDto,
} from './dto/automation.dto';

export type AutomationEvalContext = {
  workspaceId: string;
  projectId: string;
  taskId: string;
  taskTitle: string;
  trigger: AutomationTrigger;
  fromStatus?: TaskStatus;
  toStatus?: TaskStatus;
  actorId: string;
};

@Injectable()
export class AutomationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  list(workspaceId: string) {
    return this.prisma.automationRule.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
        actionAssignee: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async create(workspaceId: string, dto: CreateAutomationDto) {
    this.assertActionPayload(dto.action, dto);
    if (dto.projectId) {
      await this.assertProject(workspaceId, dto.projectId);
    }
    if (dto.action === AutomationAction.SET_ASSIGNEE && dto.actionAssigneeId) {
      await this.assertMember(workspaceId, dto.actionAssigneeId);
    }

    return this.prisma.automationRule.create({
      data: {
        workspaceId,
        name: dto.name.trim(),
        trigger: dto.trigger,
        triggerFromStatus: dto.triggerFromStatus,
        triggerToStatus: dto.triggerToStatus,
        action: dto.action,
        actionStatus: dto.actionStatus,
        actionAssigneeId: dto.actionAssigneeId,
        actionComment: dto.actionComment?.trim(),
        projectId: dto.projectId || null,
        isActive: dto.isActive ?? true,
      },
      include: {
        project: { select: { id: true, name: true } },
        actionAssignee: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async update(workspaceId: string, ruleId: string, dto: UpdateAutomationDto) {
    const existing = await this.getOrThrow(workspaceId, ruleId);
    const action = dto.action ?? existing.action;
    this.assertActionPayload(action, {
      actionStatus:
        dto.actionStatus !== undefined
          ? dto.actionStatus ?? undefined
          : existing.actionStatus ?? undefined,
      actionAssigneeId:
        dto.actionAssigneeId !== undefined
          ? dto.actionAssigneeId ?? undefined
          : existing.actionAssigneeId ?? undefined,
      actionComment:
        dto.actionComment !== undefined
          ? dto.actionComment ?? undefined
          : existing.actionComment ?? undefined,
    });

    if (dto.projectId) {
      await this.assertProject(workspaceId, dto.projectId);
    }
    if (
      (dto.action === AutomationAction.SET_ASSIGNEE ||
        action === AutomationAction.SET_ASSIGNEE) &&
      (dto.actionAssigneeId || existing.actionAssigneeId)
    ) {
      const assigneeId = dto.actionAssigneeId ?? existing.actionAssigneeId;
      if (assigneeId) await this.assertMember(workspaceId, assigneeId);
    }

    return this.prisma.automationRule.update({
      where: { id: ruleId },
      data: {
        name: dto.name?.trim(),
        trigger: dto.trigger,
        triggerFromStatus:
          dto.triggerFromStatus === undefined
            ? undefined
            : dto.triggerFromStatus,
        triggerToStatus:
          dto.triggerToStatus === undefined ? undefined : dto.triggerToStatus,
        action: dto.action,
        actionStatus:
          dto.actionStatus === undefined ? undefined : dto.actionStatus,
        actionAssigneeId:
          dto.actionAssigneeId === undefined
            ? undefined
            : dto.actionAssigneeId,
        actionComment:
          dto.actionComment === undefined
            ? undefined
            : dto.actionComment?.trim() ?? null,
        projectId: dto.projectId === undefined ? undefined : dto.projectId,
        isActive: dto.isActive,
      },
      include: {
        project: { select: { id: true, name: true } },
        actionAssignee: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async remove(workspaceId: string, ruleId: string) {
    await this.getOrThrow(workspaceId, ruleId);
    await this.prisma.automationRule.delete({ where: { id: ruleId } });
    return { ok: true };
  }

  async evaluate(ctx: AutomationEvalContext, depth = 0) {
    if (depth > 1) return;

    const rules = await this.prisma.automationRule.findMany({
      where: {
        workspaceId: ctx.workspaceId,
        isActive: true,
        trigger: ctx.trigger,
        OR: [{ projectId: null }, { projectId: ctx.projectId }],
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const rule of rules) {
      if (ctx.trigger === AutomationTrigger.STATUS_CHANGED) {
        if (
          rule.triggerFromStatus &&
          rule.triggerFromStatus !== ctx.fromStatus
        ) {
          continue;
        }
        if (rule.triggerToStatus && rule.triggerToStatus !== ctx.toStatus) {
          continue;
        }
      }

      const result = await this.applyRule(rule, ctx);
      if (result?.statusChanged && depth === 0) {
        await this.evaluate(
          {
            ...ctx,
            trigger: AutomationTrigger.STATUS_CHANGED,
            fromStatus: result.fromStatus,
            toStatus: result.toStatus,
          },
          depth + 1,
        );
      }
    }
  }

  private async applyRule(
    rule: {
      id: string;
      action: AutomationAction;
      actionStatus: TaskStatus | null;
      actionAssigneeId: string | null;
      actionComment: string | null;
    },
    ctx: AutomationEvalContext,
  ): Promise<
    | { statusChanged: true; fromStatus: TaskStatus; toStatus: TaskStatus }
    | { statusChanged: false }
    | null
  > {
    const task = await this.prisma.task.findUnique({ where: { id: ctx.taskId } });
    if (!task) return null;

    if (rule.action === AutomationAction.SET_STATUS && rule.actionStatus) {
      if (task.status === rule.actionStatus) {
        return { statusChanged: false };
      }
      const fromStatus = task.status;
      await this.prisma.task.update({
        where: { id: task.id },
        data: { status: rule.actionStatus },
      });
      await this.prisma.activityEvent.create({
        data: {
          taskId: task.id,
          actorId: ctx.actorId,
          type: 'STATUS_CHANGED',
          meta: {
            from: fromStatus,
            to: rule.actionStatus,
            automationRuleId: rule.id,
          },
        },
      });
      const actor = await this.prisma.user.findUnique({
        where: { id: ctx.actorId },
        select: { name: true },
      });
      await this.notifications.notifyStatusChange({
        workspaceId: ctx.workspaceId,
        taskId: task.id,
        taskTitle: task.title,
        recipientId: task.assigneeId,
        actorId: ctx.actorId,
        actorName: actor?.name ?? 'Automation',
        from: fromStatus,
        to: rule.actionStatus,
      });
      return {
        statusChanged: true,
        fromStatus,
        toStatus: rule.actionStatus,
      };
    }

    if (
      rule.action === AutomationAction.SET_ASSIGNEE &&
      rule.actionAssigneeId
    ) {
      if (task.assigneeId === rule.actionAssigneeId) {
        return { statusChanged: false };
      }
      await this.prisma.task.update({
        where: { id: task.id },
        data: { assigneeId: rule.actionAssigneeId },
      });
      await this.prisma.activityEvent.create({
        data: {
          taskId: task.id,
          actorId: ctx.actorId,
          type: 'ASSIGNED',
          meta: {
            assigneeId: rule.actionAssigneeId,
            automationRuleId: rule.id,
          },
        },
      });
      const actor = await this.prisma.user.findUnique({
        where: { id: ctx.actorId },
        select: { name: true },
      });
      await this.notifications.notifyAssignment({
        workspaceId: ctx.workspaceId,
        taskId: task.id,
        taskTitle: task.title,
        assigneeId: rule.actionAssigneeId,
        actorId: ctx.actorId,
        actorName: actor?.name ?? 'Automation',
      });
      return { statusChanged: false };
    }

    if (rule.action === AutomationAction.ADD_COMMENT && rule.actionComment) {
      const comment = await this.prisma.comment.create({
        data: {
          taskId: task.id,
          authorId: ctx.actorId,
          body: rule.actionComment,
        },
      });
      await this.prisma.activityEvent.create({
        data: {
          taskId: task.id,
          actorId: ctx.actorId,
          type: 'COMMENT_ADDED',
          meta: {
            commentId: comment.id,
            automationRuleId: rule.id,
          },
        },
      });
      return { statusChanged: false };
    }

    return { statusChanged: false };
  }

  private assertActionPayload(
    action: AutomationAction,
    dto: {
      actionStatus?: TaskStatus | null;
      actionAssigneeId?: string | null;
      actionComment?: string | null;
    },
  ) {
    if (action === AutomationAction.SET_STATUS && !dto.actionStatus) {
      throw new BadRequestException('actionStatus is required for SET_STATUS');
    }
    if (action === AutomationAction.SET_ASSIGNEE && !dto.actionAssigneeId) {
      throw new BadRequestException(
        'actionAssigneeId is required for SET_ASSIGNEE',
      );
    }
    if (action === AutomationAction.ADD_COMMENT && !dto.actionComment?.trim()) {
      throw new BadRequestException(
        'actionComment is required for ADD_COMMENT',
      );
    }
  }

  private async getOrThrow(workspaceId: string, ruleId: string) {
    const rule = await this.prisma.automationRule.findFirst({
      where: { id: ruleId, workspaceId },
    });
    if (!rule) throw new NotFoundException('Automation not found');
    return rule;
  }

  private async assertProject(workspaceId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, archivedAt: null },
    });
    if (!project) throw new BadRequestException('Project not found');
  }

  private async assertMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) {
      throw new BadRequestException('Assignee must be a workspace member');
    }
  }
}
