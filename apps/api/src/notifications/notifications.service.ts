import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CreateNotificationInput = {
  workspaceId: string;
  userId: string;
  actorId?: string | null;
  taskId?: string | null;
  type: NotificationType;
  title: string;
  body?: string;
  meta?: Prisma.InputJsonValue;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput) {
    if (input.actorId && input.actorId === input.userId) {
      return null;
    }

    return this.prisma.notification.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        actorId: input.actorId ?? null,
        taskId: input.taskId ?? null,
        type: input.type,
        title: input.title,
        body: input.body,
        meta: input.meta,
      },
    });
  }

  async list(workspaceId: string, userId: string, limit = 30) {
    return this.prisma.notification.findMany({
      where: { workspaceId, userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: {
        actor: { select: { id: true, name: true } },
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
            parentId: true,
          },
        },
      },
    });
  }

  async unreadCount(workspaceId: string, userId: string) {
    const count = await this.prisma.notification.count({
      where: { workspaceId, userId, readAt: null },
    });
    return { count };
  }

  async markRead(workspaceId: string, userId: string, notificationId: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { id: notificationId, workspaceId, userId },
    });
    if (!existing) {
      return null;
    }
    if (existing.readAt) return existing;

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
      include: {
        actor: { select: { id: true, name: true } },
        task: {
          select: { id: true, title: true, projectId: true, parentId: true },
        },
      },
    });
  }

  async markAllRead(workspaceId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { workspaceId, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async notifyAssignment(params: {
    workspaceId: string;
    taskId: string;
    taskTitle: string;
    assigneeId: string;
    actorId: string;
    actorName: string;
  }) {
    return this.create({
      workspaceId: params.workspaceId,
      userId: params.assigneeId,
      actorId: params.actorId,
      taskId: params.taskId,
      type: NotificationType.TASK_ASSIGNED,
      title: `${params.actorName} assigned you a task`,
      body: params.taskTitle,
      meta: { taskTitle: params.taskTitle },
    });
  }

  async notifyComment(params: {
    workspaceId: string;
    taskId: string;
    taskTitle: string;
    recipientIds: string[];
    actorId: string;
    actorName: string;
    excerpt: string;
  }) {
    const unique = [...new Set(params.recipientIds)].filter(
      (id) => id !== params.actorId,
    );
    await Promise.all(
      unique.map((userId) =>
        this.create({
          workspaceId: params.workspaceId,
          userId,
          actorId: params.actorId,
          taskId: params.taskId,
          type: NotificationType.TASK_COMMENTED,
          title: `${params.actorName} commented on ${params.taskTitle}`,
          body: params.excerpt.slice(0, 160),
        }),
      ),
    );
  }

  async notifyStatusChange(params: {
    workspaceId: string;
    taskId: string;
    taskTitle: string;
    recipientId: string | null | undefined;
    actorId: string;
    actorName: string;
    from: string;
    to: string;
  }) {
    if (!params.recipientId) return null;
    return this.create({
      workspaceId: params.workspaceId,
      userId: params.recipientId,
      actorId: params.actorId,
      taskId: params.taskId,
      type: NotificationType.STATUS_CHANGED,
      title: `${params.actorName} moved “${params.taskTitle}” to ${params.to}`,
      body: `${params.from} → ${params.to}`,
      meta: { from: params.from, to: params.to },
    });
  }

  async notifyMentions(params: {
    workspaceId: string;
    taskId: string;
    taskTitle: string;
    mentionedUserIds: string[];
    actorId: string;
    actorName: string;
    excerpt: string;
  }) {
    const unique = [...new Set(params.mentionedUserIds)].filter(
      (id) => id !== params.actorId,
    );
    await Promise.all(
      unique.map((userId) =>
        this.create({
          workspaceId: params.workspaceId,
          userId,
          actorId: params.actorId,
          taskId: params.taskId,
          type: NotificationType.MENTIONED,
          title: `${params.actorName} mentioned you on ${params.taskTitle}`,
          body: params.excerpt.slice(0, 160),
        }),
      ),
    );
  }
}
