<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'
import type { Project, Task, WorkspaceMember } from '@/types'
import TaskDetailDrawer from '@/components/TaskDetailDrawer.vue'
import CalendarToolbar from '@/components/calendar/CalendarToolbar.vue'
import CalendarDayCell from '@/components/calendar/CalendarDayCell.vue'
import CalendarCreateModal from '@/components/calendar/CalendarCreateModal.vue'
import CalendarMobileAgenda from '@/components/calendar/CalendarMobileAgenda.vue'
import {
  calendarRange,
  goToToday,
  rangeLabel,
  shiftCursor,
  toDateInput,
  toDayKey,
  type CalendarTask,
  type CalendarViewMode,
  buildDayRange,
} from '@/lib/calendar/dates'
import { getDueUrgency } from '@/lib/taskDue'
import { hasPermission } from '@/lib/permissions'

const DESKTOP_MQ = '(min-width: 768px)'

const auth = useAuthStore()

const viewMode = ref<CalendarViewMode>('month')
const cursor = ref(goToToday('month'))
const tasks = ref<CalendarTask[]>([])
const members = ref<WorkspaceMember[]>([])
const projects = ref<Project[]>([])
const loading = ref(false)
const selectedTaskId = ref<string | null>(null)
const error = ref('')

const onlyMine = ref(false)
const assigneeId = ref('')

const showCreate = ref(false)
const createDueDate = ref('')

const isDesktopCalendar = ref(
  typeof window !== 'undefined' ? window.matchMedia(DESKTOP_MQ).matches : true,
)

const canCreateTask = computed(() =>
  hasPermission(auth.activeWorkspace?.permissions, 'tasks.create'),
)

const range = computed(() => calendarRange(viewMode.value, cursor.value))
const days = computed(() => buildDayRange(range.value.start, range.value.end))
const label = computed(() => rangeLabel(viewMode.value, cursor.value, range.value))

const filteredTasks = computed(() => {
  let list = tasks.value
  if (onlyMine.value && auth.user?.id) {
    list = list.filter((task) => task.assignee?.id === auth.user!.id)
  } else if (assigneeId.value) {
    list = list.filter((task) => task.assignee?.id === assigneeId.value)
  }
  return list
})

const tasksByDay = computed(() => {
  const map = new Map<string, CalendarTask[]>()
  for (const task of filteredTasks.value) {
    if (!task.dueDate) continue
    const key = toDayKey(new Date(task.dueDate))
    const bucket = map.get(key) ?? []
    bucket.push(task)
    map.set(key, bucket)
  }
  return map
})

const overdueCount = computed(
  () =>
    filteredTasks.value.filter(
      (task) => task.status !== 'DONE' && getDueUrgency(task.dueDate) === 'overdue',
    ).length,
)

const todayCount = computed(
  () =>
    filteredTasks.value.filter(
      (task) => task.status !== 'DONE' && getDueUrgency(task.dueDate) === 'today',
    ).length,
)

const createAssigneeHint = computed(() => {
  if (onlyMine.value) return auth.user?.id ?? null
  if (assigneeId.value) return assigneeId.value
  return null
})

function prev() {
  cursor.value = shiftCursor(viewMode.value, cursor.value, -1)
}

function next() {
  cursor.value = shiftCursor(viewMode.value, cursor.value, 1)
}

function today() {
  cursor.value = goToToday(viewMode.value)
}

function onViewMode(mode: CalendarViewMode) {
  viewMode.value = mode
  cursor.value = goToToday(mode)
}

function openCreate(day: Date) {
  if (!projects.value.length) {
    error.value = 'Create a project first before adding calendar tasks.'
    return
  }
  createDueDate.value = toDateInput(day)
  showCreate.value = true
}

async function load() {
  if (!auth.activeWorkspace) return
  loading.value = true
  error.value = ''
  try {
    const { start, end } = range.value
    const [taskRes, memberRes, projectRes] = await Promise.all([
      api.get<CalendarTask[]>(`/workspaces/${auth.activeWorkspace.id}/calendar`, {
        params: {
          from: start.toISOString(),
          to: end.toISOString(),
        },
      }),
      api.get<WorkspaceMember[]>(`/workspaces/${auth.activeWorkspace.id}/members`),
      api.get<Project[]>(`/workspaces/${auth.activeWorkspace.id}/projects`),
    ])
    tasks.value = taskRes.data
    members.value = memberRes.data
    projects.value = projectRes.data
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to load calendar'
  } finally {
    loading.value = false
  }
}

