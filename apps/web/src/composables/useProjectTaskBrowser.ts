import { computed, ref, type Ref } from 'vue'
import type { ProjectSection, Task, TaskStatus } from '@/types'
import { STATUS_LABELS, STATUSES } from '@/types'
import {
  emptyFilters,
  filterTasks,
  groupTasks,
  hasActiveFilters,
  type ListFilters,
  type ListGroup,
  type ListGroupBy,
} from '@/lib/projectListQuery'
import { sortTasks, type SortDirection, type TaskSortKey } from '@/lib/taskSort'

function unrefValue<T>(source: Ref<T> | (() => T)): T {
  return typeof source === 'function' ? source() : source.value
}

export type BoardColumn = ListGroup & {
  status?: TaskStatus
}

export function useProjectTaskBrowser(options: {
  tasks: Ref<Task[]> | (() => Task[])
  sections: Ref<ProjectSection[]> | (() => ProjectSection[])
  currentUserId: Ref<string | null | undefined> | (() => string | null | undefined)
  defaultGroupBy?: ListGroupBy
}) {
  const query = ref('')
  const filters = ref<ListFilters>(emptyFilters())
  const groupBy = ref<ListGroupBy>(options.defaultGroupBy ?? 'section')
  const sortKey = ref<TaskSortKey>('dueDate')
  const sortDirection = ref<SortDirection>('asc')

  const allTasks = computed(() => unrefValue(options.tasks))
  const total = computed(() => allTasks.value.length)

  const sortRules = computed(() => [
    { key: sortKey.value, direction: sortDirection.value },
  ])

  const filteredTasks = computed(() =>
    filterTasks(
      allTasks.value,
      filters.value,
      query.value,
      unrefValue(options.currentUserId),
    ),
  )

  const visibleCount = computed(() => filteredTasks.value.length)
  const filtering = computed(() => hasActiveFilters(filters.value, query.value))

  const listGroups = computed((): ListGroup[] => {
    const rules = sortRules.value
    const userId = unrefValue(options.currentUserId)

    if (groupBy.value === 'section') {
      const sections = unrefValue(options.sections)
      const groups = sections.map((section) => ({
        id: section.id,
        label: section.name,
        tasks: sortTasks(
          filterTasks(
            allTasks.value.filter((task) => task.sectionId === section.id),
            filters.value,
            query.value,
            userId,
          ),
          rules,
        ),
      }))

      const unsectioned = sortTasks(
        filterTasks(
          allTasks.value.filter((task) => !task.sectionId),
          filters.value,
          query.value,
          userId,
        ),
        rules,
      )

      if (unsectioned.length) {
        groups.push({ id: '__none__', label: 'No section', tasks: unsectioned })
      }

      return groups.filter((group) => group.tasks.length > 0 || !filtering.value)
    }

    return groupTasks(filteredTasks.value, groupBy.value, rules)
  })

  const boardColumns = computed((): BoardColumn[] => {
    const rules = sortRules.value

    if (groupBy.value === 'status') {
      return STATUSES.map((status) => ({
        id: status,
        label: STATUS_LABELS[status],
        status,
        tasks: sortTasks(
          filteredTasks.value.filter((task) => task.status === status),
          rules,
        ),
      }))
    }

    return groupTasks(filteredTasks.value, groupBy.value, rules).map((group) => ({
      ...group,
      status: undefined,
    }))
  })

  function resetControls() {
    query.value = ''
    filters.value = emptyFilters()
    groupBy.value = options.defaultGroupBy ?? 'section'
    sortKey.value = 'dueDate'
    sortDirection.value = 'asc'
  }

  return {
    query,
    filters,
    groupBy,
    sortKey,
    sortDirection,
    total,
    visibleCount,
    filtering,
    listGroups,
    boardColumns,
    resetControls,
  }
}
