<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, CalendarDays } from 'lucide-vue-next'
import type { Task } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge.vue'

export type TaskUrgency = 'overdue' | 'today' | 'upcoming' | 'later'

const props = defineProps<{
  task: Task
  urgency?: TaskUrgency
}>()

const emit = defineEmits<{
  open: []
}>()

const urgencyStripe = computed(() => {
  switch (props.urgency) {
    case 'overdue':
      return 'bg-danger'
    case 'today':
      return 'bg-brand'
    case 'upcoming':
      return 'bg-upcoming'
    default:
      return 'bg-todo'
  }
})

const dueLabel = computed(() => {
  if (!props.task.dueDate) return 'No due date'
  const date = new Date(props.task.dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(date)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000)

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff <= 7) return `In ${diff}d`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
})

const dueClass = computed(() => {
  if (props.urgency === 'overdue') return 'text-danger'
  if (props.urgency === 'today') return 'text-brand'
  return 'text-muted'
})
</script>

<template>
  <button
    type="button"
    class="group flex w-full items-stretch gap-0 border-b border-line text-left last:border-b-0 hover:bg-canvas/70"
    @click="emit('open')"
  >
    <span class="w-1 shrink-0 rounded-full" :class="urgencyStripe" aria-hidden="true" />

    <span class="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 sm:px-4">
      <span class="min-w-0 flex-1">
        <span class="flex items-start gap-2">
          <span class="font-medium text-charcoal group-hover:text-brand">{{ task.title }}</span>
          <span v-if="task.isBlocked" class="badge-danger shrink-0">Blocked</span>
        </span>
        <span class="mt-1 flex flex-wrap items-center gap-2">
          <span class="rounded-md bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-muted">
            {{ task.project?.name ?? 'Project' }}
          </span>
          <StatusBadge :status="task.status" />
          <span v-if="task.parent" class="text-[11px] text-muted">
            Subtask of {{ task.parent.title }}
          </span>
        </span>
      </span>

      <span class="hidden shrink-0 flex-col items-end gap-1 sm:flex">
        <span class="inline-flex items-center gap-1 text-xs" :class="dueClass">
          <CalendarDays class="h-3.5 w-3.5" aria-hidden="true" />
          {{ dueLabel }}
        </span>
        <span
          v-if="task.priority && task.priority !== 'NONE'"
          class="text-[10px] font-semibold uppercase tracking-wide text-muted"
        >
          {{ task.priority }}
        </span>
      </span>
    </span>

    <span
      v-if="urgency === 'overdue'"
      class="mr-3 hidden items-center self-center text-danger sm:flex"
      aria-hidden="true"
    >
      <AlertCircle class="h-4 w-4" />
    </span>
  </button>
</template>
