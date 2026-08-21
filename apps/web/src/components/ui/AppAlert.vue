<script setup lang="ts">
import { CircleAlert, CircleCheck } from 'lucide-vue-next'

withDefaults(defineProps<{ tone?: 'danger' | 'success' | 'info' }>(), { tone: 'info' })
</script>

<template>
  <div class="ui-alert" :class="`ui-alert-${tone}`" :role="tone === 'danger' ? 'alert' : 'status'">
    <CircleAlert v-if="tone !== 'success'" class="h-4 w-4 shrink-0" aria-hidden="true" />
    <CircleCheck v-else class="h-4 w-4 shrink-0" aria-hidden="true" />
    <div><slot /></div>
  </div>
</template>
