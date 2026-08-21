<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowUpRight, Ban, CalendarClock, CircleAlert, Sparkles } from 'lucide-vue-next'
import type { WorkspaceDashboard } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge.vue'

defineProps<{
  items: WorkspaceDashboard['needsAttention']
}>()

const reasonMeta = {
  overdue: { label: 'Overdue', icon: CircleAlert, class: 'text-danger bg-danger/10' },
  due_today: { label: 'Due today', icon: CalendarClock, class: 'text-brand bg-brand-soft' },
  blocked: { label: 'Blocked', icon: Ban, class: 'text-overdue bg-overdue-soft/60' },
} as const
</script>

<template>
  <section class="panel overflow-hidden">
    <header class="dashboard-panel-header">
      <div>
        <p class="dashboard-kicker">Priority focus</p>
        <h2 class="section-title">What needs attention</h2>
      </div>
      <span class="dashboard-header-meta">{{ items.length }} priorities</span>
    </header>

    <div v-if="!items.length" class="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
      <p class="font-medium text-charcoal">All clear</p>
      <p class="mt-1 text-sm text-muted">Nothing urgent right now.</p>
    </div>

    <ul v-else class="grid gap-2 p-3">
      <li v-for="item in items" :key="item.id">
        <RouterLink
          :to="{ name: 'project', params: { projectId: item.projectId }, query: { taskId: item.id } }"
          class="group flex items-center gap-3 rounded-xl border border-transparent bg-canvas/55 px-3 py-3 transition hover:border-line hover:bg-surface hover:shadow-sm"
        >
          <span
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            :class="reasonMeta[item.primaryReason].class"
          >
            <component :is="reasonMeta[item.primaryReason].icon" class="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-display text-sm font-semibold text-charcoal transition group-hover:text-brand">{{ item.title }}</span>
            <span class="mt-1 flex flex-wrap items-center gap-2">
              <span class="text-xs text-muted">{{ item.projectName }}</span>
              <StatusBadge :status="item.status" />
            </span>
          </span>
          <span class="hidden shrink-0 text-right sm:block">
            <span class="block text-[10px] font-bold uppercase tracking-wide" :class="reasonMeta[item.primaryReason].class.split(' ')[0]">{{ reasonMeta[item.primaryReason].label }}</span>
            <span class="mt-1 block text-[11px] text-muted">{{ item.assignee?.name ?? 'Unassigned' }}</span>
          </span>
          <ArrowUpRight class="h-4 w-4 shrink-0 text-muted/60 transition group-hover:text-brand" aria-hidden="true" />
        </RouterLink>
      </li>
    </ul>

    <footer v-if="items.length" class="flex items-center gap-2 border-t border-line px-4 py-3 text-xs text-muted">
      <Sparkles class="h-3.5 w-3.5 text-gold" aria-hidden="true" />
      Ordered by urgency so the team can act quickly.
    </footer>
  </section>
</template>
