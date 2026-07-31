<script setup lang="ts">
import { computed } from 'vue'
import { Link2 } from 'lucide-vue-next'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import TimelineBar from '@/components/timeline/TimelineBar.vue'
import TimelineDependencyLayer from '@/components/timeline/TimelineDependencyLayer.vue'
import {
  computeBarRect,
  dayOffset,
  formatDateRange,
  formatDuration,
  isSameDay,
  resolveBarDates,
  ROW_PROJECT,
  ROW_TASK,
} from '@/lib/timeline/geometry'
import {
  buildDependencyLinks,
  buildRowLayout,
  groupTasksByProject,
} from '@/lib/timeline/dependencyPaths'
import type { DependencyDisplayMode, TimelineTask } from '@/lib/timeline/types'

const props = defineProps<{
  tasks: TimelineTask[]
  days: Date[]
  rangeStart: Date
  dayWidth: number
  labelWidth: number
  chartWidth: number
  showWeekday: boolean
  compactLabels: boolean
  linkMode: boolean
  linkSourceId: string | null
  hoverTaskId: string | null
  selectedTaskId: string | null
  dependencyMode: DependencyDisplayMode
  drag: {
    taskId: string
    dayDelta: number
    originStart: Date
    originEnd: Date
  } | null
}>()

const emit = defineEmits<{
  open: [taskId: string]
  'update:hoverTaskId': [taskId: string | null]
  barPointerDown: [event: PointerEvent, task: TimelineTask]
  barPointerMove: [event: PointerEvent]
  barPointerUp: [event: PointerEvent, task: TimelineTask]
  connectFrom: [event: PointerEvent, task: TimelineTask]
  pickLink: [task: TimelineTask]
}>()

const grouped = computed(() => groupTasksByProject(props.tasks))

const rows = computed(() => buildRowLayout(grouped.value, ROW_PROJECT, ROW_TASK))

const bodyHeight = computed(() => {
  if (!rows.value.length) return 0
  const last = rows.value[rows.value.length - 1]
  return last.top + last.height
})

const focusTaskId = computed(
  () => props.hoverTaskId ?? props.linkSourceId ?? props.selectedTaskId,
)

const links = computed(() =>
  buildDependencyLinks({
    tasks: props.tasks,
    rows: rows.value,
    rangeStart: props.rangeStart,
    dayCount: props.days.length,
    dayWidth: props.dayWidth,
    chartWidth: props.chartWidth,
    displayMode: props.dependencyMode,
    focusTaskId: focusTaskId.value,
    drag: props.drag,
  }),
)

function barRect(task: TimelineTask) {
  return computeBarRect(
    task,
    props.rangeStart,
    props.days.length,
    props.dayWidth,
    props.drag,
  )
}

function dayHeaderLabel(date: Date) {
  if (!props.showWeekday) return String(date.getDate())
  return date.toLocaleDateString(undefined, { weekday: 'narrow' })
}

function isToday(date: Date) {
  return isSameDay(date, new Date())
}

function isWeekStart(date: Date) {
  return date.getDay() === 0
}

function metaLine(task: TimelineTask) {
  const dates = resolveBarDates(task, props.drag)
  if (!dates) return null
  const rect = barRect(task)
  return `${formatDateRange(dates.start, dates.end)} · ${formatDuration(rect.durationDays)}`
}

function onLabelClick(task: TimelineTask) {
  if (props.linkMode) {
    emit('pickLink', task)
    return
  }
  emit('open', task.id)
}
</script>

