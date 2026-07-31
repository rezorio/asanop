<script setup lang="ts">
import { computed } from 'vue'
import { Plus } from 'lucide-vue-next'
import type { CalendarTask } from '@/lib/calendar/dates'
import { isSameDay, isSameMonth, toDayKey } from '@/lib/calendar/dates'
import { getDueUrgency } from '@/lib/taskDue'
import { STATUS_SOFT_CLASS } from '@/lib/uiStyles'

const props = defineProps<{
  day: Date
  cursor: Date
  viewMode: 'month' | 'week'
  tasks: CalendarTask[]
  canCreate?: boolean
}>()

const emit = defineEmits<{
  open: [task: CalendarTask]
  create: [day: Date]
}>()

const today = new Date()
const isToday = computed(() => isSameDay(props.day, today))
const inMonth = computed(() => isSameMonth(props.day, props.cursor))

const openOverdue = computed(() =>
  props.tasks.filter(
    (task) => task.status !== 'DONE' && getDueUrgency(task.dueDate) === 'overdue',
  ),
)

const isOverdueDay = computed(() => openOverdue.value.length > 0)

const visibleLimit = computed(() => (props.viewMode === 'week' ? 8 : 3))

const visibleTasks = computed(() => props.tasks.slice(0, visibleLimit.value))
const overflow = computed(() => Math.max(0, props.tasks.length - visibleLimit.value))

function chipClass(task: CalendarTask) {
  if (task.status !== 'DONE' && getDueUrgency(task.dueDate) === 'overdue') {
    return 'bg-danger-soft/70 text-danger'
  }
  if (task.status !== 'DONE' && getDueUrgency(task.dueDate) === 'today') {
    return 'bg-brand-soft text-brand'
  }
  return STATUS_SOFT_CLASS[task.status]
}

const weekday = computed(() =>
  props.day.toLocaleDateString(undefined, { weekday: 'short' }),
)
</script>

<template>
  <div
    class="group relative flex min-h-[7.5rem] flex-col border-b border-r border-line p-2"
    :class="[
      viewMode === 'week' ? 'min-h-[18rem]' : 'min-h-[7.5rem]',
      inMonth || viewMode === 'week' ? 'bg-surface' : 'bg-canvas/60',
      isToday ? 'bg-brand-soft/25 ring-1 ring-inset ring-brand' : '',
      isOverdueDay && !isToday ? 'bg-danger-soft/20' : '',
    ]"
  >
    <div class="mb-1 flex items-center justify-between gap-1">
      <div class="min-w-0">
        <p
          v-if="viewMode === 'week'"
          class="text-[10px] font-semibold uppercase tracking-wide text-muted"
        >
          {{ weekday }}
        </p>
        <span
          class="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold"
          :class="[
            isToday ? 'bg-brand text-white' : inMonth || viewMode === 'week' ? 'text-charcoal' : 'text-muted',
            isOverdueDay && !isToday ? 'text-danger' : '',
          ]"
        >
          {{ day.getDate() }}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <span
          v-if="openOverdue.length"
          class="rounded bg-danger/10 px-1 py-0.5 text-[10px] font-semibold text-danger"
          :title="`${openOverdue.length} overdue`"
        >
          {{ openOverdue.length }} late
        </span>
        <span v-else-if="tasks.length" class="text-[10px] text-muted">
          {{ tasks.length }}
        </span>
        <button
          v-if="canCreate"
          type="button"
          class="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted opacity-0 transition hover:bg-canvas hover:text-brand group-hover:opacity-100 focus:opacity-100"
          :title="`Add task on ${toDayKey(day)}`"
          @click.stop="emit('create', day)"
        >
          <Plus class="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div class="min-h-0 flex-1 space-y-1 overflow-y-auto">
      <button
        v-for="task in visibleTasks"
        :key="task.id"
        type="button"
        class="block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium transition hover:opacity-90"
        :class="chipClass(task)"
        :title="`${task.title} · ${task.project.name}`"
        @click.stop="emit('open', task)"
      >
        {{ task.title }}
      </button>
      <button
        v-if="overflow"
        type="button"
        class="w-full text-left text-[10px] text-muted hover:text-brand"
        @click.stop="emit('open', tasks[visibleLimit])"
      >
        +{{ overflow }} more
      </button>
    </div>
  </div>
</template>
