import * as bcrypt from 'bcrypt'
import { NotificationType, Prisma, PrismaClient } from '@prisma/client'
import { defaultCustomFieldCreateMany } from '../../src/custom-fields/default-fields'
import { dateFromOffset } from './lib/dates'
import {
  DEMO_OWNER,
  DEMO_PROJECT,
  DEMO_SECTIONS,
  DEMO_TEAM_EMAILS,
  DEMO_WORKSPACE_NAME,
  SEED_PASSWORD,
} from './demo/meta.data'
import { DEMO_TASKS, type AssigneeRef } from './demo/tasks.data'
import {
  DEMO_ACTIVITY,
  DEMO_COMMENTS,
  DEMO_DEPENDENCIES,
  DEMO_FIELD_VALUES,
  DEMO_NOTIFICATIONS,
} from './demo/enrichment.data'
import {
  DEMO_AUTOMATIONS,
  DEMO_INTAKE_FORMS,
  DEMO_PENDING_INVITES,
} from './demo/forms-automations.data'
import { ensureSystemRoles } from './lib/roles'
import { SYSTEM_ROLE_KEYS, type SystemRoleKey } from '../../src/common/permissions'

export type DemoSeedResult = {
  ownerEmail: string
  password: string
  workspaceName: string
  projectName: string
  memberCount: number
  taskCount: number
  sectionCount: number
  formCount: number
  automationCount: number
  notificationCount: number
  inviteCount: number
  skipped: boolean
}

type UserIdResolver = (ref: AssigneeRef) => string | null

async function ensureCustomFields(prisma: PrismaClient, workspaceId: string) {
  await prisma.customFieldDefinition.createMany({
    data: defaultCustomFieldCreateMany(workspaceId),
    skipDuplicates: true,
  })
}

async function wipeDemoWorkspaceContent(
  prisma: PrismaClient,
  workspaceId: string,
) {
  await prisma.notification.deleteMany({ where: { workspaceId } })
  await prisma.workspaceInvite.deleteMany({ where: { workspaceId } })
  await prisma.automationRule.deleteMany({ where: { workspaceId } })
  await prisma.intakeForm.deleteMany({ where: { workspaceId } })
  await prisma.project.deleteMany({ where: { workspaceId } })
}

async function hasCompleteRichSeed(
  prisma: PrismaClient,
  workspaceId: string,
  projectId: string,
): Promise<boolean> {
  const [foundationSection, featureForm, automationCount, taskCount] =
    await Promise.all([
      prisma.projectSection.findFirst({
        where: { projectId, name: 'Foundation' },
        select: { id: true },
      }),
      prisma.intakeForm.findFirst({
        where: {
          workspaceId,
          token: DEMO_INTAKE_FORMS[0].token,
        },
        select: { id: true },
      }),
      prisma.automationRule.count({ where: { workspaceId } }),
      prisma.task.count({ where: { projectId } }),
    ])

  return Boolean(
    foundationSection &&
      featureForm &&
      automationCount >= DEMO_AUTOMATIONS.length &&
      taskCount >= DEMO_TASKS.length,
  )
}