<template>
  <div
    class="min-w-full"
    :style="{ width: `${labelWidth + chartWidth}px` }"
  >
    <!-- Header -->
    <div class="sticky top-0 z-20 flex border-b border-line-strong bg-canvas">
      <div
        class="shrink-0 border-r border-line-strong px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted sm:px-3 sm:text-xs"
        :style="{ width: `${labelWidth}px` }"
      >
        Task
      </div>
      <div class="relative" :style="{ width: `${chartWidth}px` }">
        <div class="flex">
          <div
            v-for="day in days"
            :key="day.toISOString()"
            class="border-r py-1.5 text-center leading-tight"
            :class="[
              isToday(day) ? 'bg-brand-soft font-semibold text-brand' : 'text-muted',
              isWeekStart(day) ? 'border-line-strong/80' : 'border-line',
              dayWidth >= 26 ? 'text-[10px]' : 'text-[9px]',
            ]"
            :style="{ width: `${dayWidth}px` }"
          >
            <div v-if="showWeekday" class="opacity-80">{{ dayHeaderLabel(day) }}</div>
            <div>{{ day.getDate() }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!grouped.length" class="px-4 py-10 text-sm text-muted">
      No scheduled tasks in this window. Set a start date and/or due date on tasks.
    </div>

    <div v-else class="relative flex">
      <!-- Labels column -->
      <div class="shrink-0 border-r border-line-strong" :style="{ width: `${labelWidth}px` }">
        <template v-for="row in rows" :key="`label-${row.id}`">
          <div
            v-if="row.kind === 'project'"
            class="flex items-center border-b border-line bg-canvas/80 px-2 text-[11px] font-semibold text-charcoal sm:px-3 sm:text-xs"
            :style="{ height: `${row.height}px` }"
          >
            <span class="truncate">{{ row.label }}</span>
          </div>

          <button
            v-else-if="row.task"
            type="button"
            class="flex w-full flex-col justify-center border-b border-line px-2 text-left transition hover:bg-canvas/60 sm:px-3"
            :style="{ height: `${row.height}px` }"
            :class="row.task.linkedOnly ? 'bg-canvas/40' : ''"
            @click="onLabelClick(row.task)"
            @mouseenter="emit('update:hoverTaskId', row.task.id)"
            @mouseleave="emit('update:hoverTaskId', null)"
          >
            <p class="truncate text-xs font-medium text-charcoal sm:text-sm">
              {{ row.task.title }}
            </p>
            <div class="mt-0.5 flex min-w-0 flex-wrap items-center gap-1">
              <StatusBadge :status="row.task.status" />
              <span
                v-if="row.task.blockedBy.length"
                class="inline-flex items-center gap-0.5 rounded bg-sky-soft/70 px-1 py-0.5 text-[10px] font-medium text-sky"
                :title="`${row.task.blockedBy.length} prerequisite(s)`"
              >
                <Link2 class="h-2.5 w-2.5" aria-hidden="true" />
                {{ row.task.blockedBy.length }}
              </span>
              <span v-if="row.task.isBlocked" class="badge-danger">Blocked</span>
            </div>
            <p
              v-if="!compactLabels && metaLine(row.task)"
              class="mt-0.5 truncate text-[10px] text-muted"
            >
              {{ metaLine(row.task) }}
            </p>
          </button>
        </template>
      </div>

      <!-- Chart column -->
      <div
        class="relative"
        :style="{ width: `${chartWidth}px`, height: `${bodyHeight}px` }"
      >
        <!-- Day / week grid -->
        <div
          v-for="day in days"
          :key="`grid-${day.toISOString()}`"
          class="absolute bottom-0 top-0 border-r"
          :class="[
            isToday(day) ? 'bg-brand-soft/35' : isWeekStart(day) ? 'bg-canvas/50' : '',
            isWeekStart(day) ? 'border-line-strong/70' : 'border-line/50',
          ]"
          :style="{ left: `${dayOffset(day, rangeStart) * dayWidth}px`, width: `${dayWidth}px` }"
        />

        <!-- Today marker line -->
        <div
          v-for="day in days.filter(isToday)"
          :key="`today-${day.toISOString()}`"
          class="pointer-events-none absolute bottom-0 top-0 z-[4] w-0.5 bg-brand"
          :style="{ left: `${dayOffset(day, rangeStart) * dayWidth + dayWidth / 2}px` }"
        />

        <!-- Row bands -->
        <div
          v-for="row in rows"
          :key="`band-${row.id}`"
          class="absolute left-0 right-0 border-b border-line"
          :class="row.kind === 'project' ? 'bg-canvas/80' : 'hover:bg-canvas/30'"
          :style="{ top: `${row.top}px`, height: `${row.height}px` }"
          @mouseenter="row.task && emit('update:hoverTaskId', row.task.id)"
          @mouseleave="emit('update:hoverTaskId', null)"
        />

        <TimelineDependencyLayer
          :links="links"
          :width="chartWidth"
          :height="bodyHeight"
          :hover-id="hoverTaskId ?? focusTaskId"
          :display-mode="dependencyMode"
        />

        <!-- Bars -->
        <div
          v-for="row in rows.filter((r) => r.task)"
          :key="`bar-${row.id}`"
          class="absolute left-0"
          :style="{ top: `${row.top}px`, width: `${chartWidth}px`, height: `${row.height}px` }"
        >
          <TimelineBar
            v-if="row.task"
            :task="row.task"
            :rect="barRect(row.task)"
            :day-width="dayWidth"
            :link-mode="linkMode"
            :link-selected="linkSourceId === row.task.id"
            :highlighted="hoverTaskId === row.task.id"
            @pointerdown="emit('barPointerDown', $event, row.task!)"
            @pointermove="emit('barPointerMove', $event)"
            @pointerup="emit('barPointerUp', $event, row.task!)"
            @connect-from="emit('connectFrom', $event, row.task!)"
          />
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div
      v-if="dependencyMode !== 'off'"
      class="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line bg-canvas/60 px-3 py-2 text-[11px] text-muted"
    >
      <template v-if="dependencyMode === 'focused' && !focusTaskId">
        <span>Hover a task to reveal its dependency links.</span>
      </template>
      <template v-else>
        <span
          v-if="dependencyMode === 'focused'"
          class="inline-flex items-center gap-1.5"
        >
          <span class="h-0.5 w-4 bg-slate-500" /> Done
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="h-0.5 w-4 border-t-2 border-dashed border-sky" /> Open prerequisite
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="h-0.5 w-4 bg-danger" /> Schedule conflict
        </span>
        <span class="text-muted/80">
          {{
            dependencyMode === 'all'
              ? 'Showing open links only. Hover a task to emphasize its chain.'
              : 'Arrow points to the task waiting on the prerequisite.'
          }}
        </span>
      </template>
    </div>
  </div>
</template>
