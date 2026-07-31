<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'
import type {
  AutomationAction,
  AutomationRule,
  AutomationTrigger,
  Project,
  TaskStatus,
  WorkspaceMember,
} from '@/types'
import { STATUSES, STATUS_LABELS } from '@/types'
import AppSelect from '@/components/AppSelect.vue'
import { hasPermission } from '@/lib/permissions'

const auth = useAuthStore()
const rules = ref<AutomationRule[]>([])
const projects = ref<Project[]>([])
const members = ref<WorkspaceMember[]>([])
const loading = ref(false)
const creating = ref(false)
const error = ref('')

const draft = reactive({
  name: '',
  trigger: 'TASK_CREATED' as AutomationTrigger,
  triggerFromStatus: '' as '' | TaskStatus,
  triggerToStatus: '' as '' | TaskStatus,
  action: 'SET_STATUS' as AutomationAction,
  actionStatus: 'IN_PROGRESS' as TaskStatus,
  actionAssigneeId: '',
  actionComment: '',
  projectId: '',
})

const canManage = computed(() =>
  hasPermission(auth.activeWorkspace?.permissions, 'automations.manage'),
)

const triggerOptions = [
  { value: 'TASK_CREATED', label: 'Task is created' },
  { value: 'STATUS_CHANGED', label: 'Status changes' },
]

const actionOptions = [
  { value: 'SET_STATUS', label: 'Set status' },
  { value: 'SET_ASSIGNEE', label: 'Assign to' },
  { value: 'ADD_COMMENT', label: 'Add comment' },
]

const projectOptions = computed(() => [
  { value: '', label: 'All projects' },
  ...projects.value.map((project) => ({ value: project.id, label: project.name })),
])

const statusOptions = computed(() =>
  STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
)

const anyStatusOptions = computed(() => [
  { value: '', label: 'Any' },
  ...statusOptions.value,
])

const memberOptions = computed(() =>
  members.value.map((member) => ({ value: member.user.id, label: member.user.name })),
)

function describeRule(rule: AutomationRule) {
  const trigger =
    rule.trigger === 'TASK_CREATED'
      ? 'When a task is created'
      : `When status changes${rule.triggerToStatus ? ` to ${STATUS_LABELS[rule.triggerToStatus]}` : ''}`
  let action = ''
  if (rule.action === 'SET_STATUS' && rule.actionStatus) {
    action = `set status to ${STATUS_LABELS[rule.actionStatus]}`
  } else if (rule.action === 'SET_ASSIGNEE') {
    action = `assign to ${rule.actionAssignee?.name ?? 'member'}`
  } else if (rule.action === 'ADD_COMMENT') {
    action = `add comment`
  }
  const scope = rule.project ? ` in ${rule.project.name}` : ' (all projects)'
  return `${trigger}${scope} → ${action}`
}

async function load() {
  if (!auth.activeWorkspace) return
  loading.value = true
  error.value = ''
  try {
    const [rulesRes, projectsRes, membersRes] = await Promise.all([
      api.get<AutomationRule[]>(`/workspaces/${auth.activeWorkspace.id}/automations`),
      api.get<Project[]>(`/workspaces/${auth.activeWorkspace.id}/projects`),
      api.get<WorkspaceMember[]>(`/workspaces/${auth.activeWorkspace.id}/members`),
    ])
    rules.value = rulesRes.data
    projects.value = projectsRes.data
    members.value = membersRes.data
    if (!draft.actionAssigneeId && members.value[0]) {
      draft.actionAssigneeId = members.value[0].user.id
    }
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to load automations'
  } finally {
    loading.value = false
  }
}

async function createRule() {
  if (!auth.activeWorkspace || !canManage.value || !draft.name.trim()) return
  creating.value = true
  error.value = ''
  try {
    const payload: Record<string, unknown> = {
      name: draft.name.trim(),
      trigger: draft.trigger,
      action: draft.action,
      projectId: draft.projectId || null,
    }
    if (draft.trigger === 'STATUS_CHANGED') {
      payload.triggerFromStatus = draft.triggerFromStatus || null
      payload.triggerToStatus = draft.triggerToStatus || null
    }
    if (draft.action === 'SET_STATUS') payload.actionStatus = draft.actionStatus
    if (draft.action === 'SET_ASSIGNEE') payload.actionAssigneeId = draft.actionAssigneeId
    if (draft.action === 'ADD_COMMENT') payload.actionComment = draft.actionComment.trim()

    const { data } = await api.post<AutomationRule>(
      `/workspaces/${auth.activeWorkspace.id}/automations`,
      payload,
    )
    rules.value.unshift(data)
    draft.name = ''
    draft.actionComment = ''
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message?.toString() ??
      'Failed to create rule'
  } finally {
    creating.value = false
  }
}

