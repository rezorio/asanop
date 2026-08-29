<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import api, { cachedGet } from '@/lib/api'
import type { Project, ProjectSection, Task, TaskStatus, WorkspaceMember } from '@/types'
import TaskDetailDrawer from '@/components/TaskDetailDrawer.vue'
import CreateTaskModal from '@/components/CreateTaskModal.vue'
import ProjectListView from '@/components/project/ProjectListView.vue'
import ProjectListToolbar from '@/components/project/ProjectListToolbar.vue'
import ProjectBoardCard from '@/components/project/ProjectBoardCard.vue'
import ProjectSettingsPanel from '@/components/project/ProjectSettingsPanel.vue'
import { useProjectTaskBrowser } from '@/composables/useProjectTaskBrowser'
import { STATUS_COLUMN_CLASS } from '@/lib/uiStyles'
import { hasPermission } from '@/lib/permissions'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const projectId = computed(() => route.params.projectId as string)

const view = ref<'overview' | 'list' | 'board' | 'settings'>('board')
const project = ref<Project | null>(null)
const sections = ref<ProjectSection[]>([])
const tasks = ref<Task[]>([])
const members = ref<WorkspaceMember[]>([])
const loading = ref(false)
const selectedTaskId = ref<string | null>(null)
const showCreateTask = ref(false)
const createInitialStatus = ref<TaskStatus | null>(null)
const addingSection = ref(false)
const newSectionName = ref('')
const error = ref('')

const canCreateTask = computed(() =>
  hasPermission(auth.activeWorkspace?.permissions, 'tasks.create'),
)
const canManageProject = computed(() =>
  hasPermission(auth.activeWorkspace?.permissions, 'projects.manage'),
)

const {
  query,
  filters,
  groupBy,
  sortKey,
  sortDirection,
  total,
  visibleCount,
  filtering,
  listGroups,
  boardColumns,
  resetControls,
} = useProjectTaskBrowser({
  tasks,
  sections,
  currentUserId: () => auth.user?.id,
  defaultGroupBy: 'status',
})

watch(view, (next, prev) => {
  if (next === 'board' && prev === 'list' && groupBy.value === 'section') {
    groupBy.value = 'status'
  }
  if (next === 'list' && prev === 'board' && groupBy.value === 'status') {
    groupBy.value = 'section'
  }
})

function columnClass(status?: TaskStatus) {
  if (status) return STATUS_COLUMN_CLASS[status]
  return 'column-status'
}

function openCreateTask(status?: TaskStatus) {
  createInitialStatus.value = status ?? null
  showCreateTask.value = true
}

async function load() {
  if (!auth.activeWorkspace) return
  loading.value = true
  error.value = ''
  try {
    const [projectRes, taskRes, memberRes, sectionRes] = await Promise.all([
      cachedGet<Project>(`/workspaces/${auth.activeWorkspace.id}/projects/${projectId.value}`),
      cachedGet<Task[]>(`/workspaces/${auth.activeWorkspace.id}/projects/${projectId.value}/tasks`),
      cachedGet<WorkspaceMember[]>(`/workspaces/${auth.activeWorkspace.id}/members`, {
        cacheTtlMs: 60_000,
      }),
      cachedGet<ProjectSection[]>(
        `/workspaces/${auth.activeWorkspace.id}/projects/${projectId.value}/sections`,
      ),
    ])
    project.value = projectRes.data
    tasks.value = taskRes.data
    members.value = memberRes.data
    sections.value = sectionRes.data
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to load project'
  } finally {
    loading.value = false
  }
}

function onProjectUpdated(next: Project) {
  project.value = next
}

function onProjectArchived() {
  void router.push({ name: 'dashboard' })
}

async function addSection() {
  if (!auth.activeWorkspace || !newSectionName.value.trim()) return
  addingSection.value = true
  try {
    const { data } = await api.post<ProjectSection>(
      `/workspaces/${auth.activeWorkspace.id}/projects/${projectId.value}/sections`,
      { name: newSectionName.value.trim() },
    )
    sections.value.push(data)
    newSectionName.value = ''
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to add section'
  } finally {
    addingSection.value = false
  }
}

async function renameSection(section: ProjectSection, name: string) {
  if (!auth.activeWorkspace || section.id === '__none__' || !name.trim()) return
  const { data } = await api.patch<ProjectSection>(
    `/workspaces/${auth.activeWorkspace.id}/projects/${projectId.value}/sections/${section.id}`,
    { name: name.trim() },
  )
  const idx = sections.value.findIndex((s) => s.id === section.id)
  if (idx >= 0) sections.value[idx] = data
}

async function removeSection(section: ProjectSection) {
  if (!auth.activeWorkspace || section.id === '__none__') return
  if (!confirm(`Delete section “${section.name}”? Tasks move to another section.`)) return
  await api.delete(
    `/workspaces/${auth.activeWorkspace.id}/projects/${projectId.value}/sections/${section.id}`,
  )
  await load()
}

