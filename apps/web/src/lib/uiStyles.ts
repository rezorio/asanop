import type { TaskPriority, TaskStatus } from '@/types'

export const STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  TODO: 'badge-status badge-todo',
  IN_PROGRESS: 'badge-status badge-progress',
  DONE: 'badge-status badge-done',
}

export const STATUS_SOLID_CLASS: Record<TaskStatus, string> = {
  TODO: 'bg-todo text-white',
  IN_PROGRESS: 'bg-progress text-white',
  DONE: 'bg-done text-white',
}

export const STATUS_SOFT_CLASS: Record<TaskStatus, string> = {
  TODO: 'bg-todo-soft text-todo',
  IN_PROGRESS: 'bg-progress-soft text-progress',
  DONE: 'bg-done-soft text-done',
}

export const STATUS_TEXT_CLASS: Record<TaskStatus, string> = {
  TODO: 'text-todo',
  IN_PROGRESS: 'text-progress',
  DONE: 'text-done',
}

export const STATUS_COLUMN_CLASS: Record<TaskStatus, string> = {
  TODO: 'column-status column-todo',
  IN_PROGRESS: 'column-status column-progress',
  DONE: 'column-status column-done',
}

export const STATUS_DOT_CLASS: Record<TaskStatus, string> = {
  TODO: 'bg-todo',
  IN_PROGRESS: 'bg-progress',
  DONE: 'bg-done',
}

export const PRIORITY_BADGE_CLASS: Record<TaskPriority, string> = {
  NONE: 'badge-status badge-priority-none',
  LOW: 'badge-status badge-priority-low',
  MEDIUM: 'badge-status badge-priority-medium',
  HIGH: 'badge-status badge-priority-high',
}

export type BucketAccent = 'overdue' | 'today' | 'upcoming' | 'later'

export const BUCKET_ACCENT_CLASS: Record<BucketAccent, string> = {
  overdue: 'section-accent section-overdue',
  today: 'section-accent section-today',
  upcoming: 'section-accent section-upcoming',
  later: 'section-accent section-later',
}
