import { ForbiddenException } from '@nestjs/common'

export const PERMISSIONS = [
  'workspace.manage',
  'roles.manage',
  'members.invite',
  'members.manage',
  'projects.create',
  'projects.manage',
  'tasks.create',
  'tasks.edit_any',
  'tasks.delete',
  'custom_fields.manage',
  'automations.manage',
  'intake_forms.manage',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const ALL_PERMISSIONS: Permission[] = [...PERMISSIONS]

export const SYSTEM_ROLE_KEYS = {
  PROJECT_MANAGER: 'project_manager',
  ASSISTANT_MANAGER: 'assistant_manager',
  DEVELOPER: 'developer',
  DESIGNER: 'designer',
  CONTRIBUTOR: 'contributor',
} as const

export type SystemRoleKey =
  (typeof SYSTEM_ROLE_KEYS)[keyof typeof SYSTEM_ROLE_KEYS]

export type SystemRoleDefinition = {
  key: SystemRoleKey
  name: string
  permissions: Permission[]
}

const ASSISTANT_PERMISSIONS: Permission[] = ALL_PERMISSIONS.filter(
  (p) => p !== 'workspace.manage' && p !== 'roles.manage',
)

export const SYSTEM_ROLE_DEFINITIONS: SystemRoleDefinition[] = [
  {
    key: SYSTEM_ROLE_KEYS.PROJECT_MANAGER,
    name: 'Project Manager',
    permissions: ALL_PERMISSIONS,
  },
  {
    key: SYSTEM_ROLE_KEYS.ASSISTANT_MANAGER,
    name: 'Assistant Manager',
    permissions: ASSISTANT_PERMISSIONS,
  },
  {
    key: SYSTEM_ROLE_KEYS.DEVELOPER,
    name: 'Developer',
    permissions: [],
  },
  {
    key: SYSTEM_ROLE_KEYS.DESIGNER,
    name: 'Designer',
    permissions: [],
  },
  {
    key: SYSTEM_ROLE_KEYS.CONTRIBUTOR,
    name: 'Contributor',
    permissions: [],
  },
]

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value)
}

export function hasPermission(
  permissions: readonly string[] | undefined | null,
  required: Permission | Permission[],
): boolean {
  if (!permissions?.length) return false
  const needed = Array.isArray(required) ? required : [required]
  return needed.every((p) => permissions.includes(p))
}

export function assertPermission(
  permissions: readonly string[] | undefined | null,
  required: Permission | Permission[],
) {
  if (!hasPermission(permissions, required)) {
    throw new ForbiddenException('Insufficient workspace permissions')
  }
}

export function slugifyRoleKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'custom_role'
}

/** Create the five system roles for a workspace. Returns keyed by system key. */
export async function seedSystemRoles(
  tx: {
    workspaceRole: {
      create: (args: {
        data: {
          workspaceId: string
          name: string
          key: string
          isSystem: boolean
          permissions: string[]
        }
      }) => Promise<{ id: string; key: string }>
    }
  },
  workspaceId: string,
): Promise<Record<SystemRoleKey, { id: string; key: string }>> {
  const result = {} as Record<SystemRoleKey, { id: string; key: string }>
  for (const def of SYSTEM_ROLE_DEFINITIONS) {
    const role = await tx.workspaceRole.create({
      data: {
        workspaceId,
        name: def.name,
        key: def.key,
        isSystem: true,
        permissions: def.permissions,
      },
    })
    result[def.key] = { id: role.id, key: role.key }
  }
  return result
}
