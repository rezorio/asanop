export function formatActivityMessage(
  type: string,
  meta?: Record<string, unknown> | null,
): string {
  switch (type) {
    case 'TASK_CREATED':
      return 'created this task'
    case 'SUBTASK_CREATED':
      return 'added a subtask'
    case 'STATUS_CHANGED': {
      const to = meta?.to ?? meta?.status
      return to ? `moved to ${String(to).replace('_', ' ').toLowerCase()}` : 'changed status'
    }
    case 'ASSIGNEE_CHANGED':
      return 'updated assignee'
    case 'COMMENT_ADDED':
      return 'commented'
    default:
      return type.replace(/_/g, ' ').toLowerCase()
  }
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
