<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import api from '@/lib/api'
import type {
  CustomFieldDefinition,
  ProjectSection,
  Task,
  TaskAttachment,
  TaskPriority,
  TaskStatus,
  WorkspaceMember,
} from '@/types'
import { STATUSES, STATUS_LABELS } from '@/types'
import { Check, Plus, X, Link2, Ban, Paperclip, Download, Trash2 } from 'lucide-vue-next'
import { extractMentionQuery, segmentCommentBody } from '@/lib/mentions'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import PriorityBadge from '@/components/ui/PriorityBadge.vue'
import AppSelect from '@/components/AppSelect.vue'

const props = defineProps<{
  workspaceId: string
  taskId: string
  members: WorkspaceMember[]
}>()

const emit = defineEmits<{
  close: []
  updated: [task: Task]
}>()

const task = ref<Task | null>(null)
const fields = ref<CustomFieldDefinition[]>([])
const sections = ref<ProjectSection[]>([])
const projectTasks = ref<Task[]>([])
const loading = ref(true)
const saving = ref(false)
const comment = ref('')
const mentionedUserIds = ref<string[]>([])
const mentionOpen = ref(false)
const mentionQuery = ref('')
const mentionStart = ref(0)
const commentInput = ref<HTMLTextAreaElement | null>(null)
const subtaskTitle = ref('')
const addingSubtask = ref(false)
const dependsOnId = ref('')
const linkingDep = ref(false)
const uploading = ref(false)
const error = ref('')

const canEdit = computed(() => task.value?.canEdit === true)

const form = reactive({
  title: '',
  description: '',
  status: 'TODO' as TaskStatus,
  priority: 'NONE' as TaskPriority,
  dueDate: '',
  startDate: '',
  assigneeId: '',
  sectionId: '',
})

const fieldDraft = reactive<Record<string, string>>({})

const assigneeLabel = computed(() => {
  if (!form.assigneeId) return 'Unassigned'
  return props.members.find((m) => m.user.id === form.assigneeId)?.user.name ?? 'Unassigned'
})

const sectionLabel = computed(() => {
  if (!form.sectionId) return null
  return sections.value.find((s) => s.id === form.sectionId)?.name ?? null
})

const filledCustomFields = computed(() =>
  fields.value
    .map((field) => {
      const raw = fieldDraft[field.id]?.trim() ?? ''
      if (!raw) return null
      return { id: field.id, name: field.name, value: raw }
    })
    .filter((item): item is { id: string; name: string; value: string } => Boolean(item)),
)

function formatDisplayDate(value: string) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const isSubtask = computed(() => Boolean(task.value?.parentId))
const progress = computed(() => task.value?.subtaskProgress ?? { total: 0, completed: 0 })
const dependencyOptions = computed(() => {
  if (!task.value) return []
  const linked = new Set((task.value.blockedByTasks ?? []).map((t) => t.id))
  return projectTasks.value.filter(
    (t) => t.id !== task.value!.id && !linked.has(t.id),
  )
})

const statusOptions = computed(() =>
  STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
)

