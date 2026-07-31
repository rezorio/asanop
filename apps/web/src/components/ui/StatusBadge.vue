<script setup lang="ts">
import type { TaskStatus } from '@/types'
import { STATUS_LABELS } from '@/types'
import { STATUS_BADGE_CLASS } from '@/lib/uiStyles'

withDefaults(
  defineProps<{
    status: TaskStatus
    label?: string
  }>(),
  {
    label: undefined,
  },
)
</script>

<template>
  <span :class="STATUS_BADGE_CLASS[status]">
    <span class="badge-dot" aria-hidden="true" />
    {{ label ?? STATUS_LABELS[status] }}
  </span>
</template>
