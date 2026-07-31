<script setup lang="ts">
import type { TaskPriority } from '@/types'
import { PRIORITY_BADGE_CLASS } from '@/lib/uiStyles'

const LABELS: Record<TaskPriority, string> = {
  NONE: 'No priority',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

const props = defineProps<{
  priority: TaskPriority
}>()
</script>

<template>
  <span v-if="priority !== 'NONE'" :class="PRIORITY_BADGE_CLASS[props.priority]">
    {{ LABELS[props.priority] }}
  </span>
</template>
