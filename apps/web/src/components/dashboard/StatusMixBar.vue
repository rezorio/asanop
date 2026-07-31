<script setup lang="ts">
import type { TaskStatus } from '@/types'
import { STATUS_LABELS, STATUSES } from '@/types'
import { STATUS_DOT_CLASS } from '@/lib/uiStyles'

defineProps<{
  byStatus: Record<TaskStatus, number>
  total: number
}>()
</script>

<template>
  <div>
    <div
      class="flex h-3 overflow-hidden rounded-full bg-canvas"
      role="img"
      :aria-label="`Status mix: ${STATUSES.map((s) => `${STATUS_LABELS[s]} ${byStatus[s]}`).join(', ')}`"
    >
      <div
        v-for="status in STATUSES"
        :key="status"
        class="h-full transition-all duration-300"
        :class="STATUS_DOT_CLASS[status]"
        :style="{
          width: `${total ? (byStatus[status] / total) * 100 : 0}%`,
        }"
        :title="`${STATUS_LABELS[status]}: ${byStatus[status]}`"
      />
    </div>
    <div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
      <span
        v-for="status in STATUSES"
        :key="status"
        class="inline-flex items-center gap-2"
      >
        <span
          class="h-2.5 w-2.5 shrink-0 rounded-full"
          :class="STATUS_DOT_CLASS[status]"
          aria-hidden="true"
        />
        {{ STATUS_LABELS[status] }}: {{ byStatus[status] }}
      </span>
    </div>
  </div>
</template>
