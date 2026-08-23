<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { CheckCircle2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { cachedGet } from '@/lib/api'
import type { MyTasksBuckets, Task, WorkspaceMember } from '@/types'
import TaskDetailDrawer from '@/components/TaskDetailDrawer.vue'
import MyTasksFocus from '@/components/my-tasks/MyTasksFocus.vue'
import MyTaskRow from '@/components/my-tasks/MyTaskRow.vue'
import type { TaskUrgency } from '@/components/my-tasks/MyTaskRow.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'

type FilterKey = 'focus' | 'upcoming' | 'all'

const auth = useAuthStore()
const buckets = ref<MyTasksBuckets>({
  overdue: [],
  today: [],
  upcoming: [],
  later: [],
})
const members = ref<WorkspaceMember[]>([])
const loading = ref(false)
const selectedTaskId = ref<string | null>(null)
const selectedProjectId = ref<string | null>(null)
const activeFilter = ref<FilterKey>('all')

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'focus', label: 'Focus' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'all', label: 'All' },
]

function matchesProject(task: Task) {
  return !selectedProjectId.value || task.projectId === selectedProjectId.value
}

const displayedGroups = computed(() => {
  const groups: Array<{ key: string; label: string; tasks: Task[]; urgency: TaskUrgency }> = []

  if (activeFilter.value === 'focus' || activeFilter.value === 'all') {
    const overdue = buckets.value.overdue.filter(matchesProject)
    const today = buckets.value.today.filter(matchesProject)

    if (overdue.length) {
      groups.push({ key: 'overdue', label: 'Overdue', tasks: overdue, urgency: 'overdue' })
    }
    if (today.length) {
      groups.push({ key: 'today', label: 'Due today', tasks: today, urgency: 'today' })
    }
  }

  if (activeFilter.value === 'upcoming' || activeFilter.value === 'all') {
    const upcoming = buckets.value.upcoming.filter(matchesProject)
    if (upcoming.length) {
      groups.push({ key: 'upcoming', label: 'Upcoming', tasks: upcoming, urgency: 'upcoming' })
    }
  }

  if (activeFilter.value === 'all') {
    const later = buckets.value.later.filter(matchesProject)
    if (later.length) {
      groups.push({ key: 'later', label: 'No due date', tasks: later, urgency: 'later' })
    }
  }

  return groups
})

const visibleTaskCount = computed(() =>
  displayedGroups.value.reduce((sum, group) => sum + group.tasks.length, 0),
)

const emptyMessage = computed(() => {
  if (selectedProjectId.value) {
    return 'No tasks in this project for the current view.'
  }
  switch (activeFilter.value) {
    case 'focus':
      return "You're caught up — nothing overdue or due today."
    case 'upcoming':
      return 'No upcoming tasks with due dates.'
    default:
      return 'No tasks assigned to you in this workspace.'
  }
})

async function load() {
  if (!auth.activeWorkspace) return
  loading.value = true
  try {
    const [tasksRes, membersRes] = await Promise.all([
      cachedGet<MyTasksBuckets>(`/workspaces/${auth.activeWorkspace.id}/my-tasks`),
      cachedGet<WorkspaceMember[]>(`/workspaces/${auth.activeWorkspace.id}/members`, { cacheTtlMs: 60_000 }),
    ])
    buckets.value = tasksRes.data
    members.value = membersRes.data
  } finally {
    loading.value = false
  }
}

function onUpdated() {
  void load()
}

watch(
  () => auth.activeWorkspaceId,
  () => {
    selectedProjectId.value = null
    void load()
  },
)

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="page-header !mb-4">
      <div class="min-w-0">
        <h1 class="page-title">My Tasks</h1>
        <p class="page-subtitle !mt-0.5">
          Your inbox for {{ auth.activeWorkspace?.name ?? 'this workspace' }}
        </p>
      </div>
      <div class="view-toggle">
        <button
          v-for="filter in filters"
          :key="filter.key"
          type="button"
          class="view-toggle-btn"
          :class="activeFilter === filter.key ? 'view-toggle-btn-active' : ''"
          @click="activeFilter = filter.key"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <MyTasksFocus
      v-if="!loading"
      v-model:selected-project-id="selectedProjectId"
      :buckets="buckets"
      @open-task="selectedTaskId = $event"
    />

    <AppSkeleton v-if="loading" :rows="6" label="Loading your tasks" />

    <template v-else>
      <div v-if="!visibleTaskCount" class="panel flex flex-col items-center px-6 py-12 text-center">
        <CheckCircle2 class="mb-3 h-10 w-10 text-done" aria-hidden="true" />
        <p class="font-medium text-charcoal">{{ emptyMessage }}</p>
        <p class="mt-1 text-sm text-muted">Tasks assigned to you will show up here.</p>
      </div>

      <div v-else class="panel overflow-hidden">
        <template v-for="(group, index) in displayedGroups" :key="group.key">
          <div
            v-if="displayedGroups.length > 1 || activeFilter === 'all'"
            class="flex items-center justify-between border-b border-line bg-canvas/70 px-4 py-2"
            :class="index > 0 ? 'border-t' : ''"
          >
            <h2 class="text-xs font-semibold uppercase tracking-wide text-muted">{{ group.label }}</h2>
            <span class="text-xs text-muted">{{ group.tasks.length }}</span>
          </div>

          <MyTaskRow
            v-for="task in group.tasks"
            :key="task.id"
            :task="task"
            :urgency="group.urgency"
            @open="selectedTaskId = task.id"
          />
        </template>
      </div>
    </template>

    <TaskDetailDrawer
      v-if="selectedTaskId && auth.activeWorkspace"
      :task-id="selectedTaskId"
      :workspace-id="auth.activeWorkspace.id"
      :members="members"
      @close="selectedTaskId = null"
      @updated="onUpdated"
    />
  </div>
</template>