function onCreated(_task: Task) {
  void load()
}

function onUpdated() {
  void load()
}

function onDesktopMqChange(event: MediaQueryListEvent) {
  isDesktopCalendar.value = event.matches
}

let desktopMq: MediaQueryList | undefined

watch([() => auth.activeWorkspaceId, cursor, viewMode], () => {
  void load()
})

onMounted(() => {
  desktopMq = window.matchMedia(DESKTOP_MQ)
  isDesktopCalendar.value = desktopMq.matches
  desktopMq.addEventListener('change', onDesktopMqChange)
  void load()
})

onUnmounted(() => {
  desktopMq?.removeEventListener('change', onDesktopMqChange)
})
</script>

<template>
  <div>
    <CalendarToolbar
      :view-mode="viewMode"
      :range-label="label"
      :only-mine="onlyMine"
      :assignee-id="assigneeId"
      :members="members"
      :current-user-id="auth.user?.id"
      :overdue-count="overdueCount"
      :today-count="todayCount"
      :mobile="!isDesktopCalendar"
      @update:view-mode="onViewMode"
      @update:only-mine="onlyMine = $event"
      @update:assignee-id="assigneeId = $event"
      @prev="prev"
      @next="next"
      @today="today"
    />

    <p v-if="error" class="mb-4 text-sm text-danger">{{ error }}</p>
    <p v-if="loading" class="mb-4 text-sm text-muted">Loading calendar…</p>

    <CalendarMobileAgenda
      v-if="!isDesktopCalendar"
      :days="days"
      :tasks-by-day="tasksByDay"
      :view-mode="viewMode"
      :cursor="cursor"
      :can-create="canCreateTask"
      :selected-task-id="selectedTaskId"
      @open="selectedTaskId = $event.id"
      @create="openCreate"
    />

    <div
      v-else
      class="overflow-hidden rounded-xl border border-line-strong bg-surface"
    >
      <div
        v-if="viewMode === 'month'"
        class="grid grid-cols-7 border-b border-line-strong bg-canvas text-center text-xs font-semibold uppercase tracking-wide text-muted"
      >
        <div
          v-for="dayLabel in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
          :key="dayLabel"
          class="px-2 py-2"
        >
          {{ dayLabel }}
        </div>
      </div>

      <div class="grid grid-cols-7">
        <CalendarDayCell
          v-for="day in days"
          :key="toDayKey(day)"
          :day="day"
          :cursor="cursor"
          :view-mode="viewMode"
          :tasks="tasksByDay.get(toDayKey(day)) ?? []"
          :can-create="canCreateTask"
          @open="selectedTaskId = $event.id"
          @create="openCreate"
        />
      </div>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
      <span v-if="canCreateTask && isDesktopCalendar">
        Hover a day and tap + to create a task due that day.
      </span>
      <span v-else-if="canCreateTask">
        Tap a date, then Add to create a task.
      </span>
      <span class="inline-flex items-center gap-1">
        <span class="h-2 w-2 rounded-full bg-brand" /> Today
      </span>
      <span class="inline-flex items-center gap-1">
        <span class="h-2 w-2 rounded-full bg-danger" /> Overdue day
      </span>
      <span class="badge-status badge-todo"><span class="badge-dot" />To do</span>
      <span class="badge-status badge-progress"><span class="badge-dot" />In progress</span>
      <span class="badge-status badge-done"><span class="badge-dot" />Done</span>
    </div>

    <CalendarCreateModal
      v-if="auth.activeWorkspace"
      v-model:open="showCreate"
      :workspace-id="auth.activeWorkspace.id"
      :projects="projects"
      :members="members"
      :initial-due-date="createDueDate"
      :initial-assignee-id="createAssigneeHint"
      @created="onCreated"
    />

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