async function moveSection(section: ProjectSection, direction: -1 | 1) {
  if (!auth.activeWorkspace || section.id === '__none__') return
  const ids = sections.value.map((s) => s.id)
  const idx = ids.indexOf(section.id)
  const swap = idx + direction
  if (idx < 0 || swap < 0 || swap >= ids.length) return
  ;[ids[idx], ids[swap]] = [ids[swap], ids[idx]]
  const { data } = await api.patch<ProjectSection[]>(
    `/workspaces/${auth.activeWorkspace.id}/projects/${projectId.value}/sections/reorder`,
    { sectionIds: ids },
  )
  sections.value = data
}

function onTaskCreated(task: Task) {
  tasks.value = [task, ...tasks.value]
  void load()
}

async function moveTask(task: Task, status: TaskStatus) {
  if (!auth.activeWorkspace || task.status === status) return
  const prev = task.status
  task.status = status
  try {
    const { data } = await api.patch<Task>(
      `/workspaces/${auth.activeWorkspace.id}/tasks/${task.id}`,
      { status },
    )
    const idx = tasks.value.findIndex((t) => t.id === task.id)
    if (idx >= 0) tasks.value[idx] = { ...tasks.value[idx], ...data }
    void load()
  } catch {
    task.status = prev
  }
}

function onTaskUpdated(_task: Task) {
  void load()
}

watch([() => auth.activeWorkspaceId, projectId], () => {
  void load()
})

