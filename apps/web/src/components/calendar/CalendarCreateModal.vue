<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import AppModal from '@/components/AppModal.vue'
import AppSelect from '@/components/AppSelect.vue'
import api from '@/lib/api'
import type { Project, ProjectSection, Task, TaskPriority, WorkspaceMember } from '@/types'

const props = defineProps<{
  open: boolean
  workspaceId: string
  projects: Project[]
  members: WorkspaceMember[]
  initialDueDate: string
  initialAssigneeId?: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [task: Task]
}>()

const creating = ref(false)
const loadingSections = ref(false)
const error = ref('')
const sections = ref<ProjectSection[]>([])

const form = reactive({
  title: '',
  projectId: '',
  sectionId: '',
  assigneeId: '',
  priority: 'NONE' as TaskPriority,
  dueDate: '',
})

const projectOptions = computed(() =>
  props.projects.map((project) => ({ value: project.id, label: project.name })),
)

const sectionOptions = computed(() =>
  sections.value.map((section) => ({ value: section.id, label: section.name })),
)

const assigneeOptions = computed(() => [
  { value: '', label: 'Unassigned' },
  ...props.members.map((member) => ({ value: member.user.id, label: member.user.name })),
])

const priorityOptions = [
  { value: 'NONE', label: 'None' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
]

async function loadSections(projectId: string) {
  if (!projectId) {
    sections.value = []
    form.sectionId = ''
    return
  }
  loadingSections.value = true
  try {
    const { data } = await api.get<ProjectSection[]>(
      `/workspaces/${props.workspaceId}/projects/${projectId}/sections`,
    )
    sections.value = data
    form.sectionId = data[0]?.id ?? ''
  } catch {
    sections.value = []
    form.sectionId = ''
  } finally {
    loadingSections.value = false
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    form.title = ''
    form.priority = 'NONE'
    form.dueDate = props.initialDueDate
    form.assigneeId = props.initialAssigneeId ?? ''
    form.projectId = props.projects[0]?.id ?? ''
    error.value = ''
    await loadSections(form.projectId)
  },
)

watch(
  () => form.projectId,
  (projectId, prev) => {
    if (!props.open || projectId === prev) return
    void loadSections(projectId)
  },
)

async function submit() {
  if (!form.title.trim() || !form.projectId) return
  creating.value = true
  error.value = ''
  try {
    const { data } = await api.post<Task>(
      `/workspaces/${props.workspaceId}/projects/${form.projectId}/tasks`,
      {
        title: form.title.trim(),
        sectionId: form.sectionId || undefined,
        assigneeId: form.assigneeId || undefined,
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
    :subtitle="`Due ${initialDueDate}`"
    @update:open="emit('update:open', $event)"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <label class="label">Title</label>
        <input v-model="form.title" class="field" required autofocus placeholder="Task title" />
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label class="label">Project</label>
          <AppSelect v-model="form.projectId" :options="projectOptions" />
        </div>
        <div>
          <label class="label">Section</label>
          <AppSelect
            v-model="form.sectionId"
            :options="sectionOptions"
            :disabled="loadingSections || !sectionOptions.length"
            :placeholder="loadingSections ? 'Loading…' : 'No section'"
          />
        </div>
        <div>
          <label class="label">Assignee</label>
          <AppSelect v-model="form.assigneeId" :options="assigneeOptions" />
        </div>
        <div>
          <label class="label">Priority</label>
          <AppSelect v-model="form.priority" :options="priorityOptions" />
        </div>
      </div>
      <div>
        <label class="label">Due date</label>
        <input v-model="form.dueDate" type="date" class="field" required />
      </div>
      <p v-if="error" class="text-sm text-danger">{{ error }}</p>
      <div class="flex justify-end gap-2 pt-1">
        <button type="button" class="btn-secondary" @click="emit('update:open', false)">
          Cancel
        </button>
        <button
          type="submit"
          class="btn-primary"
          :disabled="creating || !form.title.trim() || !form.projectId"
        >
          {{ creating ? 'Creating…' : 'Create task' }}
        </button>
      </div>
    </form>
  </AppModal>
</template>
