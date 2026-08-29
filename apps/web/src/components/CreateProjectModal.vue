<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import AppModal from '@/components/AppModal.vue'
import api from '@/lib/api'
import { notifyProjectsChanged } from '@/lib/projectEvents'
import type { Project } from '@/types'

const props = defineProps<{
  open: boolean
  workspaceId: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [project: Project]
}>()

const creating = ref(false)
const error = ref('')
const form = reactive({
  name: '',
  description: '',
})

watch(
  () => props.open,
  (open) => {
    if (open) {
      form.name = ''
      form.description = ''
      error.value = ''
    }
  },
)

async function submit() {
  if (!form.name.trim()) return
  creating.value = true
  error.value = ''
  try {
    const { data } = await api.post<Project>(`/workspaces/${props.workspaceId}/projects`, {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
    })
    notifyProjectsChanged()
    emit('created', data)
    emit('update:open', false)
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message?.toString() ??
      'Could not create project'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <AppModal
    :open="open"
    title="New project"
    subtitle="Create a project to organize tasks and sections."
    @update:open="emit('update:open', $event)"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <label class="label">Name</label>
        <input v-model="form.name" class="field" required autofocus placeholder="Project name" />
      </div>
      <div>
        <label class="label">Description</label>
        <textarea
          v-model="form.description"
          class="field min-h-[96px]"
          placeholder="Optional short description"
        />
      </div>
      <p v-if="error" class="text-sm text-danger">{{ error }}</p>
      <div class="flex justify-end gap-2 pt-1">
        <button type="button" class="btn-secondary" @click="emit('update:open', false)">
          Cancel
        </button>
        <button type="submit" class="btn-primary" :disabled="creating || !form.name.trim()">
          {{ creating ? 'Creating…' : 'Create project' }}
        </button>
      </div>
    </form>
  </AppModal>
</template>
