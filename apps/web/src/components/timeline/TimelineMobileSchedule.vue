<script setup lang="ts">
import { computed } from 'vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import {
  computeBarRect,
  durationDays,
  formatDateRange,
  formatDurationShort,
  isSameDay,
  resolveBarDates,
} from '@/lib/timeline/geometry'
import { groupTasksByProject } from '@/lib/timeline/dependencyPaths'
import type { TimelineTask } from '@/lib/timeline/types'
import { STATUS_SOLID_CLASS } from '@/lib/uiStyles'

const props = defineProps<{
  tasks: TimelineTask[]
  days: Date[]
  rangeStart: Date
  selectedTaskId: string | null
}>()

const emit = defineEmits<{
  open: [taskId: string]
}>()

const today = new Date()

type MobileBar = {
  left: string
  width: string
  clippedLeft: boolean
  clippedRight: boolean
  durationLabel: string | null
  title: string
}

type MobileRow = {
  task: TimelineTask
  bar: MobileBar | null
}

const sections = computed(() => {
  const dayUnit = 100 / Math.max(1, props.days.length)
  return groupTasksByProject(props.tasks).map((group) => ({
    project: group.project,
    rows: group.tasks.map((task): MobileRow => {
      const rect = computeBarRect(
        task,
        props.rangeStart,
        props.days.length,
        dayUnit,
        null,
      )
      if (!rect.visible) {
        return { task, bar: null }
      }
      const dates = resolveBarDates(task, null)
      const title = dates
        ? `${task.title} · ${formatDateRange(dates.start, dates.end)} · ${formatDurationShort(durationDays(dates.start, dates.end))}`
        : task.title
      return {
        task,
        bar: {
          left: `${rect.left}%`,
          width: `${Math.max(rect.width, dayUnit * 0.55)}%`,
          clippedLeft: rect.clippedLeft,
          clippedRight: rect.clippedRight,
          durationLabel:
            rect.width >= dayUnit * 2.5
              ? formatDurationShort(rect.durationDays)
              : null,
          title,
        },
      }
    }),
  }))
})

function weekdayLetter(day: Date) {
  return day.toLocaleDateString(undefined, { weekday: 'narrow' })
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-line-strong bg-surface">
    <div
      class="sticky top-0 z-10 border-b border-line-strong bg-surface/95 backdrop-blur-sm"
    >
      <div
        class="grid"
        :style="{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }"
      >
        <div
          v-for="day in days"
          :key="day.toISOString()"
          class="relative flex flex-col items-center gap-0.5 border-r border-line/50 px-0.5 py-2 last:border-r-0"
          :class="
            isSameDay(day, today)
              ? 'bg-brand-soft font-semibold text-brand'
              : ''
          "
        >
          <span
            class="text-[10px] font-semibold uppercase tracking-wide"
            :class="isSameDay(day, today) ? 'text-brand' : 'text-muted'"
          >
            {{ weekdayLetter(day) }}
          </span>
          <span
            class="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
            :class="isSameDay(day, today) ? 'bg-brand text-white shadow-sm' : 'text-charcoal'"
          >
            {{ day.getDate() }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="!tasks.length" class="px-4 py-10 text-center text-sm text-muted">
      No tasks in this two-week window.
    </div>

    <div v-else class="divide-y divide-line">
      <section v-for="section in sections" :key="section.project.id">
        <h2
          class="truncate bg-canvas/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted"
        >
          {{ section.project.name }}
        </h2>

        <button
          v-for="{ task, bar } in section.rows"
          :key="task.id"
          type="button"
          class="block w-full px-3 py-2.5 text-left transition hover:bg-canvas/60"
          :class="
            selectedTaskId === task.id
              ? 'bg-brand-soft/30 ring-1 ring-inset ring-brand/40'
              : ''
          "
          :title="bar?.title ?? task.title"
          @click="emit('open', task.id)"
        >
          <div class="mb-1.5 flex min-w-0 items-center gap-2">
            <span class="min-w-0 flex-1 truncate text-sm font-medium text-charcoal">
              {{ task.title }}
            </span>
            <StatusBadge :status="task.status" class="shrink-0 !px-1.5 !py-0.5 !text-[10px]" />
          </div>

          <p
            v-if="task.blockedBy?.length"
            class="mb-1.5 text-[10px] font-medium text-danger"
          >
            Blocked
          </p>

          <div class="relative h-6 overflow-hidden rounded-md bg-canvas">
            <div
              class="pointer-events-none absolute inset-0 grid"
              :style="{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }"
              aria-hidden="true"
            >
              <div
                v-for="day in days"
                :key="`track-${task.id}-${day.toISOString()}`"
                class="relative border-r border-line/60 last:border-r-0"
                :class="isSameDay(day, today) ? 'bg-brand-soft/50' : ''"
              >
                <span
                  v-if="isSameDay(day, today)"
                  class="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-brand"
                />
              </div>
            </div>

            <div
              v-if="bar"
              class="absolute top-1 bottom-1 z-[1] overflow-hidden rounded"
              :class="[
                STATUS_SOLID_CLASS[task.status],
                task.linkedOnly ? 'opacity-70' : '',
              ]"
              :style="{ left: bar.left, width: bar.width }"
            >
              <span
                v-if="bar.clippedLeft"
                class="absolute inset-y-0 left-0 w-1 bg-charcoal/25"
                aria-hidden="true"
              />
              <span
                v-if="bar.clippedRight"
                class="absolute inset-y-0 right-0 w-1 bg-charcoal/25"
                aria-hidden="true"
              />
              <span
                v-if="bar.durationLabel"
                class="relative flex h-full items-center px-1.5 text-[10px] font-semibold leading-none"
              >
                {{ bar.durationLabel }}
              </span>
            </div>
          </div>
        </button>
      </section>
    </div>
  </div>
</template>
