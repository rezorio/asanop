import type { Task, TaskPriority, TaskStatus } from '@/types'

export type TaskSortKey =
  | 'section'
  | 'title'
  | 'status'
  | 'assignee'
  | 'priority'
  | 'dueDate'

export type SortDirection = 'asc' | 'desc'

export type TaskSortRule = {
  key: TaskSortKey
  direction: SortDirection
}

export const TASK_SORT_OPTIONS: Array<{ value: TaskSortKey; label: string }> = [
  { value: 'section', label: 'Section' },
  { value: 'title', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due date' },
]

const STATUS_ORDER: Record<TaskStatus, number> = {
  TODO: 0,
  IN_PROGRESS: 1,
  DONE: 2,
}

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
  NONE: 3,
}

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })
}

function compareNullableDates(a?: string | null, b?: string | null): number {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  return new Date(a).getTime() - new Date(b).getTime()
}

function compareByKey(a: Task, b: Task, key: TaskSortKey): number {
  switch (key) {
    case 'title':
      return compareStrings(a.title, b.title)
    case 'status':
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    case 'assignee': {
      const left = a.assignee?.name ?? ''
      const right = b.assignee?.name ?? ''
      if (!left && right) return 1
      if (left && !right) return -1
      return compareStrings(left, right)
    }
    case 'priority':
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    case 'dueDate':
      return compareNullableDates(a.dueDate, b.dueDate)
    case 'section':
      return (a.section?.position ?? 9999) - (b.section?.position ?? 9999)
    default:
      return 0
  }
}

export function compareTasks(a: Task, b: Task, rules: TaskSortRule[]): number {
  for (const rule of rules) {
    const result = compareByKey(a, b, rule.key)
    if (result !== 0) {
      return rule.direction === 'asc' ? result : -result
    }
  }
  return compareStrings(a.title, b.title)
}

export function sortTasks(tasks: Task[], rules: TaskSortRule[]): Task[] {
  return [...tasks].sort((a, b) => compareTasks(a, b, rules))
}

export function sortLabel(rules: TaskSortRule[]): string {
  const labels = Object.fromEntries(TASK_SORT_OPTIONS.map((option) => [option.value, option.label]))
  return rules
    .map((rule) => `${labels[rule.key]} ${rule.direction === 'asc' ? '↑' : '↓'}`)
    .join(' · then ')
}
