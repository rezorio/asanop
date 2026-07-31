import type { PrismaClient, Prisma } from '@prisma/client'
import {
  SYSTEM_ROLE_DEFINITIONS,
  SYSTEM_ROLE_KEYS,
  type SystemRoleKey,
} from '../../../src/common/permissions'

type Tx = Prisma.TransactionClient | PrismaClient

export async function ensureSystemRoles(
  tx: Tx,
  workspaceId: string,
): Promise<Record<SystemRoleKey, string>> {
  const existing = await tx.workspaceRole.findMany({
    where: { workspaceId },
    select: { id: true, key: true },
  })
  const byKey = new Map(existing.map((r) => [r.key, r.id]))

  for (const def of SYSTEM_ROLE_DEFINITIONS) {
    if (byKey.has(def.key)) continue
    const created = await tx.workspaceRole.create({
      data: {
        workspaceId,
        name: def.name,
        key: def.key,
        isSystem: true,
        permissions: def.permissions,
      },
    })
    byKey.set(def.key, created.id)
  }

  return {
    [SYSTEM_ROLE_KEYS.PROJECT_MANAGER]: byKey.get(
      SYSTEM_ROLE_KEYS.PROJECT_MANAGER,
    )!,
    [SYSTEM_ROLE_KEYS.ASSISTANT_MANAGER]: byKey.get(
      SYSTEM_ROLE_KEYS.ASSISTANT_MANAGER,
    )!,
    [SYSTEM_ROLE_KEYS.DEVELOPER]: byKey.get(SYSTEM_ROLE_KEYS.DEVELOPER)!,
    [SYSTEM_ROLE_KEYS.DESIGNER]: byKey.get(SYSTEM_ROLE_KEYS.DESIGNER)!,
    [SYSTEM_ROLE_KEYS.CONTRIBUTOR]: byKey.get(SYSTEM_ROLE_KEYS.CONTRIBUTOR)!,
  }
}
