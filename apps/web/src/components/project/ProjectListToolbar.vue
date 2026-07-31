<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  Check,
  Filter,
  Plus,
  Search,
  UserRound,
  X,
} from 'lucide-vue-next'
import AppSelect from '@/components/AppSelect.vue'
import type { TaskPriority, TaskStatus, WorkspaceMember } from '@/types'
import { STATUS_LABELS, STATUSES } from '@/types'
import type { SortDirection, TaskSortKey } from '@/lib/taskSort'
import type { ListFilters, ListGroupBy } from '@/lib/projectListQuery'
import { hasActiveFilters } from '@/lib/projectListQuery'

const props = defineProps<{
  query: string
  filters: ListFilters
  groupBy: ListGroupBy
  sortKey: TaskSortKey
  sortDirection: SortDirection
  members: WorkspaceMember[]
  currentUserId?: string | null
  visibleCount: number
  totalCount: number
  canCreate?: boolean
}>()

const emit = defineEmits<{
  'update:query': [value: string]
  'update:filters': [value: ListFilters]
  'update:groupBy': [value: ListGroupBy]
  'update:sortKey': [value: TaskSortKey]
  'update:sortDirection': [value: SortDirection]
  reset: []
  create: []
}>()

const allowCreate = computed(() => props.canCreate === true)

const filterOpen = ref(false)
const filterRoot = ref<HTMLElement | null>(null)

const groupOptions: Array<{ value: ListGroupBy; label: string }> = [
  { value: 'section', label: 'Section' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'none', label: 'None' },
]

const sortOptions: Array<{ value: TaskSortKey; label: string }> = [
  { value: 'dueDate', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'title', label: 'Alphabetical' },
  { value: 'section', label: 'Section' },
]

const filtersActive = computed(() => hasActiveFilters(props.filters, props.query))

const chips = computed(() => {
  const items: Array<{ id: string; label: string; clear: () => void }> = []

  if (props.filters.onlyMine) {
    items.push({
      id: 'mine',
      label: 'Assigned to me',
      clear: () => patchFilters({ onlyMine: false }),
    })
  }

  for (const id of props.filters.assigneeIds) {
    const member = props.members.find((item) => item.user.id === id)
    items.push({
      id: `assignee-${id}`,
      label: member?.user.name ?? 'Assignee',
      clear: () =>
        patchFilters({
          assigneeIds: props.filters.assigneeIds.filter((value) => value !== id),
        }),
    })
  }

  if (props.filters.includeUnassigned) {
    items.push({
      id: 'unassigned',
      label: 'Unassigned',
      clear: () => patchFilters({ includeUnassigned: false }),
    })
  }

  for (const status of props.filters.statuses) {
    items.push({
      id: `status-${status}`,
      label: STATUS_LABELS[status],
      clear: () =>
        patchFilters({
          statuses: props.filters.statuses.filter((value) => value !== status),
        }),
    })
  }

  for (const priority of props.filters.priorities) {
    items.push({
      id: `priority-${priority}`,
      label: priority === 'NONE' ? 'No priority' : `${priority[0]}${priority.slice(1).toLowerCase()}`,
      clear: () =>
        patchFilters({
          priorities: props.filters.priorities.filter((value) => value !== priority),
        }),
    })
  }

  return items
})

function patchFilters(partial: Partial<ListFilters>) {
  emit('update:filters', { ...props.filters, ...partial })
}

function toggleMine() {
  const next = !props.filters.onlyMine
  patchFilters({
    onlyMine: next,
    // "Only my tasks" replaces other assignee filters for clarity
    assigneeIds: next ? [] : props.filters.assigneeIds,
    includeUnassigned: next ? false : props.filters.includeUnassigned,
  })
}

function toggleAssignee(userId: string) {
  const exists = props.filters.assigneeIds.includes(userId)
  patchFilters({
    onlyMine: false,
    assigneeIds: exists
      ? props.filters.assigneeIds.filter((id) => id !== userId)
      : [...props.filters.assigneeIds, userId],
  })
}

function toggleUnassigned() {
  patchFilters({
    onlyMine: false,
    includeUnassigned: !props.filters.includeUnassigned,
  })
}

function toggleStatus(status: TaskStatus) {
  const exists = props.filters.statuses.includes(status)
  patchFilters({
    statuses: exists
      ? props.filters.statuses.filter((value) => value !== status)
      : [...props.filters.statuses, status],
  })
}

function togglePriority(priority: TaskPriority) {
  const exists = props.filters.priorities.includes(priority)
  patchFilters({
    priorities: exists
      ? props.filters.priorities.filter((value) => value !== priority)
      : [...props.filters.priorities, priority],
  })
}

