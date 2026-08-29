<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  Layers3,
} from 'lucide-vue-next'
import type { WorkspaceDashboard } from '@/types'
import StatusMixBar from '@/components/dashboard/StatusMixBar.vue'

const props = defineProps<{
  summary: WorkspaceDashboard['summary']
}>()

const circumference = 2 * Math.PI * 42
const dashOffset = computed(
  () => circumference - (props.summary.percentComplete / 100) * circumference,
)

const facts = computed(() => [
  {
    key: 'open',
    label: 'Open work',
    value: props.summary.open,
    detail: `${props.summary.projectCount} active projects`,
    icon: Layers3,
    tone: 'text-sky bg-sky-soft/45',
    valueClass: 'text-charcoal',
  },
  {
    key: 'overdue',
    label: 'Overdue',
    value: props.summary.overdue,
    detail: props.summary.overdueTrend.newlyThisWeek
      ? `${props.summary.overdueTrend.newlyThisWeek} new this week`
      : 'No new overdue work',
    icon: CircleAlert,
    tone: props.summary.overdue
      ? 'text-danger bg-danger-soft/35'
      : 'text-muted bg-canvas',
    valueClass: props.summary.overdue ? 'text-danger' : 'text-charcoal',
  },
  {
    key: 'dueSoon',
    label: 'Due soon',
    value: props.summary.dueSoon,
    detail: 'In the next 7 days',
    icon: Clock3,
    tone: 'text-gold-ink bg-gold-soft/70',
    valueClass: 'text-charcoal',
  },
  {
    key: 'completed',
    label: 'Completed',
    value: props.summary.completedThisWeek,
    detail: 'Finished this week',
    icon: CheckCircle2,
    tone: 'text-done bg-done-soft/55',
    valueClass: 'text-charcoal',
  },
])
</script>

<template>
  <section class="dashboard-overview overflow-hidden">
    <div
      class="grid gap-5 p-5 lg:grid-cols-[minmax(16rem,.85fr)_minmax(0,1.15fr)_minmax(18rem,1fr)] lg:items-stretch lg:gap-6 lg:p-6"
    >
      <div class="flex items-center gap-4">
        <div
          class="relative h-24 w-24 shrink-0"
          role="img"
          :aria-label="`${summary.percentComplete}% complete`"
        >
          <svg class="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r="42"
              fill="none"
              stroke="currentColor"
              class="text-white/70"
              stroke-width="8"
            />
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
            <span class="mt-0.5 text-[10px] uppercase tracking-wide text-muted"
              >done</span
            >
          </div>
        </div>

        <div class="min-w-0">
          <p class="dashboard-kicker">Delivery snapshot</p>
          <p class="mt-1 font-display text-lg font-semibold text-charcoal">
            Workspace pulse
          </p>
          <p class="mt-1 text-sm leading-relaxed text-muted">
            Progress across every active project in one place.
          </p>
        </div>
      </div>

      <div
        class="rounded-xl border border-white/70 bg-white/65 p-4 shadow-sm backdrop-blur-sm"
      >
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <p class="dashboard-kicker">Status mix</p>
            <h2 class="section-title">Where work stands</h2>
          </div>
          <span class="text-xs font-semibold text-muted"
            >{{ summary.total }} total</span
          >
        </div>
        <StatusMixBar :by-status="summary.byStatus" :total="summary.total" />
      </div>

      <div class="grid grid-cols-2 gap-2.5">
        <div
          v-for="fact in facts"
          :key="fact.key"
          class="rounded-xl border border-white/70 bg-white/65 p-3.5 shadow-sm"
        >
          <div class="flex items-center justify-between gap-2">
            <span
              class="text-[10px] font-bold uppercase tracking-[0.08em] text-muted"
              >{{ fact.label }}</span
            >
            <span
              class="inline-flex h-7 w-7 items-center justify-center rounded-lg"
              :class="fact.tone"
            >
              <component
                :is="fact.icon"
                class="h-3.5 w-3.5"
                aria-hidden="true"
              />
            </span>
          </div>
          <p
            class="mt-2.5 font-display text-2xl font-bold leading-none"
            :class="fact.valueClass"
          >
            {{ fact.value }}
          </p>
          <p class="mt-1.5 text-[11px] leading-snug text-muted">
            {{ fact.detail }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dashboard-overview {
  border: 1px solid color-mix(in srgb, var(--color-brand) 18%, var(--color-line));
  border-radius: var(--radius-panel);
  background:
    radial-gradient(
      circle at 8% 20%,
      color-mix(in srgb, var(--color-brand-soft) 82%, transparent),
      transparent 34%
    ),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-surface) 92%, var(--color-brand-soft)) 0%,
      color-mix(in srgb, var(--color-canvas) 76%, var(--color-brand-soft)) 58%,
      color-mix(in srgb, var(--color-surface) 82%, var(--color-gold-soft)) 100%
    );
  box-shadow: var(--shadow-card);
}
</style>