export async function seedDemoBoard(
  prisma: PrismaClient,
  options?: { force?: boolean },
): Promise<DemoSeedResult> {
  const force = options?.force === true
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10)
  const ownerEmail = DEMO_OWNER.email.toLowerCase()

  let owner = await prisma.user.findUnique({ where: { email: ownerEmail } })
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        name: DEMO_OWNER.name,
        passwordHash,
      },
    })
  }

  let workspace = await prisma.workspace.findUnique({
    where: { slug: DEMO_OWNER.slug },
  })

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: DEMO_WORKSPACE_NAME,
        slug: DEMO_OWNER.slug,
      },
    })
  }

  const roleIds = await ensureSystemRoles(prisma, workspace.id)

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: owner.id,
      },
    },
    create: {
      workspaceId: workspace.id,
      userId: owner.id,
      roleId: roleIds[SYSTEM_ROLE_KEYS.PROJECT_MANAGER],
    },
    update: { roleId: roleIds[SYSTEM_ROLE_KEYS.PROJECT_MANAGER] },
  })

  await ensureCustomFields(prisma, workspace.id)

  const teamUsers = await prisma.user.findMany({
    where: { email: { in: [...DEMO_TEAM_EMAILS] } },
  })
  const teamByEmail = new Map(teamUsers.map((u) => [u.email.toLowerCase(), u]))

  const teamRoleByEmail: Record<string, SystemRoleKey> = {
    'ava.chen@asanop.dev': SYSTEM_ROLE_KEYS.ASSISTANT_MANAGER,
    'ben.ortiz@asanop.dev': SYSTEM_ROLE_KEYS.DEVELOPER,
    'chloe.park@asanop.dev': SYSTEM_ROLE_KEYS.DESIGNER,
    'diego.ruiz@asanop.dev': SYSTEM_ROLE_KEYS.DEVELOPER,
    'elena.brooks@asanop.dev': SYSTEM_ROLE_KEYS.DESIGNER,
    'farah.khan@asanop.dev': SYSTEM_ROLE_KEYS.CONTRIBUTOR,
  }

  for (const email of DEMO_TEAM_EMAILS) {
    const user = teamByEmail.get(email.toLowerCase())
    if (!user) continue
    const roleKey = teamRoleByEmail[email.toLowerCase()] ?? SYSTEM_ROLE_KEYS.CONTRIBUTOR
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: user.id,
        },
      },
      create: {
        workspaceId: workspace.id,
        userId: user.id,
        roleId: roleIds[roleKey],
      },
      update: { roleId: roleIds[roleKey] },
    })
  }

  const resolveUserId: UserIdResolver = (ref) => {
    if (ref === 'owner') return owner!.id
    if (ref === null) return null
    const email = DEMO_TEAM_EMAILS[ref]
    return email ? (teamByEmail.get(email.toLowerCase())?.id ?? null) : null
  }

  const existingProject = await prisma.project.findFirst({
    where: {
      workspaceId: workspace.id,
      name: DEMO_PROJECT.name,
    },
    include: {
      _count: {
        select: { tasks: true, sections: true },
      },
    },
  })

  if (
    !force &&
    existingProject &&
    (await hasCompleteRichSeed(prisma, workspace.id, existingProject.id))
  ) {
    const [formCount, automationCount, notificationCount, inviteCount] =
      await Promise.all([
        prisma.intakeForm.count({ where: { workspaceId: workspace.id } }),
        prisma.automationRule.count({ where: { workspaceId: workspace.id } }),
        prisma.notification.count({ where: { workspaceId: workspace.id } }),
        prisma.workspaceInvite.count({ where: { workspaceId: workspace.id } }),
      ])

    return {
      ownerEmail,
      password: SEED_PASSWORD,
      workspaceName: workspace.name,
      projectName: existingProject.name,
      memberCount: 1 + teamUsers.length,
      taskCount: existingProject._count.tasks,
      sectionCount: existingProject._count.sections,
      formCount,
      automationCount,
      notificationCount,
      inviteCount,
      skipped: true,
    }
  }

  const projectCount = await prisma.project.count({
    where: { workspaceId: workspace.id },
  })
  if (force || existingProject || projectCount > 0) {
    await wipeDemoWorkspaceContent(prisma, workspace.id)
  }

  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: DEMO_PROJECT.name,
      description: DEMO_PROJECT.description,
      brief: DEMO_PROJECT.brief,
      createdById: owner.id,
    },
  })

  const sectionIdByKey = new Map<string, string>()
  for (const section of DEMO_SECTIONS) {
    const created = await prisma.projectSection.create({
      data: {
        projectId: project.id,
        name: section.name,
        position: section.position,
      },
    })
    sectionIdByKey.set(section.key, created.id)
  }

  const parents = DEMO_TASKS.filter((t) => !t.parentKey)
  const children = DEMO_TASKS.filter((t) => t.parentKey)
  const taskIdByKey = new Map<string, string>()

  let position = 0
  for (const task of [...parents, ...children]) {
    const created = await prisma.task.create({
      data: {
        projectId: project.id,
        sectionId: sectionIdByKey.get(task.sectionKey) ?? null,
        parentId: task.parentKey
          ? (taskIdByKey.get(task.parentKey) ?? null)
          : null,
        title: task.title,
        description:
          task.description ??
          `Seeded demo task for ${task.title.toLowerCase()}.`,
        status: task.status,
        priority: task.priority,
        dueDate: dateFromOffset(task.dueInDays) ?? undefined,
        startDate: dateFromOffset(task.startInDays) ?? undefined,
        assigneeId: resolveUserId(task.assigneeIndex),
        createdById: owner.id,
        position: position++,
      },
    })
    taskIdByKey.set(task.key, created.id)
  }

  const fieldDefs = await prisma.customFieldDefinition.findMany({
    where: { workspaceId: workspace.id },
  })
  const fieldIdByName = new Map(fieldDefs.map((f) => [f.name, f.id]))

  for (const value of DEMO_FIELD_VALUES) {
    const fieldId = fieldIdByName.get(value.fieldName)
    const taskId = taskIdByKey.get(value.taskKey)
    if (!fieldId || !taskId) continue
    await prisma.customFieldValue.upsert({
      where: { fieldId_taskId: { fieldId, taskId } },
      create: {
        fieldId,
        taskId,
        textValue: value.textValue,
        numberValue: value.numberValue,
        dateValue: dateFromOffset(value.dateValueInDays) ?? undefined,
      },
      update: {
        textValue: value.textValue,
        numberValue: value.numberValue,
        dateValue: dateFromOffset(value.dateValueInDays) ?? undefined,
      },
    })
  }

  for (const dep of DEMO_DEPENDENCIES) {
    const taskId = taskIdByKey.get(dep.taskKey)
    const dependsOnId = taskIdByKey.get(dep.dependsOnKey)
    if (!taskId || !dependsOnId || taskId === dependsOnId) continue
    await prisma.taskDependency.upsert({
      where: {
        taskId_dependsOnId: { taskId, dependsOnId },
      },
      create: { taskId, dependsOnId },
      update: {},
    })
  }

  for (const comment of DEMO_COMMENTS) {
    const taskId = taskIdByKey.get(comment.taskKey)
    const authorId = resolveUserId(comment.authorIndex)
    if (!taskId || !authorId) continue

    const created = await prisma.comment.create({
      data: {
        taskId,
        authorId,
        body: comment.body,
      },
    })

    for (const mention of comment.mentionIndexes ?? []) {
      const userId = resolveUserId(mention)
      if (!userId) continue
      await prisma.commentMention.upsert({
        where: {
          commentId_userId: { commentId: created.id, userId },
        },
        create: { commentId: created.id, userId },
        update: {},
      })
    }
  }

  for (const event of DEMO_ACTIVITY) {
    const taskId = taskIdByKey.get(event.taskKey)
    const actorId = resolveUserId(event.actorIndex)
    if (!taskId || !actorId) continue
    const createdAt = dateFromOffset(-(event.createdDaysAgo ?? 0)) ?? new Date()
    await prisma.activityEvent.create({
      data: {
        taskId,
        actorId,
        type: event.type,
        meta: event.meta as Prisma.InputJsonValue | undefined,
        createdAt,
      },
    })
  }

  for (const form of DEMO_INTAKE_FORMS) {
    await prisma.intakeForm.create({
      data: {
        workspaceId: workspace.id,
        projectId: project.id,
        name: form.name,
        description: form.description,
        token: form.token,
        createdById: owner.id,
        defaultAssigneeId: resolveUserId(form.defaultAssigneeIndex),
        defaultStatus: form.defaultStatus,
        titleTemplate: form.titleTemplate,
        fields: {
          create: form.fields.map((field) => ({
            key: field.key,
            label: field.label,
            type: field.type,
            required: field.required,
            options: 'options' in field ? field.options : undefined,
            customFieldId:
              'customFieldName' in field && field.customFieldName
                ? (fieldIdByName.get(field.customFieldName) ?? null)
                : null,
            position: field.position,
          })),
        },
      },
    })
  }

  for (const rule of DEMO_AUTOMATIONS) {
    await prisma.automationRule.create({
      data: {
        workspaceId: workspace.id,
        projectId: rule.projectScoped ? project.id : null,
        name: rule.name,
        trigger: rule.trigger,
        triggerFromStatus: rule.triggerFromStatus,
        triggerToStatus: rule.triggerToStatus,
        action: rule.action,
        actionStatus: rule.actionStatus,
        actionAssigneeId:
          rule.actionAssigneeIndex !== undefined
            ? resolveUserId(rule.actionAssigneeIndex)
            : null,
        actionComment: rule.actionComment,
        isActive: true,
      },
    })
  }

  for (const invite of DEMO_PENDING_INVITES) {
    await prisma.workspaceInvite.upsert({
      where: { token: invite.token },
      create: {
        workspaceId: workspace.id,
        email: invite.email.toLowerCase(),
        token: invite.token,
        roleId: roleIds[invite.roleKey],
        status: 'PENDING',
        expiresAt: dateFromOffset(invite.expiresInDays) ?? new Date(),
        createdById: owner.id,
      },
      update: {
        status: 'PENDING',
        roleId: roleIds[invite.roleKey],
        expiresAt: dateFromOffset(invite.expiresInDays) ?? new Date(),
      },
    })
  }

  for (const notif of DEMO_NOTIFICATIONS) {
    const userId = resolveUserId(notif.userIndex)
    const taskId = taskIdByKey.get(notif.taskKey)
    if (!userId || !taskId) continue
    const createdAt =
      dateFromOffset(-(notif.createdDaysAgo ?? 0)) ?? new Date()
    await prisma.notification.create({
      data: {
        workspaceId: workspace.id,
        userId,
        actorId: resolveUserId(notif.actorIndex),
        taskId,
        type: notif.type as NotificationType,
        title: notif.title,
        body: notif.body,
        readAt: notif.read ? createdAt : null,
        createdAt,
      },
    })
  }

  const [
    taskCount,
    sectionCount,
    formCount,
    automationCount,
    notificationCount,
    inviteCount,
  ] = await Promise.all([
    prisma.task.count({ where: { projectId: project.id } }),
    prisma.projectSection.count({ where: { projectId: project.id } }),
    prisma.intakeForm.count({ where: { workspaceId: workspace.id } }),
    prisma.automationRule.count({ where: { workspaceId: workspace.id } }),
    prisma.notification.count({ where: { workspaceId: workspace.id } }),
    prisma.workspaceInvite.count({ where: { workspaceId: workspace.id } }),
  ])

  return {
    ownerEmail,
    password: SEED_PASSWORD,
    workspaceName: workspace.name,
    projectName: project.name,
    memberCount: 1 + teamUsers.length,
    taskCount,
    sectionCount,
    formCount,
    automationCount,
    notificationCount,
    inviteCount,
    skipped: false,
  }
}
