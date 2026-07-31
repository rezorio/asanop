import type { Task } from '@/types'

export type DueUrgency = 'overdue' | 'today' | 'soon' | 'later' | 'none'

export function getDueUrgency(dueDate?: string | null): DueUrgency {
  if (!dueDate) return 'none'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff <= 7) return 'soon'
  return 'later'
}

export function formatDueLabel(dueDate?: string | null): string {
  if (!dueDate) return 'No date'
  const date = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(date)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000)

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff < 0) return `${Math.abs(diff)}d late`
  if (diff <= 7) return `In ${diff}d`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function initials(name?: string | null): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function openTaskCount(tasks: Task[]): number {
  return tasks.filter((task) => task.status !== 'DONE').length
}

export function doneTaskCount(tasks: Task[]): number {
  return tasks.filter((task) => task.status === 'DONE').length
}
