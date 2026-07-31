<script setup lang="ts">
import { computed } from 'vue'
import type { TimelineBarRect, TimelineTask } from '@/lib/timeline/types'
import {
  BAR_HEIGHT,
  BAR_TOP,
  formatDateRange,
  formatDurationShort,
  resolveBarDates,
} from '@/lib/timeline/geometry'
import { STATUS_SOLID_CLASS } from '@/lib/uiStyles'

const props = defineProps<{
  task: TimelineTask
  rect: TimelineBarRect
  dayWidth: number
  linkMode: boolean
  linkSelected: boolean
  highlighted: boolean
}>()

const emit = defineEmits<{
  pointerdown: [event: PointerEvent]
  pointermove: [event: PointerEvent]
  pointerup: [event: PointerEvent]
  connectFrom: [event: PointerEvent]
}>()

const statusClass = computed(() => STATUS_SOLID_CLASS[props.task.status])

function titleText() {
  const dates = resolveBarDates(props.task, null)
  if (!dates) return props.task.title
  return `${props.task.title} · ${formatDateRange(dates.start, dates.end)} · ${formatDurationShort(props.rect.durationDays)}`
}
</script>

<template>
  <div
    v-if="rect.visible"
    class="absolute"
    :style="{
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      top: `${BAR_TOP}px`,
      height: `${BAR_HEIGHT}px`,
    }"
  >
    <button
      type="button"
      class="group relative h-full w-full cursor-grab truncate rounded-md text-left text-[10px] font-medium shadow-sm outline-none transition active:cursor-grabbing sm:text-[11px]"
      :class="[
        statusClass,
        linkSelected ? 'ring-2 ring-brand ring-offset-1' : '',
        highlighted ? 'ring-2 ring-sky ring-offset-1' : '',
        task.linkedOnly ? 'opacity-70' : '',
        task.isMilestone ? 'rounded-full px-0' : 'px-1.5 sm:px-2',
      ]"
      :title="titleText()"
      @pointerdown="emit('pointerdown', $event)"
      @pointermove="emit('pointermove', $event)"
      @pointerup="emit('pointerup', $event)"
      @click.prevent
    >
      <!-- Clipped edge markers -->
      <span
        v-if="rect.clippedLeft"
        class="absolute inset-y-0 left-0 w-1.5 rounded-l-md bg-charcoal/25"
        aria-hidden="true"
      />
      <span
        v-if="rect.clippedRight"
        class="absolute inset-y-0 right-0 w-1.5 rounded-r-md bg-charcoal/25"
        aria-hidden="true"
      />

      <span class="relative flex h-full min-w-0 items-center gap-1.5">
        <span
          v-if="dayWidth >= 20 && rect.width >= 56"
          class="min-w-0 flex-1 truncate"
        >
          {{ task.title }}
        </span>
        <span
          v-if="rect.width >= 44"
          class="shrink-0 rounded bg-black/15 px-1 py-0.5 text-[9px] font-semibold tabular-nums leading-none"
        >
          {{ task.isMilestone ? 'due' : formatDurationShort(rect.durationDays) }}
        </span>
      </span>

      <!-- Dependency connector handle -->
      <span
        class="absolute -right-1.5 top-1/2 z-10 flex h-3.5 w-3.5 -translate-y-1/2 items-center justify-center rounded-full border-2 border-surface bg-charcoal opacity-0 shadow transition group-hover:opacity-100 group-focus-within:opacity-100"
        :class="linkMode ? 'opacity-100' : ''"
        title="Drag to link a dependent task"
        @pointerdown.stop="emit('connectFrom', $event)"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-surface" />
      </span>
    </button>
  </div>
</template>
