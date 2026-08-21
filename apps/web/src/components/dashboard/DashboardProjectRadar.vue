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
  at_risk: 'border-danger/25 bg-danger/5',
  active: 'border-brand/25 bg-brand-soft/20',
  complete: 'border-done/25 bg-done-soft/25',
  idle: 'border-line bg-canvas/45',
} as const

const healthDot = {
  at_risk: 'bg-danger',
  active: 'bg-brand',
  complete: 'bg-done',
  idle: 'bg-muted',
} as const
</script>

<template>
  <section class="panel overflow-hidden">
    <header class="dashboard-panel-header">
      <div>
        <p class="dashboard-kicker">Portfolio health</p>
        <h2 class="section-title">Project radar</h2>
      </div>
      <span class="dashboard-header-meta">{{ projects.length }} projects</span>
    </header>

    <div v-if="!projects.length" class="m-4 rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
      No projects yet.
    </div>

    <div v-else class="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
      <RouterLink
        v-for="row in projects"
        :key="row.project.id"
        :to="{ name: 'project', params: { projectId: row.project.id } }"
        class="block rounded-xl border p-4 transition hover:-translate-y-0.5 hover:border-brand/40 hover:bg-surface hover:shadow-md"
        :class="healthClass[row.health]"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="truncate font-display font-semibold text-charcoal">{{ row.project.name }}</p>
            <p class="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
              <span class="h-1.5 w-1.5 rounded-full" :class="healthDot[row.health]" aria-hidden="true" />
              {{ healthLabel[row.health] }}
            </p>
          </div>
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-4 border-surface bg-surface/80 text-xs font-bold text-charcoal shadow-sm"
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
