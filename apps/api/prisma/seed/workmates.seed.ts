import * as bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { defaultCustomFieldCreateMany } from '../../src/custom-fields/default-fields'
import { SEED_PASSWORD, WORKMATES } from './workmates.data'
import { ensureSystemRoles } from './lib/roles'
import { SYSTEM_ROLE_KEYS } from '../../src/common/permissions'

async function ensureCustomFields(prisma: PrismaClient, workspaceId: string) {
  await prisma.customFieldDefinition.createMany({
    data: defaultCustomFieldCreateMany(workspaceId),
    skipDuplicates: true,
  })
}

export async function seedWorkmates(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10)
  const results: { email: string; created: boolean }[] = []

  for (const mate of WORKMATES) {
    const email = mate.email.toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email } })

    if (existing) {
      const workspace = await prisma.workspace.findUnique({
        where: { slug: mate.slug },
      })
      if (workspace) {
        await ensureSystemRoles(prisma, workspace.id)
        await ensureCustomFields(prisma, workspace.id)
      }
      results.push({ email, created: false })
      continue
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name: mate.name,
          passwordHash,
        },
      })

      const workspace = await tx.workspace.create({
        data: {
          name: `${mate.name}'s Workspace`,
          slug: mate.slug,
        },
      })

      const roleIds = await ensureSystemRoles(tx, workspace.id)

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          roleId: roleIds[SYSTEM_ROLE_KEYS.PROJECT_MANAGER],
        },
      })

      await tx.customFieldDefinition.createMany({
        data: defaultCustomFieldCreateMany(workspace.id),
      })
    })

    results.push({ email, created: true })
  }

  return results
}
