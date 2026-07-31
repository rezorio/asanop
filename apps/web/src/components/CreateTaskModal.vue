<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import AppModal from '@/components/AppModal.vue'
import AppSelect from '@/components/AppSelect.vue'
import api from '@/lib/api'
import type { ProjectSection, Task, TaskPriority, TaskStatus, WorkspaceMember } from '@/types'
import { STATUSES, STATUS_LABELS } from '@/types'
const props = defineProps<{
  open: boolean
  workspaceId: string
  projectId: string
  sections: ProjectSection[]
  members: WorkspaceMember[]
  initialSectionId?: string | null
  initialStatus?: TaskStatus | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [task: Task]
}>()

const creating = ref(false)
const error = ref('')
const form = reactive({
  title: '',
  description: '',
  sectionId: '',
  assigneeId: '',
  status: 'TODO' as TaskStatus,
  priority: 'NONE' as TaskPriority,
  dueDate: '',
})

const sectionOptions = computed(() =>
  props.sections.map((section) => ({ value: section.id, label: section.name })),
)

const assigneeOptions = computed(() => [
  { value: '', label: 'Unassigned' },
  ...props.members.map((member) => ({ value: member.user.id, label: member.user.name })),
])

const statusOptions = computed(() =>
  STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
)

const priorityOptions = [
  { value: 'NONE', label: 'None' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
]

watch(  () => props.open,
  (open) => {
    if (open) {
      form.title = ''
      form.description = ''
      form.sectionId = props.initialSectionId || props.sections[0]?.id || ''
      form.assigneeId = ''
      form.status = props.initialStatus || 'TODO'
      form.priority = 'NONE'
      form.dueDate = ''
      error.value = ''
    }
  },
)

async function submit() {
  if (!form.title.trim()) return
  creating.value = true
  error.value = ''
  try {
    const { data } = await api.post<Task>(
      `/workspaces/${props.workspaceId}/projects/${props.projectId}/tasks`,
      {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        sectionId: form.sectionId || undefined,
        assigneeId: form.assigneeId || undefined,
        status: form.status,
        priority: form.priority === 'NONE' ? undefined : form.priority,
        dueDate: form.dueDate || undefined,
      },
    )
    emit('created', data)
    emit('update:open', false)
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message?.toString() ??
      'Could not create task'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <AppModal
    :open="open"
    title="New task"
    subtitle="Add work to this project with the right section and owner."
    @update:open="emit('update:open', $event)"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <label class="label">Title</label>
        <input v-model="form.title" class="field" required autofocus placeholder="Task title" />
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label class="label">Section</label>
          <AppSelect v-model="form.sectionId" :options="sectionOptions" />
        </div>
        <div>
          <label class="label">Assignee</label>
          <AppSelect v-model="form.assigneeId" :options="assigneeOptions" />
        </div>
        <div>
          <label class="label">Status</label>
          <AppSelect v-model="form.status" :options="statusOptions" />
        </div>
        <div>
          <label class="label">Priority</label>
          <AppSelect v-model="form.priority" :options="priorityOptions" />
        </div>      </div>
      <div>
        <label class="label">Due date</label>
        <input v-model="form.dueDate" type="date" class="field" />
      </div>
      <div>
        <label class="label">Description</label>
        <textarea
          v-model="form.description"
          class="field min-h-[96px]"
          placeholder="Optional details"
        />
      </div>
      <p v-if="error" class="text-sm text-danger">{{ error }}</p>
      <div class="flex justify-end gap-2 pt-1">
        <button type="button" class="btn-secondary" @click="emit('update:open', false)">
          Cancel
        </button>
        <button type="submit" class="btn-primary" :disabled="creating || !form.title.trim()">
          {{ creating ? 'Creating…' : 'Create task' }}
        </button>
      </div>
    </form>
  </AppModal>
</template>
