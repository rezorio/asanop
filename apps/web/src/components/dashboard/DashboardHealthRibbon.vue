<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDown, ArrowUp, Ban, CalendarClock, CircleAlert, UserX } from 'lucide-vue-next'
import type { WorkspaceDashboard } from '@/types'
import { STATUS_DOT_CLASS } from '@/lib/uiStyles'
import { STATUSES, STATUS_LABELS } from '@/types'

const props = defineProps<{
  summary: WorkspaceDashboard['summary']
}>()

const circumference = 2 * Math.PI * 42
const dashOffset = computed(
  () => circumference - (props.summary.percentComplete / 100) * circumference,
)

const signals = computed(() => [
  {
    key: 'overdue',
    label: 'Overdue',
    value: props.summary.overdue,
    icon: CircleAlert,
    tone: props.summary.overdue ? 'text-danger' : 'text-muted',
    hint:
      props.summary.overdueTrend.newlyThisWeek > 0
        ? `${props.summary.overdueTrend.newlyThisWeek} new this week`
        : null,
    trendUp: props.summary.overdueTrend.newlyThisWeek > 0,
  },
  {
    key: 'dueSoon',
    label: 'Due soon',
    value: props.summary.dueSoon,
    icon: CalendarClock,
    tone: props.summary.dueSoon ? 'text-brand' : 'text-muted',
    hint: 'next 7 days',
    trendUp: false,
  },
  {
    key: 'blocked',
    label: 'Blocked',
    value: props.summary.openBlocked,
    icon: Ban,
    tone: props.summary.openBlocked ? 'text-overdue' : 'text-muted',
    hint: null,
    trendUp: false,
  },
  {
    key: 'unassigned',
    label: 'Unassigned',
    value: props.summary.unassignedOpen,
    icon: UserX,
    tone: props.summary.unassignedOpen ? 'text-muted' : 'text-muted',
    hint: null,
    trendUp: false,
  },
])
</script>

<template>
  <section class="panel overflow-hidden">
    <div class="grid gap-4 p-4 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-6 lg:p-5">
      <div class="flex items-center gap-4">
        <div class="relative h-24 w-24 shrink-0" role="img" :aria-label="`${summary.percentComplete}% complete`">
          <svg class="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" class="text-canvas" stroke-width="8" />
            <circle
              cx="48"
              cy="48"
              r="42"
              fill="none"
              stroke="currentColor"
              class="text-brand transition-all duration-500"
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset"
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="font-display text-xl font-bold leading-none text-charcoal">
              {{ summary.percentComplete }}%
            </span>
            <span class="mt-0.5 text-[10px] uppercase tracking-wide text-muted">done</span>
          </div>
        </div>

        <div class="min-w-0">
          <p class="font-display text-lg font-semibold text-charcoal">Workspace pulse</p>
          <p class="text-sm text-muted">
            {{ summary.open }} open · {{ summary.completedThisWeek }} completed this week
          </p>
          <div class="mt-2 flex h-2 overflow-hidden rounded-full bg-canvas">
            <div
              v-for="status in STATUSES"
              :key="status"
              class="h-full transition-all duration-300"
              :class="STATUS_DOT_CLASS[status]"
              :style="{
                width: `${summary.total ? (summary.byStatus[status] / summary.total) * 100 : 0}%`,
              }"
              :title="`${STATUS_LABELS[status]}: ${summary.byStatus[status]}`"
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div
          v-for="signal in signals"
          :key="signal.key"
          class="rounded-lg border border-line bg-canvas/50 px-3 py-2.5"
        >
          <div class="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
            <component :is="signal.icon" class="h-3.5 w-3.5" aria-hidden="true" />
            {{ signal.label }}
          </div>
          <p class="mt-1 font-display text-2xl font-bold leading-none" :class="signal.tone">
            {{ signal.value }}
          </p>
          <p v-if="signal.hint" class="mt-1 flex items-center gap-0.5 text-[11px] text-muted">
            <ArrowUp v-if="signal.trendUp" class="h-3 w-3 text-danger" aria-hidden="true" />
            <ArrowDown v-else-if="signal.key === 'overdue' && signal.value === 0" class="h-3 w-3 text-done" />
            {{ signal.hint }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
