<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'
import type {
  CustomFieldDefinition,
  IntakeForm,
  IntakeFormField,
  IntakeFormFieldType,
  Project,
  TaskStatus,
  WorkspaceMember,
} from '@/types'
import { STATUSES, STATUS_LABELS } from '@/types'
import AppSelect from '@/components/AppSelect.vue'
import { hasPermission } from '@/lib/permissions'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const formId = computed(() => String(route.params.formId))

const form = ref<IntakeForm | null>(null)
const projects = ref<Project[]>([])
const members = ref<WorkspaceMember[]>([])
const customFields = ref<CustomFieldDefinition[]>([])
const loading = ref(true)
const saving = ref(false)
const addingField = ref(false)
const error = ref('')

const draft = reactive({
  name: '',
  description: '',
  projectId: '',
  defaultAssigneeId: '',
  defaultStatus: 'TODO' as TaskStatus,
  titleTemplate: '',
  isActive: true,
})

const newField = reactive({
  key: '',
  label: '',
  type: 'TEXT' as IntakeFormFieldType,
  required: false,
  options: '',
  customFieldId: '',
})

const canManage = computed(
  () => hasPermission(auth.activeWorkspace?.permissions, 'intake_forms.manage'),
)

const fieldTypes: Array<{ value: IntakeFormFieldType; label: string }> = [
  { value: 'TEXT', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'SINGLE_SELECT', label: 'Single select' },
  { value: 'DATE', label: 'Date' },
  { value: 'DESCRIPTION', label: 'Description' },
]

const projectOptions = computed(() =>
  projects.value.map((project) => ({ value: project.id, label: project.name })),
)

const assigneeOptions = computed(() => [
  { value: '', label: 'None' },
  ...members.value.map((member) => ({ value: member.user.id, label: member.user.name })),
])

const statusOptions = computed(() =>
  STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
)

const customFieldOptions = computed(() => [
  { value: '', label: 'None' },
  ...customFields.value.map((field) => ({ value: field.id, label: field.name })),
])

async function load() {
  if (!auth.activeWorkspace) return
  loading.value = true
  error.value = ''
  try {
    const [formRes, projectsRes, membersRes, fieldsRes] = await Promise.all([
      api.get<IntakeForm>(`/workspaces/${auth.activeWorkspace.id}/forms/${formId.value}`),
      api.get<Project[]>(`/workspaces/${auth.activeWorkspace.id}/projects`),
      api.get<WorkspaceMember[]>(`/workspaces/${auth.activeWorkspace.id}/members`),
      api.get<CustomFieldDefinition[]>(`/workspaces/${auth.activeWorkspace.id}/custom-fields`),
    ])
    form.value = formRes.data
    projects.value = projectsRes.data
    members.value = membersRes.data
    customFields.value = fieldsRes.data
    draft.name = formRes.data.name
    draft.description = formRes.data.description ?? ''
    draft.projectId = formRes.data.projectId
    draft.defaultAssigneeId = formRes.data.defaultAssigneeId ?? ''
    draft.defaultStatus = formRes.data.defaultStatus
    draft.titleTemplate = formRes.data.titleTemplate ?? ''
    draft.isActive = formRes.data.isActive
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to load form'
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!auth.activeWorkspace || !canManage.value) return
  saving.value = true
  error.value = ''
  try {
    const { data } = await api.patch<IntakeForm>(
      `/workspaces/${auth.activeWorkspace.id}/forms/${formId.value}`,
      {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        projectId: draft.projectId,
        defaultAssigneeId: draft.defaultAssigneeId || null,
        defaultStatus: draft.defaultStatus,
        titleTemplate: draft.titleTemplate.trim() || null,
        isActive: draft.isActive,
      },
    )
    form.value = { ...form.value!, ...data, fields: form.value?.fields }
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to save'
  } finally {
    saving.value = false
  }
}

async function addField() {
  if (!auth.activeWorkspace || !canManage.value || !newField.label.trim()) return
  addingField.value = true
  error.value = ''
  try {
    const key =
      newField.key.trim() ||
      newField.label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
    const { data } = await api.post<IntakeFormField>(
      `/workspaces/${auth.activeWorkspace.id}/forms/${formId.value}/fields`,
      {
        key,
        label: newField.label.trim(),
        type: newField.type,
        required: newField.required,
        options:
          newField.type === 'SINGLE_SELECT'
            ? newField.options
                .split(',')
                .map((o) => o.trim())
                .filter(Boolean)
            : undefined,
        customFieldId: newField.customFieldId || null,
      },
    )
    form.value?.fields?.push(data)
    newField.key = ''
    newField.label = ''
    newField.required = false
    newField.options = ''
    newField.customFieldId = ''
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message?.toString() ??
      'Failed to add field'
  } finally {
    addingField.value = false
  }
}

