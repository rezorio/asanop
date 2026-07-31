<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { WorkspaceDashboard } from '@/types'
import { STATUS_DOT_CLASS } from '@/lib/uiStyles'
import { STATUSES } from '@/types'

defineProps<{
  projects: WorkspaceDashboard['byProject']
}>()

const healthLabel = {
  at_risk: 'At risk',
  active: 'In motion',
  complete: 'Complete',
  idle: 'Idle',
} as const

const healthClass = {
  at_risk: 'border-danger/30 bg-danger/5',
  active: 'border-brand/30 bg-brand-soft/30',
  complete: 'border-done/30 bg-done-soft/40',
  idle: 'border-line bg-canvas/40',
} as const
</script>

<template>
  <section>
    <div class="mb-2 flex items-center justify-between gap-2">
      <h2 class="section-title">Project radar</h2>
      <span class="text-xs text-muted">{{ projects.length }} projects</span>
    </div>

    <div v-if="!projects.length" class="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
      No projects yet.
    </div>

    <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <RouterLink
        v-for="row in projects"
        :key="row.project.id"
        :to="{ name: 'project', params: { projectId: row.project.id } }"
        class="panel block p-4 transition hover:border-brand/40 hover:shadow-md"
        :class="healthClass[row.health]"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="truncate font-display font-semibold text-charcoal">{{ row.project.name }}</p>
            <p class="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
              {{ healthLabel[row.health] }}
            </p>
          </div>
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-xs font-bold text-charcoal"
          >
            {{ row.percentComplete }}%
          </div>
        </div>

        <div class="mt-3 flex h-1.5 overflow-hidden rounded-full bg-canvas">
          <div
            v-for="status in STATUSES"
            :key="status"
            class="h-full"
            :class="STATUS_DOT_CLASS[status]"
            :style="{
              width: `${row.total ? ((row[status] as number) / row.total) * 100 : 0}%`,
            }"
          />
        </div>

        <div class="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span class="rounded-md bg-surface/80 px-1.5 py-0.5 text-muted">
            {{ row.TODO + row.IN_PROGRESS }} open
          </span>
          <span v-if="row.overdue" class="rounded-md bg-danger/10 px-1.5 py-0.5 font-medium text-danger">
            {{ row.overdue }} overdue
          </span>
          <span v-if="row.blocked" class="rounded-md bg-overdue-soft/80 px-1.5 py-0.5 font-medium text-overdue">
            {{ row.blocked }} blocked
          </span>
          <span class="rounded-md bg-surface/80 px-1.5 py-0.5 text-muted">{{ row.DONE }} done</span>
        </div>
      </RouterLink>
    </div>
  </section>
</template>
