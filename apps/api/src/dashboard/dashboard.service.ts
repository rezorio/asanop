import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type AttentionReason = 'overdue' | 'due_today' | 'blocked';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkspaceDashboard(workspaceId: string) {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    const weekAgo = new Date(startOfToday);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAhead = new Date(startOfToday);
    weekAhead.setDate(weekAhead.getDate() + 7);

    const taskWhere = {
      project: { workspaceId, archivedAt: null },
      parentId: null,
    };

    const openWhere = {
      ...taskWhere,
      status: { not: TaskStatus.DONE },
    };

    const [
      byStatus,
      overdue,
      dueSoon,
      completedThisWeek,
      openBlocked,
      projectRows,
      assigneeRows,
      members,
      projectOverdueRows,
      blockedTaskRows,
      attentionCandidates,
      recentActivity,
      newlyOverdueThisWeek,
    ] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['status'],
        where: taskWhere,
        _count: { _all: true },
      }),
      this.prisma.task.count({
        where: {
          ...openWhere,
          dueDate: { lt: startOfToday },
        },
      }),
      this.prisma.task.count({
        where: {
          ...openWhere,
          dueDate: { gte: startOfToday, lte: weekAhead },
        },
      }),
      this.prisma.task.count({
        where: {
          ...taskWhere,
          status: TaskStatus.DONE,
          updatedAt: { gte: weekAgo },
        },
      }),
      this.prisma.taskDependency.count({
        where: {
          task: openWhere,
          dependsOn: { status: { not: TaskStatus.DONE } },
        },
      }),
      this.prisma.task.groupBy({
        by: ['projectId', 'status'],
        where: taskWhere,
        _count: { _all: true },
      }),
      this.prisma.task.groupBy({
        by: ['assigneeId', 'status'],
        where: {
          ...taskWhere,
          assigneeId: { not: null },
        },
        _count: { _all: true },
      }),
      this.prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.task.groupBy({
        by: ['projectId'],
        where: {
          ...openWhere,
          dueDate: { lt: startOfToday },
        },
        _count: { _all: true },
      }),
      this.prisma.task.findMany({
        where: {
          ...openWhere,
          blockedBy: {
            some: { dependsOn: { status: { not: TaskStatus.DONE } } },
          },
        },
        select: { projectId: true },
      }),
      this.prisma.task.findMany({
        where: {
          ...openWhere,
          OR: [
            { dueDate: { lt: startOfTomorrow } },
            {
              blockedBy: {
                some: { dependsOn: { status: { not: TaskStatus.DONE } } },
              },
            },
          ],
        },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
          blockedBy: {
            include: { dependsOn: { select: { status: true } } },
          },
        },
        take: 24,
        orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.activityEvent.findMany({
        where: {
          task: { project: { workspaceId, archivedAt: null } },
        },
        include: {
          actor: { select: { id: true, name: true } },
          task: {
            select: {
              id: true,
              title: true,
              projectId: true,
              project: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      this.prisma.task.count({
        where: {
          ...openWhere,
          dueDate: { gte: weekAgo, lt: startOfToday },
        },
      }),
    ]);

    const statusCounts: Record<TaskStatus, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };
    for (const row of byStatus) {
      statusCounts[row.status] = row._count._all;
    }

    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const openCount = statusCounts.TODO + statusCounts.IN_PROGRESS;
    const percentComplete = total ? Math.round((statusCounts.DONE / total) * 100) : 0;

    const projects = await this.prisma.project.findMany({
      where: { workspaceId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const overdueByProject = new Map(
      projectOverdueRows.map((row) => [row.projectId, row._count._all]),
    );
    const blockedByProject = new Map<string, number>();
    for (const row of blockedTaskRows) {
      blockedByProject.set(row.projectId, (blockedByProject.get(row.projectId) ?? 0) + 1);
    }

    const byProject = projects.map((project) => {
      const rows = projectRows.filter((r) => r.projectId === project.id);
      const counts = { TODO: 0, IN_PROGRESS: 0, DONE: 0, total: 0 };
      for (const row of rows) {
        counts[row.status] = row._count._all;
        counts.total += row._count._all;
      }
      const overdueCount = overdueByProject.get(project.id) ?? 0;
      const blockedCount = blockedByProject.get(project.id) ?? 0;
      const projectPercentComplete = counts.total
        ? Math.round((counts.DONE / counts.total) * 100)
        : 0;
      const health =
        overdueCount > 0 || blockedCount > 0
          ? 'at_risk'
          : counts.IN_PROGRESS > 0
            ? 'active'
            : counts.total === counts.DONE
              ? 'complete'
              : 'idle';

      return {
        project,
        ...counts,
        overdue: overdueCount,
        blocked: blockedCount,
        percentComplete: projectPercentComplete,
        health,
      };
    });

    const memberMap = new Map(members.map((m) => [m.userId, m.user]));
    const byAssigneeMap = new Map<
      string,
      {
        user: { id: string; name: string; email: string };
        TODO: number;
        IN_PROGRESS: number;
        DONE: number;
        open: number;
      }
    >();

    for (const row of assigneeRows) {
      if (!row.assigneeId) continue;
      const user = memberMap.get(row.assigneeId);
      if (!user) continue;
      if (!byAssigneeMap.has(row.assigneeId)) {
        byAssigneeMap.set(row.assigneeId, {
          user,
          TODO: 0,
          IN_PROGRESS: 0,
          DONE: 0,
          open: 0,
        });
      }
      const entry = byAssigneeMap.get(row.assigneeId)!;
      entry[row.status] = row._count._all;
      if (row.status !== TaskStatus.DONE) {
        entry.open += row._count._all;
      }
    }

    const unassignedOpen = await this.prisma.task.count({
      where: {
        ...openWhere,
        assigneeId: null,
      },
    });

    const reasonPriority: Record<AttentionReason, number> = {
      overdue: 0,
      blocked: 1,
      due_today: 2,
    };

    const needsAttention = attentionCandidates
      .map((task) => {
        const reasons: AttentionReason[] = [];
        if (task.dueDate && task.dueDate < startOfToday) {
          reasons.push('overdue');
        } else if (
          task.dueDate &&
          task.dueDate >= startOfToday &&
          task.dueDate < startOfTomorrow
        ) {
          reasons.push('due_today');
        }
        const isBlocked = task.blockedBy.some(
          (dep) => dep.dependsOn.status !== TaskStatus.DONE,
        );
        if (isBlocked) reasons.push('blocked');
        if (!reasons.length) return null;

        const primaryReason = [...reasons].sort(
          (a, b) => reasonPriority[a] - reasonPriority[b],
        )[0];

        return {
          id: task.id,
          title: task.title,
          status: task.status,
          dueDate: task.dueDate?.toISOString() ?? null,
          projectId: task.project.id,
          projectName: task.project.name,
          assignee: task.assignee,
          reasons,
          primaryReason,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => reasonPriority[a.primaryReason] - reasonPriority[b.primaryReason])
      .slice(0, 10);

    const chronicOverdue = overdue - newlyOverdueThisWeek;

    return {
      generatedAt: now.toISOString(),
      summary: {
        total,
        open: openCount,
        percentComplete,
        byStatus: statusCounts,
        overdue,
        dueSoon,
        completedThisWeek,
        openBlocked,
        unassignedOpen,
        projectCount: projects.length,
        memberCount: members.length,
        overdueTrend: {
          current: overdue,
          newlyThisWeek: newlyOverdueThisWeek,
          chronic: Math.max(0, chronicOverdue),
        },
      },
      needsAttention,
      recentActivity: recentActivity.map((event) => ({
        id: event.id,
        type: event.type,
        createdAt: event.createdAt.toISOString(),
        meta: event.meta,
        actor: event.actor,
        task: {
          id: event.task.id,
          title: event.task.title,
          projectId: event.task.projectId,
          projectName: event.task.project.name,
        },
      })),
      byProject,
      byAssignee: [...byAssigneeMap.values()].sort((a, b) => b.open - a.open),
    };
  }
}