function onClickOutside(event: MouseEvent) {
  if (filterRoot.value && !filterRoot.value.contains(event.target as Node)) {
    filterOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div class="space-y-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
    <div class="flex flex-col gap-2 lg:flex-row lg:items-center">
      <div class="relative min-w-0 flex-1">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          :value="query"
          type="search"
          class="field !pl-9"
          placeholder="Search tasks…"
          @input="emit('update:query', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition"
          :class="
            filters.onlyMine
              ? 'border-brand bg-brand-soft text-brand'
              : 'border-line bg-surface text-charcoal hover:border-brand/40'
          "
          @click="toggleMine"
        >
          <UserRound class="h-4 w-4" aria-hidden="true" />
          Only my tasks
        </button>

        <div ref="filterRoot" class="relative">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition"
            :class="
              filtersActive && !filters.onlyMine
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-line bg-surface text-charcoal hover:border-brand/40'
            "
            @click.stop="filterOpen = !filterOpen"
          >
            <Filter class="h-4 w-4" aria-hidden="true" />
            Filter
          </button>

          <div
            v-if="filterOpen"
            class="absolute right-0 z-30 mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-line bg-surface p-3 shadow-lg"
            @click.stop
          >
            <div class="mb-3">
              <p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Assignee
              </p>
              <div class="max-h-36 space-y-1 overflow-y-auto">
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-canvas"
                  @click="toggleUnassigned"
                >
                  <span>Unassigned</span>
                  <Check v-if="filters.includeUnassigned" class="h-4 w-4 text-brand" />
                </button>
                <button
                  v-for="member in members"
                  :key="member.user.id"
                  type="button"
                  class="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-canvas"
                  @click="toggleAssignee(member.user.id)"
                >
                  <span class="truncate">
                    {{ member.user.name }}
                    <span
                      v-if="member.user.id === currentUserId"
                      class="text-muted"
                    > · you</span>
                  </span>
                  <Check
                    v-if="filters.assigneeIds.includes(member.user.id)"
                    class="h-4 w-4 shrink-0 text-brand"
                  />
                </button>
              </div>
            </div>

            <div class="mb-3 border-t border-line pt-3">
              <p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Status
              </p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="status in STATUSES"
                  :key="status"
                  type="button"
                  class="rounded-full border px-2.5 py-1 text-xs font-medium transition"
                  :class="
                    filters.statuses.includes(status)
                      ? 'border-brand bg-brand-soft text-brand'
                      : 'border-line text-muted hover:text-charcoal'
                  "
                  @click="toggleStatus(status)"
                >
                  {{ STATUS_LABELS[status] }}
                </button>
              </div>
            </div>

            <div class="border-t border-line pt-3">
              <p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Priority
              </p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="priority in (['HIGH', 'MEDIUM', 'LOW', 'NONE'] as TaskPriority[])"
                  :key="priority"
                  type="button"
                  class="rounded-full border px-2.5 py-1 text-xs font-medium transition"
                  :class="
                    filters.priorities.includes(priority)
                      ? 'border-brand bg-brand-soft text-brand'
                      : 'border-line text-muted hover:text-charcoal'
                  "
                  @click="togglePriority(priority)"
                >
                  {{ priority === 'NONE' ? 'None' : priority[0] + priority.slice(1).toLowerCase() }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="min-w-[9.5rem]">
          <AppSelect
            variant="compact"
            :model-value="groupBy"
            :options="groupOptions.map((option) => ({ value: option.value, label: `Group: ${option.label}` }))"
            @update:model-value="emit('update:groupBy', $event as ListGroupBy)"
          />
        </div>

        <div class="min-w-[10rem]">
          <AppSelect
            variant="compact"
            :model-value="sortKey"
            :options="sortOptions.map((option) => ({ value: option.value, label: `Sort: ${option.label}` }))"
            @update:model-value="emit('update:sortKey', $event as TaskSortKey)"
          />
        </div>

        <button
          type="button"
          class="rounded-lg border border-line px-2.5 py-2 text-xs font-medium text-muted hover:text-charcoal"
          :title="sortDirection === 'asc' ? 'Ascending' : 'Descending'"
          @click="emit('update:sortDirection', sortDirection === 'asc' ? 'desc' : 'asc')"
        >
          {{ sortDirection === 'asc' ? 'Asc' : 'Desc' }}
        </button>

        <button
          v-if="allowCreate"
          type="button"
          class="btn-primary inline-flex items-center gap-1.5"
          @click="emit('create')"
        >
          <Plus class="h-4 w-4" aria-hidden="true" />
          New task
        </button>
      </div>
    </div>

    <div v-if="chips.length || filtersActive" class="flex flex-wrap items-center gap-2">
      <button
        v-for="chip in chips"
        :key="chip.id"
        type="button"
        class="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand"
        @click="chip.clear()"
      >
        {{ chip.label }}
        <X class="h-3 w-3" aria-hidden="true" />
      </button>
      <span class="text-xs text-muted">
        {{ visibleCount }} of {{ totalCount }} tasks
      </span>
      <button
        v-if="filtersActive"
        type="button"
        class="text-xs font-medium text-muted hover:text-charcoal"
        @click="emit('reset')"
      >
        Clear all
      </button>
    </div>
  </div>
</template>