async function removeField(field: IntakeFormField) {
  if (!auth.activeWorkspace || !canManage.value) return
  if (field.type === 'TITLE') return
  await api.delete(
    `/workspaces/${auth.activeWorkspace.id}/forms/${formId.value}/fields/${field.id}`,
  )
  if (form.value?.fields) {
    form.value.fields = form.value.fields.filter((f) => f.id !== field.id)
  }
}

async function removeForm() {
  if (!auth.activeWorkspace || !canManage.value) return
  if (!confirm('Delete this form?')) return
  await api.delete(`/workspaces/${auth.activeWorkspace.id}/forms/${formId.value}`)
  router.push({ name: 'forms' })
}

watch(() => [auth.activeWorkspaceId, formId.value], () => {
  void load()
})

onMounted(load)
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <button type="button" class="mb-2 text-sm text-brand hover:underline" @click="router.push({ name: 'forms' })">
          ← Forms
        </button>
        <h1 class="page-title">{{ form?.name ?? 'Form' }}</h1>
        <p v-if="form" class="page-subtitle break-all">{{ form.shareUrl }}</p>
      </div>
      <button
        v-if="canManage"
        type="button"
        class="inline-flex items-center gap-2 text-sm text-danger hover:underline"
        @click="removeForm"
      >
        <Trash2 class="h-4 w-4" /> Delete form
      </button>
    </div>

    <p v-if="error" class="mb-4 text-sm text-danger">{{ error }}</p>
    <AppSkeleton v-if="loading" variant="editor" label="Loading form builder" />

    <template v-else-if="form">
      <section class="panel mb-8 space-y-4 p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="label">Name</label>
            <input v-model="draft.name" class="field" :disabled="!canManage" />
          </div>
          <div>
            <label class="label">Project</label>
            <AppSelect
              v-model="draft.projectId"
              :options="projectOptions"
              :disabled="!canManage"
            />
          </div>
          <div>
            <label class="label">Default assignee</label>
            <AppSelect
              v-model="draft.defaultAssigneeId"
              :options="assigneeOptions"
              :disabled="!canManage"
            />
          </div>
          <div>
            <label class="label">Default status</label>
            <AppSelect
              v-model="draft.defaultStatus"
              :options="statusOptions"
              :disabled="!canManage"
            />
          </div>
        </div>
        <div>
          <label class="label">Description</label>
          <textarea v-model="draft.description" class="field min-h-[80px]" :disabled="!canManage" />
        </div>
        <div>
          <label class="label">Title fallback template</label>
          <input
            v-model="draft.titleTemplate"
            class="field"
            placeholder="Used if title is empty"
            :disabled="!canManage"
          />
        </div>
        <label v-if="canManage" class="flex items-center gap-2 text-sm text-charcoal">
          <input v-model="draft.isActive" type="checkbox" class="rounded border-line" />
          Form is active
        </label>
        <button
          v-if="canManage"
          type="button"
          class="btn-primary"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? 'Saving…' : 'Save settings' }}
        </button>
      </section>

      <section class="mb-8">
        <h2 class="section-title mb-3">Fields</h2>
        <div class="panel mb-4 overflow-hidden">
          <ul>
            <li
              v-for="field in form.fields"
              :key="field.id"
              class="flex items-center justify-between gap-3 border-b border-line px-4 py-3 text-sm"
            >
              <div>
                <p class="font-medium text-charcoal">
                  {{ field.label }}
                  <span v-if="field.required" class="text-danger">*</span>
                </p>
                <p class="text-xs text-muted">{{ field.type }} · {{ field.key }}</p>
              </div>
              <button
                v-if="canManage && field.type !== 'TITLE'"
                type="button"
                class="text-muted hover:text-danger"
                @click="removeField(field)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </li>
          </ul>
        </div>

        <form
          v-if="canManage"
          class="panel grid gap-3 p-4 sm:grid-cols-2"
          @submit.prevent="addField"
        >
          <div>
            <label class="label">Label</label>
            <input v-model="newField.label" class="field" required />
          </div>
          <div>
            <label class="label">Key</label>
            <input v-model="newField.key" class="field" placeholder="auto from label" />
          </div>
          <div>
            <label class="label">Type</label>
            <AppSelect v-model="newField.type" :options="fieldTypes" />
          </div>
          <div>
            <label class="label">Map to custom field</label>
            <AppSelect v-model="newField.customFieldId" :options="customFieldOptions" />
          </div>
          <div v-if="newField.type === 'SINGLE_SELECT'" class="sm:col-span-2">
            <label class="label">Options (comma-separated)</label>
            <input v-model="newField.options" class="field" required />
          </div>
          <label class="flex items-center gap-2 text-sm text-charcoal sm:col-span-2">
            <input v-model="newField.required" type="checkbox" class="rounded border-line" />
            Required
          </label>
          <button type="submit" class="btn-primary inline-flex items-center gap-2" :disabled="addingField">
            <Plus class="h-4 w-4" />
            {{ addingField ? 'Adding…' : 'Add field' }}
          </button>
        </form>
      </section>
    </template>
  </div>
</template>
