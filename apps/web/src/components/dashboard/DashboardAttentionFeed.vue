<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Ban, CalendarClock, CircleAlert } from 'lucide-vue-next'
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
  <section class="panel flex h-full min-h-[18rem] flex-col overflow-hidden">
    <header class="border-b border-line px-4 py-3">
      <h2 class="section-title">Needs attention</h2>
      <p class="text-xs text-muted">Overdue, blocked, and due-today work</p>
    </header>

    <div v-if="!items.length" class="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
      <p class="font-medium text-charcoal">All clear</p>
      <p class="mt-1 text-sm text-muted">Nothing urgent right now.</p>
    </div>

    <ul v-else class="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
      <li v-for="item in items" :key="item.id">
        <RouterLink
          :to="{ name: 'project', params: { projectId: item.projectId }, query: { taskId: item.id } }"
          class="flex items-start gap-3 px-4 py-3 transition hover:bg-canvas/70"
        >
          <span
            class="mt-0.5 inline-flex shrink-0 rounded-md p-1.5"
            :class="reasonMeta[item.primaryReason].class"
          >
            <component :is="reasonMeta[item.primaryReason].icon" class="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-medium text-charcoal">{{ item.title }}</span>
            <span class="mt-1 flex flex-wrap items-center gap-2">
              <span class="text-xs text-muted">{{ item.projectName }}</span>
              <StatusBadge :status="item.status" />
            </span>
            <span class="mt-1 block text-[11px] text-muted">
              {{ item.assignee?.name ?? 'Unassigned' }}
            </span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
