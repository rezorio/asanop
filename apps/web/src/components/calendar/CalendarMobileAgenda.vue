<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Plus } from 'lucide-vue-next'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import type { CalendarTask, CalendarViewMode } from '@/lib/calendar/dates'
import { isSameDay, isSameMonth, toDayKey } from '@/lib/calendar/dates'
import { getDueUrgency } from '@/lib/taskDue'

const props = defineProps<{
  days: Date[]
  tasksByDay: Map<string, CalendarTask[]>
  viewMode: CalendarViewMode
  /** Month cursor — used to dim days outside the focused month */
  cursor: Date
  canCreate: boolean
  selectedTaskId: string | null
}>()

const emit = defineEmits<{
  open: [task: CalendarTask]
  create: [day: Date]
}>()

const today = new Date()
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

const selectedKey = ref(toDayKey(today))

function pickDefaultKey(days: Date[]): string {
  const todayKey = toDayKey(today)
  if (days.some((d) => toDayKey(d) === todayKey)) return todayKey
  const withTasks = days.find((d) => (props.tasksByDay.get(toDayKey(d))?.length ?? 0) > 0)
  if (withTasks) return toDayKey(withTasks)
  return days[0] ? toDayKey(days[0]) : todayKey
}

watch(
  () => [props.days, props.viewMode, props.cursor] as const,
  () => {
    const keys = new Set(props.days.map(toDayKey))
    if (!keys.has(selectedKey.value)) {
      selectedKey.value = pickDefaultKey(props.days)
    }
  },
  { immediate: true },
)

const selectedDay = computed(
  () => props.days.find((d) => toDayKey(d) === selectedKey.value) ?? props.days[0] ?? today,
)

const selectedTasks = computed(
  () => props.tasksByDay.get(selectedKey.value) ?? [],
)

const selectedOverdue = computed(
  () =>
    selectedTasks.value.filter(
      (task) => task.status !== 'DONE' && getDueUrgency(task.dueDate) === 'overdue',
    ).length,
)

const selectedIsToday = computed(() => isSameDay(selectedDay.value, today))

type DayCell = {
  day: Date
  key: string
  inFocus: boolean
  isToday: boolean
  isSelected: boolean
  tasks: CalendarTask[]
  hasOverdue: boolean
  dots: Array<'danger' | 'brand' | 'todo' | 'progress' | 'done'>
}

const cells = computed((): DayCell[] =>
  props.days.map((day) => {
    const key = toDayKey(day)
    const tasks = props.tasksByDay.get(key) ?? []
    const hasOverdue = tasks.some(
      (task) => task.status !== 'DONE' && getDueUrgency(task.dueDate) === 'overdue',
    )
    const dots: DayCell['dots'] = []
    for (const task of tasks.slice(0, 3)) {
      if (task.status !== 'DONE' && getDueUrgency(task.dueDate) === 'overdue') {
        dots.push('danger')
      } else if (task.status !== 'DONE' && getDueUrgency(task.dueDate) === 'today') {
        dots.push('brand')
      } else if (task.status === 'IN_PROGRESS') {
        dots.push('progress')
      } else if (task.status === 'DONE') {
        dots.push('done')
      } else {
        dots.push('todo')
      }
    }
    return {
      day,
      key,
      inFocus:
        props.viewMode === 'week' || isSameMonth(day, props.cursor),
      isToday: isSameDay(day, today),
      isSelected: key === selectedKey.value,
      tasks,
      hasOverdue,
      dots,
    }
  }),
)

function selectDay(day: Date) {
  selectedKey.value = toDayKey(day)
}

