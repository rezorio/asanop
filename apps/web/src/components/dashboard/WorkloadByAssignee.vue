<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '@/types'
import { STATUS_LABELS, STATUSES } from '@/types'
import { STATUS_DOT_CLASS, STATUS_SOFT_CLASS } from '@/lib/uiStyles'

export type AssigneeRow = {
  user: User
  TODO: number
  IN_PROGRESS: number
  DONE: number
  open: number
}

const props = defineProps<{
  rows: AssigneeRow[]
}>()

const maxOpen = computed(() => Math.max(1, ...props.rows.map((row) => row.open)))

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function openShare(row: AssigneeRow) {
  return (row.open / maxOpen.value) * 100
}

function segmentShare(row: AssigneeRow, status: (typeof STATUSES)[number]) {
  const open = row.open
  if (!open) return 0
  if (status === 'DONE') return 0
  return (row[status] / open) * 100
}
</script>

<template>
  <div>
    <p v-if="!rows.length" class="px-3 py-6 text-sm text-muted">No assigned open work.</p>

    <template v-else>
      <div
        class="sticky top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line bg-surface-muted/90 px-3 py-2 text-[11px] text-muted backdrop-blur-sm"
      >
        <span class="font-medium uppercase tracking-wide">Open load</span>
        <span
          v-for="status in (['TODO', 'IN_PROGRESS'] as const)"
          :key="status"
          class="inline-flex items-center gap-1.5"
        >
          <span
            class="h-2 w-2 shrink-0 rounded-full"
            :class="STATUS_DOT_CLASS[status]"
            aria-hidden="true"
          />
          {{ STATUS_LABELS[status] }}
        </span>
      </div>

      <ul class="divide-y divide-line">
        <li
          v-for="row in rows"
          :key="row.user.id"
          class="flex items-center gap-3 px-3 py-2.5 hover:bg-canvas/60"
        >
          <span
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand"
            aria-hidden="true"
          >
            {{ initials(row.user.name) }}
          </span>

          <div class="min-w-0 flex-1">
            <div class="mb-1.5 flex items-center justify-between gap-2">
              <p class="truncate text-sm font-medium text-charcoal">{{ row.user.name }}</p>
              <span
                class="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                :class="row.open ? STATUS_SOFT_CLASS.IN_PROGRESS : 'bg-canvas text-muted'"
              >
                {{ row.open }} open
              </span>
            </div>

            <div
              class="h-2 overflow-hidden rounded-full bg-canvas"
              role="img"
              :aria-label="`${row.user.name}: ${row.TODO} to do, ${row.IN_PROGRESS} in progress, ${row.DONE} done`"
            >
              <div
                class="flex h-full transition-all duration-300"
                :style="{ width: `${openShare(row)}%` }"
              >
                <div
                  v-for="status in (['TODO', 'IN_PROGRESS'] as const)"
                  :key="status"
                  class="h-full min-w-0 transition-all duration-300"
                  :class="STATUS_DOT_CLASS[status]"
                  :style="{ width: `${segmentShare(row, status)}%` }"
                  :title="`${STATUS_LABELS[status]}: ${row[status]}`"
                />
              </div>
            </div>

            <p class="mt-1 flex gap-3 text-[11px] tabular-nums text-muted">
              <span>{{ row.TODO }} todo</span>
              <span>{{ row.IN_PROGRESS }} active</span>
              <span>{{ row.DONE }} done</span>
            </p>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>
