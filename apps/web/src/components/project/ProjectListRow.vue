<script setup lang="ts">
import { computed } from 'vue'
import { Ban, CalendarDays, ListTree } from 'lucide-vue-next'
import type { Task, TaskStatus } from '@/types'
import AppSelect from '@/components/AppSelect.vue'
import PriorityBadge from '@/components/ui/PriorityBadge.vue'
import { STATUS_LABELS, STATUSES } from '@/types'
import { formatDueLabel, getDueUrgency, initials } from '@/lib/taskDue'
import { STATUS_SOFT_CLASS } from '@/lib/uiStyles'

const props = defineProps<{
  task: Task
  index: number
}>()

const emit = defineEmits<{
  open: []
  move: [status: TaskStatus]
}>()

const statusOptions = STATUSES.map((status) => ({
  value: status,
  label: STATUS_LABELS[status],
}))

const urgency = computed(() =>
  getDueUrgency(props.task.dueDate, props.task.status),
)
const dueLabel = computed(() =>
  formatDueLabel(props.task.dueDate, props.task.status),
)
const isDone = computed(() => props.task.status === 'DONE')

const railClass = computed(() => {
  if (props.task.isBlocked) return 'bg-overdue'
  if (urgency.value === 'overdue') return 'bg-danger'
  if (props.task.status === 'IN_PROGRESS') return 'bg-progress'
  if (props.task.status === 'DONE') return 'bg-done'
  if (urgency.value === 'today') return 'bg-brand'
  return 'bg-todo'
})

const dueClass = computed(() => {
  if (urgency.value === 'overdue') return 'text-danger'
  if (urgency.value === 'today') return 'text-brand'
  if (urgency.value === 'soon') return 'text-upcoming'
  return 'text-muted'
})

const subtaskLabel = computed(() => {
  const progress = props.task.subtaskProgress
  if (!progress?.total) return null
  return `${progress.completed}/${progress.total}`
})
</script>

<template>
  <article
    class="group relative flex items-stretch border-b border-line/80 last:border-b-0"
    :class="isDone ? 'bg-canvas/30' : 'bg-surface'"
  >
    <span class="w-1 shrink-0 self-stretch" :class="railClass" aria-hidden="true" />

    <button
      type="button"
      class="flex min-w-0 flex-1 items-start gap-3 px-3 py-3 text-left transition hover:bg-canvas/60 sm:gap-4 sm:px-4"
      @click="emit('open')"
    >
      <span
        class="mt-0.5 hidden w-6 shrink-0 text-right font-display text-[11px] tabular-nums text-muted/70 sm:block"
        aria-hidden="true"
      >
        {{ String(index).padStart(2, '0') }}
      </span>

      <span class="min-w-0 flex-1">
        <span class="flex flex-wrap items-center gap-2">
          <span
            class="font-display text-[15px] font-semibold leading-snug text-charcoal"
            :class="
              isDone
                ? 'text-charcoal line-through decoration-charcoal/70'
                : 'group-hover:text-brand'
            "
          >
            {{ task.title }}
          </span>
          <span v-if="task.isBlocked" class="badge-danger">
            <Ban class="h-3 w-3" aria-hidden="true" />
            Blocked
          </span>
          <PriorityBadge :priority="task.priority" />
        </span>

        <span class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
          <span
            class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium"
            :class="STATUS_SOFT_CLASS[task.status]"
          >
            {{ STATUS_LABELS[task.status] }}
          </span>
          <span class="inline-flex items-center gap-1" :class="dueClass">
            <CalendarDays class="h-3 w-3" aria-hidden="true" />
            {{ dueLabel }}
          </span>
          <span v-if="subtaskLabel" class="inline-flex items-center gap-1">
            <ListTree class="h-3 w-3" aria-hidden="true" />
            {{ subtaskLabel }} subtasks
          </span>
          <span v-if="task.parent" class="truncate">Subtask of {{ task.parent.title }}</span>
        </span>
      </span>

      <span class="hidden shrink-0 items-center gap-2 sm:flex">
        <span
          class="inline-flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold"
          :class="
            task.assignee
              ? 'bg-brand-soft text-brand'
              : 'border border-dashed border-line bg-canvas text-muted'
          "
          :title="task.assignee?.name ?? 'Unassigned'"
        >
          {{ initials(task.assignee?.name) }}
        </span>
      </span>
    </button>

    <div
      class="hidden shrink-0 items-center border-l border-line/60 px-2 sm:flex"
      @click.stop
    >
      <AppSelect
        variant="compact"
        class="w-[7.5rem]"
        :model-value="task.status"
        :options="statusOptions"
        :disabled="task.canEdit === false"
        @update:model-value="emit('move', $event as TaskStatus)"
      />
    </div>
  </article>
</template>