function selectedHeading() {
  return selectedDay.value.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function rowAccent(task: CalendarTask) {
  if (task.status !== 'DONE' && getDueUrgency(task.dueDate) === 'overdue') {
    return 'border-l-danger'
  }
  if (task.status !== 'DONE' && getDueUrgency(task.dueDate) === 'today') {
    return 'border-l-brand'
  }
  return 'border-l-line'
}

const DOT_CLASS: Record<DayCell['dots'][number], string> = {
  danger: 'bg-danger',
  brand: 'bg-brand',
  todo: 'bg-todo',
  progress: 'bg-progress',
  done: 'bg-done',
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-line-strong bg-surface">
    <!-- Compact calendar grid (Google Calendar month style) -->
    <div class="border-b border-line-strong">
      <div
        class="grid grid-cols-7 border-b border-line bg-canvas text-center text-[10px] font-semibold uppercase tracking-wide text-muted"
      >
        <div v-for="(label, i) in WEEKDAYS" :key="`${label}-${i}`" class="py-1.5">
          {{ label }}
        </div>
      </div>

      <div class="grid grid-cols-7">
        <button
          v-for="cell in cells"
          :key="cell.key"
          type="button"
          class="relative flex min-h-[3.25rem] flex-col items-center gap-0.5 border-b border-r border-line/70 px-0.5 py-1.5 transition [&:nth-child(7n)]:border-r-0"
          :class="[
            cell.inFocus ? 'bg-surface' : 'bg-canvas/50',
            cell.isSelected ? 'bg-brand-soft/40' : '',
            cell.hasOverdue && !cell.isSelected && !cell.isToday ? 'bg-danger-soft/10' : '',
          ]"
          :aria-pressed="cell.isSelected"
          :aria-label="`${cell.key}${cell.tasks.length ? `, ${cell.tasks.length} tasks` : ''}`"
          @click="selectDay(cell.day)"
        >
          <span
            class="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
            :class="[
              cell.isSelected && cell.isToday
                ? 'bg-brand text-white shadow-sm'
                : cell.isSelected
                  ? 'bg-brand text-white'
                  : cell.isToday
                    ? 'ring-2 ring-brand text-brand'
                    : cell.inFocus
                      ? 'text-charcoal'
                      : 'text-muted',
              cell.hasOverdue && !cell.isSelected && !cell.isToday ? 'text-danger' : '',
            ]"
          >
            {{ cell.day.getDate() }}
          </span>

          <span class="flex h-1.5 items-center justify-center gap-0.5">
            <span
              v-for="(dot, di) in cell.dots"
              :key="`${cell.key}-dot-${di}`"
              class="h-1 w-1 rounded-full"
              :class="DOT_CLASS[dot]"
            />
            <span
              v-if="cell.tasks.length > 3"
              class="text-[8px] font-semibold leading-none text-muted"
            >
              +
            </span>
          </span>
        </button>
      </div>
    </div>

    <!-- Selected day detail (like Google Calendar bottom sheet / day list) -->
    <div class="border-b border-line bg-canvas/40 px-3 py-2.5">
      <div class="flex items-center gap-2">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-charcoal">
            {{ selectedHeading() }}
            <span
              v-if="selectedIsToday"
              class="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-brand"
            >
              Today
            </span>
          </p>
          <p class="text-[11px] text-muted">
            <template v-if="selectedTasks.length">
              {{ selectedTasks.length }} task{{ selectedTasks.length === 1 ? '' : 's' }}
              <span v-if="selectedOverdue" class="font-semibold text-danger">
                · {{ selectedOverdue }} overdue
              </span>
            </template>
            <template v-else>No tasks due</template>
          </p>
        </div>
        <button
          v-if="canCreate"
          type="button"
          class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-charcoal transition hover:border-brand/40 hover:text-brand"
          @click="emit('create', selectedDay)"
        >
          <Plus class="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </div>
    </div>

    <div v-if="selectedTasks.length" class="space-y-1.5 p-3">
      <button
        v-for="task in selectedTasks"
        :key="task.id"
        type="button"
        class="flex w-full items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5 text-left transition hover:border-brand/30 hover:bg-canvas/40"
        :class="[
          `border-l-[3px] ${rowAccent(task)}`,
          selectedTaskId === task.id ? 'bg-brand-soft/20 ring-1 ring-brand/40' : '',
        ]"
        @click="emit('open', task)"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-charcoal">{{ task.title }}</p>
          <p class="truncate text-[11px] text-muted">{{ task.project.name }}</p>
        </div>
        <StatusBadge :status="task.status" class="shrink-0 !px-1.5 !py-0.5 !text-[10px]" />
      </button>
    </div>

    <div v-else class="px-4 py-8 text-center text-sm text-muted">
      Nothing due on this day.
      <button
        v-if="canCreate"
        type="button"
        class="mt-2 block w-full text-sm font-medium text-brand hover:underline"
        @click="emit('create', selectedDay)"
      >
        Add a task
      </button>
    </div>
  </div>
</template>
