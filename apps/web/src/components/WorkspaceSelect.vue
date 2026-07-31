<script setup lang="ts">
import { computed } from 'vue'
import AppSelect from '@/components/AppSelect.vue'
import type { Workspace } from '@/types'

const props = defineProps<{
  workspaces: Workspace[]
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [id: string]
}>()

const options = computed(() =>
  props.workspaces.map((workspace) => ({
    value: workspace.id,
    label: workspace.name,
  })),
)
</script>

<template>
  <AppSelect
    class="mb-3"
    variant="sidebar"
    :model-value="modelValue"
    placeholder="Select workspace"
    :options="options"
    @update:model-value="emit('update:modelValue', String($event))"
  />
</template>