watch(
  () => route.query.taskId,
  (taskId) => {
    if (typeof taskId === 'string' && taskId) {
      selectedTaskId.value = taskId
      view.value = 'board'
    }
  },
  { immediate: true },
)

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <div class="min-w-0">
        <h1 class="page-title">{{ project?.name ?? 'Project' }}</h1>
        <p v-if="project?.description" class="page-subtitle mt-1 line-clamp-2">
          {{ project.description }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="view-toggle">
          <button
            type="button"
            class="view-toggle-btn"
            :class="view === 'overview' ? 'view-toggle-btn-active' : ''"
            @click="view = 'overview'"
          >
            Overview
          </button>
          <button
            type="button"
            class="view-toggle-btn"
            :class="view === 'board' ? 'view-toggle-btn-active' : ''"
            @click="view = 'board'"
          >
            Board
          </button>
          <button
            type="button"
            class="view-toggle-btn"
            :class="view === 'list' ? 'view-toggle-btn-active' : ''"
            @click="view = 'list'"
          >
            List
          </button>
          <button
            type="button"
            class="view-toggle-btn"
            :class="view === 'settings' ? 'view-toggle-btn-active' : ''"
            @click="view = 'settings'"
          >
            Settings
          </button>
        </div>
      </div>
    </div>

    <p v-if="error" class="mb-4 text-sm text-danger">{{ error }}</p>

    <template v-if="view === 'overview'">
      <p v-if="loading" class="text-muted">Loading…</p>
      <template v-else-if="project">
        <section class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div class="panel p-4">
            <p class="text-xs uppercase tracking-wide text-muted">Total</p>
            <p class="mt-1 font-display text-2xl font-semibold">{{ project.stats?.total ?? 0 }}</p>
          </div>
          <div class="panel p-4">
            <p class="text-xs uppercase tracking-wide text-muted">In progress</p>
            <p class="mt-1 font-display text-2xl font-semibold text-progress">
              {{ project.stats?.byStatus.IN_PROGRESS ?? 0 }}
            </p>
          </div>
          <div class="panel p-4">
            <p class="text-xs uppercase tracking-wide text-muted">Overdue</p>
            <p class="mt-1 font-display text-2xl font-semibold text-danger">
              {{ project.stats?.overdue ?? 0 }}
            </p>
          </div>
          <div class="panel p-4">
            <p class="text-xs uppercase tracking-wide text-muted">Blocked</p>
            <p class="mt-1 font-display text-2xl font-semibold">
              {{ project.stats?.blocked ?? 0 }}
            </p>
          </div>
        </section>

        <section v-if="project.brief" class="panel mb-6 space-y-2 p-4">
          <div class="flex items-start justify-between gap-3">
            <h2 class="section-title">Project brief</h2>
            <button
              type="button"
              class="text-xs font-semibold text-brand hover:underline"
              @click="view = 'settings'"
            >
              Edit in Settings
            </button>
          </div>
          <p class="whitespace-pre-wrap text-sm leading-relaxed text-muted">{{ project.brief }}</p>
        </section>

        <section class="panel space-y-3 p-4">
          <h2 class="section-title">Sections</h2>
          <ul class="space-y-2">
            <li
              v-for="(section, index) in sections"
              :key="section.id"
              class="flex flex-wrap items-center gap-2 border-b border-line py-2"
            >
              <input
                class="field flex-1"
                :value="section.name"
                @change="renameSection(section, ($event.target as HTMLInputElement).value)"
              />
              <span class="text-xs text-muted">{{ section._count?.tasks ?? 0 }} tasks</span>
              <button
                type="button"
                class="rounded border border-line p-1 text-muted hover:text-charcoal"
                :disabled="index === 0"
                @click="moveSection(section, -1)"
              >
                <ChevronUp class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="rounded border border-line p-1 text-muted hover:text-charcoal"
                :disabled="index === sections.length - 1"
                @click="moveSection(section, 1)"
              >
                <ChevronDown class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="text-muted hover:text-danger"
                :disabled="sections.length <= 1"
                @click="removeSection(section)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </li>
          </ul>
          <form class="flex gap-2" @submit.prevent="addSection">
            <input
              v-model="newSectionName"
              class="field flex-1"
              placeholder="New section name"
              required
            />
            <button
              type="submit"
              class="btn-secondary inline-flex items-center gap-1"
              :disabled="addingSection"
            >
              <Plus class="h-4 w-4" />
              Add
            </button>
          </form>
        </section>
      </template>
    </template>

    <template v-else-if="view === 'settings'">
      <AppSkeleton v-if="loading && !project" :rows="5" label="Loading project settings" />
      <ProjectSettingsPanel
        v-else-if="project && auth.activeWorkspace"
        :workspace-id="auth.activeWorkspace.id"
        :project="project"
        :can-manage="canManageProject"
        @updated="onProjectUpdated"
        @archived="onProjectArchived"
      />
    </template>

    <template v-else>
      <AppSkeleton v-if="loading" :rows="7" label="Loading project tasks" />

      <div v-else class="space-y-4">
        <ProjectListToolbar
          v-model:query="query"
          v-model:filters="filters"
          v-model:group-by="groupBy"
          v-model:sort-key="sortKey"
          v-model:sort-direction="sortDirection"
          :members="members"
          :current-user-id="auth.user?.id"
          :visible-count="visibleCount"
          :total-count="total"
          :can-create="canCreateTask"
          @reset="resetControls"
          @create="openCreateTask()"
        />

        <template v-if="view === 'board'">
          <div v-if="!total" class="panel flex flex-col items-center px-6 py-14 text-center">
            <p class="font-medium text-charcoal">No tasks yet</p>
            <p class="mt-1 text-sm text-muted">Create a task to start filling this board.</p>
            <button
              v-if="canCreateTask"
              type="button"
              class="btn-primary mt-4"
              @click="openCreateTask()"
            >
              New task
            </button>
          </div>

          <div
            v-else-if="!visibleCount"
            class="panel flex flex-col items-center px-6 py-14 text-center"
          >
            <p class="font-medium text-charcoal">No tasks match these filters</p>
            <p class="mt-1 text-sm text-muted">
              Try clearing “Only my tasks” or other filters to widen the board.
            </p>
            <button type="button" class="btn-secondary mt-4" @click="resetControls">
              Clear filters
            </button>
          </div>

          <div v-else class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <section
              v-for="column in boardColumns"
              :key="column.id"
              :class="columnClass(column.status)"
            >
              <header class="board-column-header">
                <h2 class="board-column-title">{{ column.label }}</h2>
                <span class="board-column-count">{{ column.tasks.length }}</span>
              </header>

              <div class="flex min-h-0 flex-1 flex-col gap-2">
                <ProjectBoardCard
                  v-for="task in column.tasks"
                  :key="task.id"
                  :task="task"
                  @open="selectedTaskId = task.id"
                />

                <p
                  v-if="!column.tasks.length"
                  class="px-2 py-4 text-center text-xs text-charcoal/50"
                >
                  No tasks
                </p>

                <button
                  v-if="canCreateTask"
                  type="button"
                  class="mt-auto flex items-center gap-1.5 rounded-lg px-2 py-2 text-left text-xs font-semibold text-charcoal/55 transition hover:bg-charcoal/5 hover:text-charcoal"
                  @click="openCreateTask(column.status)"
                >
                  <Plus class="h-3.5 w-3.5" aria-hidden="true" />
                  Add task
                </button>
              </div>
            </section>
          </div>
        </template>

        <ProjectListView
          v-else
          :groups="listGroups"
          :group-by="groupBy"
          :filtering="filtering"
          :total="total"
          :visible-count="visibleCount"
          :can-create="canCreateTask"
          @open="selectedTaskId = $event"
          @move="moveTask"
          @create="openCreateTask()"
          @reset="resetControls"
        />
      </div>
    </template>

    <CreateTaskModal
      v-if="auth.activeWorkspace"
      v-model:open="showCreateTask"
      :workspace-id="auth.activeWorkspace.id"
      :project-id="projectId"
      :sections="sections"
      :members="members"
      :initial-status="createInitialStatus"
      @created="onTaskCreated"
    />

    <TaskDetailDrawer
      v-if="selectedTaskId && auth.activeWorkspace"
      :task-id="selectedTaskId"
      :workspace-id="auth.activeWorkspace.id"
      :members="members"
      @close="selectedTaskId = null"
      @updated="onTaskUpdated"
    />
  </div>
</template>