const priorityOptions = [
  { value: 'NONE', label: 'None' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
]

const assigneeOptions = computed(() => [
  { value: '', label: 'Unassigned' },
  ...props.members.map((member) => ({ value: member.user.id, label: member.user.name })),
])

const sectionOptions = computed(() => [
  { value: '', label: 'No section' },
  ...sections.value.map((section) => ({ value: section.id, label: section.name })),
])

const dependencySelectOptions = computed(() =>
  dependencyOptions.value.map((item) => ({ value: item.id, label: item.title })),
)

function customFieldOptions(field: CustomFieldDefinition) {
  return [
    { value: '', label: '—' },
    ...(field.options ?? []).map((option) => ({ value: option, label: option })),
  ]
}

const mentionSuggestions = computed(() => {
  const q = mentionQuery.value.toLowerCase()
  return props.members
    .map((m) => m.user)
    .filter((u) => {
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
    })
    .slice(0, 6)
})

function applyTask(data: Task) {
  task.value = data
  form.title = data.title
  form.description = data.description ?? ''
  form.status = data.status
  form.priority = data.priority
  form.dueDate = data.dueDate ? data.dueDate.slice(0, 10) : ''
  form.startDate = data.startDate ? data.startDate.slice(0, 10) : ''
  form.assigneeId = data.assigneeId ?? ''
  form.sectionId = data.sectionId ?? ''

  for (const field of fields.value) {
    const value = data.fieldValues?.find((v) => v.fieldId === field.id)
    if (field.type === 'NUMBER') {
      fieldDraft[field.id] = value?.numberValue != null ? String(value.numberValue) : ''
    } else if (field.type === 'DATE') {
      fieldDraft[field.id] = value?.dateValue ? value.dateValue.slice(0, 10) : ''
    } else {
      fieldDraft[field.id] = value?.textValue ?? ''
    }
  }
}

async function load() {
  loading.value = true
  try {
    const [taskRes, fieldsRes] = await Promise.all([
      api.get<Task>(`/workspaces/${props.workspaceId}/tasks/${props.taskId}`),
      api.get<CustomFieldDefinition[]>(
        `/workspaces/${props.workspaceId}/custom-fields`,
      ),
    ])
    fields.value = fieldsRes.data
    applyTask(taskRes.data)

    const [siblings, sectionsRes] = await Promise.all([
      api.get<Task[]>(
        `/workspaces/${props.workspaceId}/projects/${taskRes.data.projectId}/tasks`,
      ),
      api.get<ProjectSection[]>(
        `/workspaces/${props.workspaceId}/projects/${taskRes.data.projectId}/sections`,
      ),
    ])
    projectTasks.value = siblings.data
    sections.value = sectionsRes.data
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!canEdit.value) return
  saving.value = true
  error.value = ''
  try {
    const { data } = await api.patch<Task>(
      `/workspaces/${props.workspaceId}/tasks/${props.taskId}`,
      {
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || null,
        startDate: form.startDate || null,
        assigneeId: form.assigneeId || null,
        sectionId: form.sectionId || null,
      },
    )

    // Persist custom field values for the opened task (not parent refresh payload)
    await Promise.all(
      fields.value.map(async (field) => {
        const raw = fieldDraft[field.id]
        const body =
          field.type === 'NUMBER'
            ? { numberValue: raw === '' ? null : Number(raw) }
            : field.type === 'DATE'
              ? { dateValue: raw || null }
              : { textValue: raw || null }
        await api.put(
          `/workspaces/${props.workspaceId}/tasks/${props.taskId}/fields/${field.id}`,
          body,
        )
      }),
    )

    const refreshed = await api.get<Task>(
      `/workspaces/${props.workspaceId}/tasks/${props.taskId}`,
    )
    applyTask(refreshed.data)
    emit('updated', data.parentId ? data : refreshed.data)
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Save failed'
  } finally {
    saving.value = false
  }
}

async function addComment() {
  if (!comment.value.trim()) return
  await api.post(`/workspaces/${props.workspaceId}/tasks/${props.taskId}/comments`, {
    body: comment.value.trim(),
    mentionedUserIds: mentionedUserIds.value,
  })
  comment.value = ''
  mentionedUserIds.value = []
  mentionOpen.value = false
  await load()
}

function onCommentInput() {
  const el = commentInput.value
  if (!el) return
  const mention = extractMentionQuery(comment.value, el.selectionStart ?? comment.value.length)
  if (!mention) {
    mentionOpen.value = false
    return
  }
  mentionOpen.value = true
  mentionQuery.value = mention.query
  mentionStart.value = mention.start
}

function insertMention(user: { id: string; name: string }) {
  const el = commentInput.value
  const caret = el?.selectionStart ?? comment.value.length
  const before = comment.value.slice(0, mentionStart.value)
  const after = comment.value.slice(caret)
  comment.value = `${before}@${user.name} ${after}`
  if (!mentionedUserIds.value.includes(user.id)) {
    mentionedUserIds.value.push(user.id)
  }
  mentionOpen.value = false
  void nextTick(() => {
    const pos = before.length + user.name.length + 2
    el?.focus()
    el?.setSelectionRange(pos, pos)
  })
}

function commentSegments(c: NonNullable<Task['comments']>[number]) {
  return segmentCommentBody(
    c.body,
    (c.mentions ?? []).map((m) => m.user),
  )
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

async function uploadAttachment(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  error.value = ''
  try {
    const formData = new FormData()
    formData.append('file', file)
    await api.post(
      `/workspaces/${props.workspaceId}/tasks/${props.taskId}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    await load()
    emit('updated', task.value!)
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Upload failed'
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function downloadAttachment(attachment: TaskAttachment) {
  const { data } = await api.get<Blob>(
    `/workspaces/${props.workspaceId}/attachments/${attachment.id}/download`,
    { responseType: 'blob' },
  )
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = attachment.originalName
  a.click()
  URL.revokeObjectURL(url)
}

async function removeAttachment(attachmentId: string) {
  await api.delete(`/workspaces/${props.workspaceId}/attachments/${attachmentId}`)
  await load()
  if (task.value) emit('updated', task.value)
}

async function addSubtask() {
  if (!subtaskTitle.value.trim() || !task.value) return
  addingSubtask.value = true
  try {
    const { data } = await api.post<Task>(
      `/workspaces/${props.workspaceId}/projects/${task.value.projectId}/tasks`,
      { title: subtaskTitle.value.trim(), parentId: task.value.id },
    )
    subtaskTitle.value = ''
    applyTask(data)
    emit('updated', data)
  } finally {
    addingSubtask.value = false
  }
}

async function toggleSubtask(sub: Task) {
  const next: TaskStatus = sub.status === 'DONE' ? 'TODO' : 'DONE'
  const { data } = await api.patch<Task>(
    `/workspaces/${props.workspaceId}/tasks/${sub.id}`,
    { status: next },
  )
  applyTask(data)
  emit('updated', data)
}

async function addDependency() {
  if (!dependsOnId.value) return
  linkingDep.value = true
  error.value = ''
  try {
    const { data } = await api.post<Task>(
      `/workspaces/${props.workspaceId}/tasks/${props.taskId}/dependencies`,
      { dependsOnId: dependsOnId.value },
    )
    dependsOnId.value = ''
    // API may return parent when editing subtask; reload opened task
    await load()
    emit('updated', data)
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Could not add dependency'
  } finally {
    linkingDep.value = false
  }
}

async function removeDependency(blockerId: string) {
  const { data } = await api.delete<Task>(
    `/workspaces/${props.workspaceId}/tasks/${props.taskId}/dependencies/${blockerId}`,
  )
  await load()
  emit('updated', data)
}

watch(
  () => props.taskId,
  () => {
    void load()
  },
)

onMounted(load)
</script>

<template>
  <div class="drawer-shell" @click.self="emit('close')">
    <aside class="drawer-panel">
      <div class="mb-4 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p v-if="task?.parent" class="mb-1 text-xs text-muted">
            Subtask of {{ task.parent.title }}
          </p>
          <h2 class="font-display text-heading text-charcoal">
            {{ canEdit || loading ? 'Task details' : form.title || 'Task details' }}
          </h2>
          <p
            v-if="!isSubtask && progress.total"
            class="mt-1 text-xs text-muted"
          >
            Subtasks {{ progress.completed }}/{{ progress.total }}
          </p>
          <p
            v-if="task?.isBlocked"
            class="badge-danger mt-2"
          >
            <Ban class="h-3 w-3" />
            Blocked by {{ task.openBlockers?.length ?? 0 }}
          </p>
          <div v-if="task" class="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge :status="form.status" />
            <PriorityBadge :priority="form.priority" />
            <span
              v-if="!canEdit"
              class="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted"
            >
              View only
            </span>
          </div>
        </div>
        <button
          type="button"
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-charcoal"
          aria-label="Close"
          @click="emit('close')"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <p v-if="loading" class="text-muted">Loading…</p>

      <!-- Editor form -->
      <form v-else-if="canEdit" class="space-y-4" @submit.prevent="save">
        <div>
          <label class="label">Title</label>
          <input v-model="form.title" required class="field" />
        </div>
        <div>
          <label class="label">Description</label>
          <textarea v-model="form.description" rows="4" class="field" />
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label class="label">Status</label>
            <AppSelect v-model="form.status" :options="statusOptions" />
          </div>
          <div>
            <label class="label">Priority</label>
            <AppSelect v-model="form.priority" :options="priorityOptions" />
          </div>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label class="label">Start date</label>
            <input v-model="form.startDate" type="date" class="field" />
          </div>
          <div>
            <label class="label">Due date</label>
            <input v-model="form.dueDate" type="date" class="field" />
          </div>
        </div>
        <div>
          <label class="label">Assignee</label>
          <AppSelect v-model="form.assigneeId" :options="assigneeOptions" />
        </div>
        <div v-if="!isSubtask">
          <label class="label">Section</label>
          <AppSelect v-model="form.sectionId" :options="sectionOptions" />
        </div>

        <section v-if="fields.length" class="space-y-3 rounded-lg border border-line bg-canvas p-3">
          <h3 class="section-title">Custom fields</h3>
          <div v-for="field in fields" :key="field.id">
            <label class="label">{{ field.name }}</label>
            <AppSelect
              v-if="field.type === 'SINGLE_SELECT'"
              v-model="fieldDraft[field.id]"
              :options="customFieldOptions(field)"
            />
            <input
              v-else-if="field.type === 'NUMBER'"
              v-model="fieldDraft[field.id]"
              type="number"
              class="field"
              step="1"
            />
            <input
              v-else-if="field.type === 'DATE'"
              v-model="fieldDraft[field.id]"
              type="date"
              class="field"
            />
            <input v-else v-model="fieldDraft[field.id]" class="field" />
          </div>
        </section>

        <p v-if="error" class="text-sm text-danger">{{ error }}</p>
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save changes' }}
        </button>
      </form>

      <!-- Compact read-only summary for viewers -->
      <div v-else class="space-y-4">
        <p class="text-sm text-muted">
          You’re viewing this task. Only the assignee, project owner, or workspace owner can edit it.
        </p>

        <p
          v-if="form.description"
          class="whitespace-pre-wrap text-sm leading-relaxed text-charcoal"
        >
          {{ form.description }}
        </p>
        <p v-else class="text-sm italic text-muted">No description</p>

        <dl class="grid grid-cols-1 gap-3 rounded-xl border border-line bg-canvas/70 p-3 sm:grid-cols-2">
          <div>
            <dt class="text-[11px] font-semibold uppercase tracking-wide text-muted">Assignee</dt>
            <dd class="mt-0.5 text-sm text-charcoal">{{ assigneeLabel }}</dd>
          </div>
          <div v-if="sectionLabel">
            <dt class="text-[11px] font-semibold uppercase tracking-wide text-muted">Section</dt>
            <dd class="mt-0.5 text-sm text-charcoal">{{ sectionLabel }}</dd>
          </div>
          <div v-if="formatDisplayDate(form.startDate)">
            <dt class="text-[11px] font-semibold uppercase tracking-wide text-muted">Start</dt>
            <dd class="mt-0.5 text-sm text-charcoal">{{ formatDisplayDate(form.startDate) }}</dd>
          </div>
          <div v-if="formatDisplayDate(form.dueDate)">
            <dt class="text-[11px] font-semibold uppercase tracking-wide text-muted">Due</dt>
            <dd class="mt-0.5 text-sm text-charcoal">{{ formatDisplayDate(form.dueDate) }}</dd>
          </div>
        </dl>

        <section
          v-if="filledCustomFields.length"
          class="space-y-2 rounded-xl border border-line bg-canvas/70 p-3"
        >
          <h3 class="section-title">Details</h3>
          <div
            v-for="field in filledCustomFields"
            :key="field.id"
            class="flex items-baseline justify-between gap-3 border-b border-line/60 py-1.5 last:border-0"
          >
            <span class="text-xs text-muted">{{ field.name }}</span>
            <span class="text-sm text-charcoal">{{ field.value }}</span>
          </div>
        </section>
      </div>

      <section
        v-if="task && (canEdit || (task.blockedByTasks?.length ?? 0) > 0 || (task.blockingTasks?.length ?? 0) > 0)"
        class="divider mt-8 pt-6"
      >
        <div class="mb-3 flex items-center gap-2">
          <Link2 class="h-4 w-4 text-muted" />
          <h3 class="section-title">Blocked by</h3>
        </div>
        <p class="mb-3 text-xs text-muted">
          This task waits until the linked tasks are Done.
        </p>
        <ul class="space-y-2">
          <li
            v-for="blocker in task.blockedByTasks ?? []"
            :key="blocker.id"
            class="flex items-center justify-between gap-2 rounded-lg border border-line bg-canvas px-3 py-2"
          >
            <div>
              <p class="text-sm text-charcoal">{{ blocker.title }}</p>
              <div class="mt-1">
                <StatusBadge :status="blocker.status" />
              </div>
            </div>
            <button
              v-if="canEdit"
              type="button"
              class="text-xs text-danger hover:underline"
              @click="removeDependency(blocker.id)"
            >
              Remove
            </button>
          </li>
        </ul>
        <form v-if="canEdit" class="mt-3 flex gap-2" @submit.prevent="addDependency">
          <AppSelect
            v-model="dependsOnId"
            class="flex-1"
            placeholder="Select a task…"
            :options="dependencySelectOptions"
          />
          <button type="submit" class="btn-secondary" :disabled="linkingDep || !dependsOnId">
            Link
          </button>
        </form>
        <div v-if="task.blockingTasks?.length" class="mt-4">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Blocking
          </p>
          <ul class="space-y-1 text-sm text-muted">
            <li v-for="b in task.blockingTasks" :key="b.id">{{ b.title }}</li>
          </ul>
        </div>
      </section>

      <section
        v-if="task && !isSubtask && (canEdit || (task.subtasks?.length ?? 0) > 0)"
        class="divider mt-8 pt-6"
      >
        <div class="mb-3 flex items-center justify-between">
          <h3 class="section-title">Subtasks</h3>
          <span class="text-xs text-muted">
            {{ progress.completed }}/{{ progress.total }} done
          </span>
        </div>
        <div class="mb-3 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            class="h-full bg-brand transition-all"
            :style="{
              width: progress.total
                ? `${(progress.completed / progress.total) * 100}%`
                : '0%',
            }"
          />
        </div>
        <ul class="space-y-2">
          <li
            v-for="sub in task.subtasks ?? []"
            :key="sub.id"
            class="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2"
          >
            <button
              type="button"
              class="flex h-5 w-5 items-center justify-center rounded border border-line"
              :class="sub.status === 'DONE' ? 'bg-brand text-white' : 'bg-surface'"
              :disabled="!canEdit"
              @click="canEdit && toggleSubtask(sub)"
            >
              <Check v-if="sub.status === 'DONE'" class="h-3 w-3" />
            </button>
            <span
              class="flex-1 text-sm"
              :class="sub.status === 'DONE' ? 'text-muted line-through' : 'text-charcoal'"
            >
              {{ sub.title }}
            </span>
          </li>
        </ul>
        <form v-if="canEdit" class="mt-3 flex gap-2" @submit.prevent="addSubtask">
          <input
            v-model="subtaskTitle"
            class="field flex-1"
            placeholder="Add subtask…"
            required
          />
          <button type="submit" class="btn-secondary inline-flex items-center gap-1" :disabled="addingSubtask">
            <Plus class="h-4 w-4" />
            Add
          </button>
        </form>
      </section>

      <section
        v-if="task && (canEdit || (task.attachments?.length ?? 0) > 0)"
        class="divider mt-8 pt-6"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <Paperclip class="h-4 w-4 text-muted" />
            <h3 class="section-title">Attachments</h3>
          </div>
          <label v-if="canEdit" class="btn-secondary cursor-pointer text-xs">
            {{ uploading ? 'Uploading…' : 'Upload' }}
            <input
              type="file"
              class="hidden"
              :disabled="uploading"
              @change="uploadAttachment"
            />
          </label>
        </div>
        <p v-if="canEdit" class="mb-3 text-xs text-muted">Max 10MB · images, PDF, Office, zip, text</p>
        <div
          v-if="!(task.attachments ?? []).length"
          class="rounded-lg border border-dashed border-line px-3 py-4 text-sm text-muted"
        >
          No files yet.
        </div>
        <ul v-else class="space-y-2">
          <li
            v-for="file in task.attachments"
            :key="file.id"
            class="flex items-center justify-between gap-2 rounded-lg border border-line bg-canvas px-3 py-2"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-charcoal">{{ file.originalName }}</p>
              <p class="text-xs text-muted">
                {{ formatBytes(file.sizeBytes) }}
                <span v-if="file.uploadedBy"> · {{ file.uploadedBy.name }}</span>
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <button
                type="button"
                class="rounded p-1.5 text-muted hover:bg-surface hover:text-brand"
                title="Download"
                @click="downloadAttachment(file)"
              >
                <Download class="h-4 w-4" />
              </button>
              <button
                v-if="canEdit"
                type="button"
                class="rounded p-1.5 text-muted hover:bg-surface hover:text-danger"
                title="Delete"
                @click="removeAttachment(file.id)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </li>
        </ul>
      </section>

      <section v-if="task" class="divider mt-8 pt-6">
        <h3 class="section-title mb-3">Comments</h3>
        <div class="space-y-3">
          <div
            v-for="c in task.comments ?? []"
            :key="c.id"
            class="rounded-lg border border-line bg-canvas p-3"
          >
            <p class="text-xs text-muted">{{ c.author.name }}</p>
            <p class="mt-1 text-sm text-charcoal">
              <template v-for="(seg, idx) in commentSegments(c)" :key="idx">
                <span
                  v-if="seg.type === 'mention'"
                  class="rounded bg-brand-soft px-1 font-medium text-brand"
                >{{ seg.value }}</span>
                <span v-else>{{ seg.value }}</span>
              </template>
            </p>
          </div>
        </div>
        <form class="relative mt-3 space-y-2" @submit.prevent="addComment">
          <div
            v-if="mentionOpen && mentionSuggestions.length"
            class="absolute bottom-full left-0 z-10 mb-1 w-full overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
          >
            <button
              v-for="user in mentionSuggestions"
              :key="user.id"
              type="button"
              class="flex w-full flex-col px-3 py-2 text-left hover:bg-canvas"
              @click="insertMention(user)"
            >
              <span class="text-sm font-medium text-charcoal">{{ user.name }}</span>
              <span class="text-xs text-muted">{{ user.email }}</span>
            </button>
          </div>
          <textarea
            ref="commentInput"
            v-model="comment"
            rows="2"
            class="field w-full"
            placeholder="Write a comment… use @ to mention"
            @input="onCommentInput"
            @keydown.escape="mentionOpen = false"
          />
          <div class="flex justify-end">
            <button type="submit" class="btn-secondary">Post</button>
          </div>
        </form>
      </section>

      <section v-if="task?.activity?.length" class="divider mt-8 pt-6">
        <h3 class="section-title mb-3">Activity</h3>
        <ul class="space-y-2 text-sm text-muted">
          <li v-for="a in task.activity" :key="a.id">
            <span class="font-medium text-charcoal">{{ a.actor.name }}</span>
            · {{ a.type.replaceAll('_', ' ').toLowerCase() }}
          </li>
        </ul>
      </section>
    </aside>
  </div>
</template>
