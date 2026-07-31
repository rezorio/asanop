import type { Permission } from '@/types'
import { useAuthStore } from '@/stores/auth'

export function hasPermission(
  permissions: readonly string[] | undefined | null,
  required: Permission | Permission[],
): boolean {
  if (!permissions?.length) return false
  const needed = Array.isArray(required) ? required : [required]
  return needed.every((p) => permissions.includes(p))
}

export function useWorkspacePermission(permission: Permission | Permission[]) {
  const auth = useAuthStore()
  return () => hasPermission(auth.activeWorkspace?.permissions, permission)
}