async function toggleRule(rule: AutomationRule) {
  if (!auth.activeWorkspace || !canManage.value) return
  const { data } = await api.patch<AutomationRule>(
    `/workspaces/${auth.activeWorkspace.id}/automations/${rule.id}`,
    { isActive: !rule.isActive },
  )
  const idx = rules.value.findIndex((r) => r.id === rule.id)
  if (idx >= 0) rules.value[idx] = data
}

async function removeRule(rule: AutomationRule) {
  if (!auth.activeWorkspace || !canManage.value) return
  if (!confirm(`Delete rule “${rule.name}”?`)) return
  await api.delete(`/workspaces/${auth.activeWorkspace.id}/automations/${rule.id}`)
  rules.value = rules.value.filter((r) => r.id !== rule.id)
}

watch(() => auth.activeWorkspaceId, () => {
  void load()
})

onMounted(load)
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="page-title">Automations</h1>
      <p class="page-subtitle">
        Simple if-then rules that run when tasks are created or change status.
      </p>
    </div>

    <p v-if="error" class="mb-4 text-sm text-danger">{{ error }}</p>
    <p v-if="loading" class="mb-4 text-muted">Loading…</p>

    <form
      v-if="canManage"
      class="panel mb-8 space-y-4 p-4"
      @submit.prevent="createRule"
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="label">Rule name</label>
          <input v-model="draft.name" class="field" required placeholder="e.g. Auto-assign intake" />
        </div>
        <div>
          <label class="label">When</label>
          <AppSelect v-model="draft.trigger" :options="triggerOptions" />
        </div>
        <div>
          <label class="label">Project scope</label>
          <AppSelect v-model="draft.projectId" :options="projectOptions" />
        </div>
        <template v-if="draft.trigger === 'STATUS_CHANGED'">
          <div>
            <label class="label">From status (optional)</label>
            <AppSelect v-model="draft.triggerFromStatus" :options="anyStatusOptions" />
          </div>
          <div>
            <label class="label">To status (optional)</label>
            <AppSelect v-model="draft.triggerToStatus" :options="anyStatusOptions" />
          </div>
        </template>
        <div>
          <label class="label">Then</label>
          <AppSelect v-model="draft.action" :options="actionOptions" />
        </div>
        <div v-if="draft.action === 'SET_STATUS'">
          <label class="label">New status</label>
          <AppSelect v-model="draft.actionStatus" :options="statusOptions" />
        </div>
        <div v-else-if="draft.action === 'SET_ASSIGNEE'">
          <label class="label">Assignee</label>
          <AppSelect v-model="draft.actionAssigneeId" :options="memberOptions" />
        </div>
        <div v-else class="sm:col-span-2">
          <label class="label">Comment</label>
          <textarea v-model="draft.actionComment" class="field min-h-[80px]" required />
        </div>
      </div>
      <button type="submit" class="btn-primary inline-flex items-center gap-2" :disabled="creating">
        <Plus class="h-4 w-4" />
        {{ creating ? 'Creating…' : 'Add rule' }}
      </button>
    </form>

    <div class="panel overflow-hidden">
      <ul>
        <li v-if="!rules.length" class="px-4 py-8 text-sm text-muted">No automations yet.</li>
        <li
          v-for="rule in rules"
          :key="rule.id"
          class="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-4"
        >
          <div>
            <p class="font-medium text-charcoal">{{ rule.name }}</p>
            <p class="mt-1 text-sm text-muted">{{ describeRule(rule) }}</p>
          </div>
          <div class="flex items-center gap-3">
            <button
              v-if="canManage"
              type="button"
              :class="rule.isActive ? 'badge-active' : 'badge-paused'"
              @click="toggleRule(rule)"
            >
              <span class="badge-dot" />
              {{ rule.isActive ? 'Active' : 'Off' }}
            </button>
            <span v-else :class="rule.isActive ? 'badge-active' : 'badge-paused'">
              <span class="badge-dot" />
              {{ rule.isActive ? 'Active' : 'Off' }}
            </span>
            <button
              v-if="canManage"
              type="button"
              class="text-muted hover:text-danger"
              @click="removeRule(rule)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
