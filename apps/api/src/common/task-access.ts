import { ForbiddenException } from '@nestjs/common'
import type { PrismaClient } from '@prisma/client'
import { hasPermission } from './permissions'

export type TaskEditSubject = {
  id: string
  assigneeId: string | null
  projectId: string
  project?: { createdById?: string } | null
}

type MembershipWithRole = {
  role: { permissions: string[] }
}

async function getMembership(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
): Promise<MembershipWithRole | null> {
  return prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
    select: {
      role: { select: { permissions: true } },
    },
  })
}

/**
 * Who can edit a task:
 * - Members with tasks.edit_any
 * - Task assignee
 * - Project creator
 *
 * Other members may view (and comment) but not mutate task fields,
 * status, dependencies, attachments, or custom field values.
 */
export async function userCanEditTask(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
  task: TaskEditSubject,
): Promise<boolean> {
  const membership = await getMembership(prisma, workspaceId, userId)
  if (!membership) return false
  if (hasPermission(membership.role.permissions, 'tasks.edit_any')) return true
  if (task.assigneeId === userId) return true

  const projectCreatedById =
    task.project?.createdById ??
    (
      await prisma.project.findFirst({
        where: { id: task.projectId, workspaceId },
        select: { createdById: true },
      })
    )?.createdById

  return projectCreatedById === userId
}

export async function assertCanEditTask(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
  task: TaskEditSubject,
) {
  const allowed = await userCanEditTask(prisma, workspaceId, userId, task)
  if (!allowed) {
    throw new ForbiddenException(
      'Only the assignee, project creator, or a member with edit-any permission can edit this task',
    )
  }
}

/** Batch canEdit flags for list responses. */
export async function canEditMapForTasks(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
  tasks: TaskEditSubject[],
): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>()
  if (!tasks.length) return result

  const membership = await getMembership(prisma, workspaceId, userId)

  if (!membership) {
    for (const task of tasks) result.set(task.id, false)
    return result
  }

  if (hasPermission(membership.role.permissions, 'tasks.edit_any')) {
    for (const task of tasks) result.set(task.id, true)
    return result
  }

  const projectIds = [...new Set(tasks.map((t) => t.projectId))]
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds }, workspaceId },
    select: { id: true, createdById: true },
  })
  const ownerByProject = new Map(projects.map((p) => [p.id, p.createdById]))

  for (const task of tasks) {
    const isAssignee = task.assigneeId === userId
    const isProjectOwner = ownerByProject.get(task.projectId) === userId
    result.set(task.id, isAssignee || isProjectOwner)
  }

  return result
}

export async function assertCanCreateTask(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
) {
  const membership = await getMembership(prisma, workspaceId, userId)
  if (!hasPermission(membership?.role.permissions, 'tasks.create')) {
    throw new ForbiddenException(
      'You do not have permission to create tasks in this workspace',
    )
  }
}
