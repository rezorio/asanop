import type { Task, TaskPriority, TaskStatus } from '@/types'
import { STATUS_LABELS } from '@/types'
import { getDueUrgency } from '@/lib/taskDue'
import { sortTasks, type SortDirection, type TaskSortKey } from '@/lib/taskSort'

export type ListGroupBy = 'section' | 'assignee' | 'status' | 'priority' | 'dueDate' | 'none'

export type ListFilters = {
  assigneeIds: string[]
  includeUnassigned: boolean
  statuses: TaskStatus[]
  priorities: TaskPriority[]
  onlyMine: boolean
}

export type ListGroup = {
  id: string
  label: string
  tasks: Task[]
}

export function emptyFilters(): ListFilters {
  return {
    assigneeIds: [],
    includeUnassigned: false,
    statuses: [],
    priorities: [],
    onlyMine: false,
  }
}

export function hasActiveFilters(filters: ListFilters, query: string): boolean {
  return (
    Boolean(query.trim()) ||
    filters.onlyMine ||
    filters.assigneeIds.length > 0 ||
    filters.includeUnassigned ||
    filters.statuses.length > 0 ||
    filters.priorities.length > 0
  )
}

export function filterTasks(
  tasks: Task[],
  filters: ListFilters,
  query: string,
  currentUserId?: string | null,
): Task[] {
  const q = query.trim().toLowerCase()

  return tasks.filter((task) => {
    if (filters.onlyMine) {
      if (!currentUserId || task.assigneeId !== currentUserId) return false
    }

    const assigneeFilterOn =
      filters.assigneeIds.length > 0 || filters.includeUnassigned
    if (assigneeFilterOn) {
      const matchesAssignee =
        (task.assigneeId && filters.assigneeIds.includes(task.assigneeId)) ||
        (!task.assigneeId && filters.includeUnassigned)
      if (!matchesAssignee) return false
    }

    if (filters.statuses.length && !filters.statuses.includes(task.status)) {
      return false
    }

    if (filters.priorities.length && !filters.priorities.includes(task.priority)) {
      return false
    }

    if (q) {
      const haystack = [
        task.title,
        task.assignee?.name ?? '',
        task.section?.name ?? '',
        task.parent?.title ?? '',
        task.description ?? '',
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }

    return true
  })
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  HIGH: 'High priority',
  MEDIUM: 'Medium priority',
  LOW: 'Low priority',
  NONE: 'No priority',
}

const DUE_GROUP_ORDER = ['overdue', 'today', 'soon', 'later', 'none'] as const
const DUE_GROUP_LABELS: Record<(typeof DUE_GROUP_ORDER)[number], string> = {
  overdue: 'Overdue',
  today: 'Due today',
  soon: 'Due soon',
  later: 'Later',
  none: 'No due date',
}

export function groupTasks(
  tasks: Task[],
  groupBy: ListGroupBy,
  sortedRules: Array<{ key: TaskSortKey; direction: SortDirection }>,
): ListGroup[] {
  if (groupBy === 'none') {
    return [
      {
        id: 'all',
        label: 'All tasks',
        tasks: sortTasks(tasks, sortedRules),
      },
    ]
  }

  if (groupBy === 'section') {
    const map = new Map<string, ListGroup>()
    for (const task of tasks) {
      const id = task.sectionId ?? '__none__'
      const label = task.section?.name ?? 'No section'
      if (!map.has(id)) {
        map.set(id, { id, label, tasks: [] })
      }
      map.get(id)!.tasks.push(task)
    }
    return [...map.values()]
      .map((group) => ({
        ...group,
        tasks: sortTasks(group.tasks, sortedRules),
      }))
      .sort((a, b) => {
        const posA = a.tasks[0]?.section?.position ?? 9999
        const posB = b.tasks[0]?.section?.position ?? 9999
        return posA - posB || a.label.localeCompare(b.label)
      })
  }

  if (groupBy === 'assignee') {
    const map = new Map<string, ListGroup>()
    for (const task of tasks) {
      const id = task.assigneeId ?? '__unassigned__'
      const label = task.assignee?.name ?? 'Unassigned'
      if (!map.has(id)) map.set(id, { id, label, tasks: [] })
      map.get(id)!.tasks.push(task)
    }
    return [...map.values()]
      .map((group) => ({ ...group, tasks: sortTasks(group.tasks, sortedRules) }))
      .sort((a, b) => {
        if (a.id === '__unassigned__') return 1
        if (b.id === '__unassigned__') return -1
        return a.label.localeCompare(b.label)
      })
  }

  if (groupBy === 'status') {
    const order: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE']
    return order
      .map((status) => ({
        id: status,
        label: STATUS_LABELS[status],
        tasks: sortTasks(
          tasks.filter((task) => task.status === status),
          sortedRules,
        ),
      }))
      .filter((group) => group.tasks.length > 0)
  }

  if (groupBy === 'priority') {
    const order: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW', 'NONE']
    return order
      .map((priority) => ({
        id: priority,
        label: PRIORITY_LABELS[priority],
        tasks: sortTasks(
          tasks.filter((task) => task.priority === priority),
          sortedRules,
        ),
      }))
      .filter((group) => group.tasks.length > 0)
  }

  // dueDate
  const buckets = new Map<(typeof DUE_GROUP_ORDER)[number], Task[]>()
  for (const key of DUE_GROUP_ORDER) buckets.set(key, [])
  for (const task of tasks) {
    buckets.get(getDueUrgency(task.dueDate))!.push(task)
  }
  return DUE_GROUP_ORDER.map((key) => ({
    id: key,
    label: DUE_GROUP_LABELS[key],
    tasks: sortTasks(buckets.get(key) ?? [], sortedRules),
  })).filter((group) => group.tasks.length > 0)
}
