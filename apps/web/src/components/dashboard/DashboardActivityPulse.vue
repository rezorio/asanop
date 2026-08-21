<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Activity } from 'lucide-vue-next'
import type { WorkspaceDashboard } from '@/types'
import { formatActivityMessage, formatRelativeTime } from '@/lib/dashboardActivity'

defineProps<{
  events: WorkspaceDashboard['recentActivity']
}>()
</script>

<template>
  <section class="panel overflow-hidden">
    <header class="dashboard-panel-header">
      <div>
        <p class="dashboard-kicker">Live updates</p>
        <h2 class="section-title">Recent activity</h2>
      </div>
      <span class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-soft/45 text-sky">
        <Activity class="h-4 w-4" aria-hidden="true" />
      </span>
    </header>

    <div v-if="!events.length" class="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
      <p class="font-medium text-charcoal">Quiet for now</p>
      <p class="mt-1 text-sm text-muted">Activity will show up as the team works.</p>
    </div>

    <ul v-else class="px-4 py-2">
      <li v-for="(event, index) in events" :key="event.id" class="relative grid grid-cols-[18px_1fr] gap-3 py-2.5">
        <span v-if="index < events.length - 1" class="absolute left-[8px] top-6 h-[calc(100%-8px)] w-px bg-line" aria-hidden="true" />
        <span class="relative z-[1] mt-1 h-[9px] w-[9px] rounded-full border-2 border-surface bg-brand ring-2 ring-brand-soft" aria-hidden="true" />
        <RouterLink
          :to="{
            name: 'project',
            params: { projectId: event.task.projectId },
            query: { taskId: event.task.id },
          }"
          class="min-w-0 rounded-lg transition hover:bg-canvas/60"
        >
          <p class="text-[13px] leading-snug text-charcoal">
            <span class="font-medium">{{ event.actor.name }}</span>
            {{ ' ' }}
            <span class="text-muted">{{ formatActivityMessage(event.type, event.meta) }}</span>
          </p>
          <p class="mt-0.5 truncate text-[13px] font-semibold text-progress">{{ event.task.title }}</p>
          <p class="mt-0.5 text-[10px] text-muted">
            {{ event.task.projectName }} · {{ formatRelativeTime(event.createdAt) }}
          </p>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
