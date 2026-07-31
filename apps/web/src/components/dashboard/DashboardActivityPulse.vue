<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { WorkspaceDashboard } from '@/types'
import { formatActivityMessage, formatRelativeTime } from '@/lib/dashboardActivity'

defineProps<{
  events: WorkspaceDashboard['recentActivity']
}>()
</script>

<template>
  <section class="panel flex h-full min-h-[18rem] flex-col overflow-hidden">
    <header class="border-b border-line px-4 py-3">
      <h2 class="section-title">Recent pulse</h2>
      <p class="text-xs text-muted">Latest movement across projects</p>
    </header>

    <div v-if="!events.length" class="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
      <p class="font-medium text-charcoal">Quiet for now</p>
      <p class="mt-1 text-sm text-muted">Activity will show up as the team works.</p>
    </div>

    <ul v-else class="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
      <li v-for="event in events" :key="event.id" class="px-4 py-3">
        <RouterLink
          :to="{
            name: 'project',
            params: { projectId: event.task.projectId },
            query: { taskId: event.task.id },
          }"
          class="block transition hover:opacity-80"
        >
          <p class="text-sm text-charcoal">
            <span class="font-medium">{{ event.actor.name }}</span>
            {{ ' ' }}
            <span class="text-muted">{{ formatActivityMessage(event.type, event.meta) }}</span>
          </p>
          <p class="mt-0.5 truncate text-sm font-medium text-progress">{{ event.task.title }}</p>
          <p class="mt-1 text-[11px] text-muted">
            {{ event.task.projectName }} · {{ formatRelativeTime(event.createdAt) }}
          </p>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
