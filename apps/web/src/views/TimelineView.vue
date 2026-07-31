<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'
import type { Task, WorkspaceMember } from '@/types'
import TaskDetailDrawer from '@/components/TaskDetailDrawer.vue'
import TimelineToolbar from '@/components/timeline/TimelineToolbar.vue'
import TimelineChart from '@/components/timeline/TimelineChart.vue'
import TimelineMobileSchedule from '@/components/timeline/TimelineMobileSchedule.vue'
import {
  addDays,
  buildDayList,
  startOfWeek,
  toDateInput,
} from '@/lib/timeline/geometry'
import type { DependencyDisplayMode, TimelineTask } from '@/lib/timeline/types'

type DragState = {
  taskId: string
  startX: number
  dayDelta: number
  originStart: Date
  originEnd: Date
}

const MIN_DAY_WIDTH = 18
const MAX_DAY_WIDTH = 48
const DRAG_THRESHOLD = 4
const MOBILE_WEEKS = 2
const DESKTOP_MQ = '(min-width: 768px)'

const auth = useAuthStore()
const anchor = ref(startOfWeek(new Date()))
const weeksVisible = ref(6)
const dependencyMode = ref<DependencyDisplayMode>('focused')
const isDesktopTimeline = ref(
  typeof window !== 'undefined' ? window.matchMedia(DESKTOP_MQ).matches : true,
)

const weeksOptions = [
  { value: 4, label: '4 weeks' },
  { value: 6, label: '6 weeks' },
  { value: 8, label: '8 weeks' },
  { value: 12, label: '12 weeks' },
]

const dependencyModeOptions: Array<{ value: DependencyDisplayMode; label: string }> = [
  { value: 'off', label: 'Deps: Off' },
  { value: 'focused', label: 'Deps: Focused' },
  { value: 'all', label: 'Deps: All open' },
]

const tasks = ref<TimelineTask[]>([])
const members = ref<WorkspaceMember[]>([])
const loading = ref(false)
const error = ref('')
const selectedTaskId = ref<string | null>(null)
const drag = ref<DragState | null>(null)
const dragMoved = ref(false)

const linkMode = ref(false)
const linkSourceId = ref<string | null>(null)
const hoverTaskId = ref<string | null>(null)
const linking = ref(false)

const shellEl = ref<HTMLElement | null>(null)
const labelWidth = ref(200)
const chartAvailWidth = ref(0)
const dayWidth = ref(28)

const effectiveWeeks = computed(() =>
  isDesktopTimeline.value ? weeksVisible.value : MOBILE_WEEKS,
)

const rangeStart = computed(() => new Date(anchor.value))
const rangeEnd = computed(() => {
  const end = new Date(anchor.value)
  end.setDate(end.getDate() + effectiveWeeks.value * 7 - 1)
  end.setHours(23, 59, 59, 999)
  return end
})

const days = computed(() => buildDayList(rangeStart.value, rangeEnd.value))
const chartWidth = computed(() => days.value.length * dayWidth.value)
const showWeekday = computed(() => dayWidth.value >= 26)
const compactLabels = computed(() => labelWidth.value < 150)

const rangeLabel = computed(() => {
  const a = rangeStart.value.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  const b = rangeEnd.value.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${a} – ${b}`
})

const linkHint = computed(() => {
  if (!linkMode.value) return null
  if (!linkSourceId.value) {
    return 'Step 1: click the task that must finish first (prerequisite).'
  }
  const source = tasks.value.find((task) => task.id === linkSourceId.value)
  return `Step 2: click the task that waits on “${source?.title ?? 'prerequisite'}”.`
})

function shiftWeeks(delta: number) {
  const next = new Date(anchor.value)
  next.setDate(next.getDate() + delta * 7)
  anchor.value = next
}

function goToday() {
  anchor.value = startOfWeek(new Date())
}

function measureLayout() {
  if (!shellEl.value || !isDesktopTimeline.value) return
  const total = shellEl.value.clientWidth
  const nextLabel =
    total < 480 ? 120 : total < 720 ? 160 : total < 960 ? 200 : 240
  labelWidth.value = nextLabel
  chartAvailWidth.value = Math.max(0, total - nextLabel)

  const count = Math.max(1, days.value.length)
  const fitted = chartAvailWidth.value / count
  dayWidth.value = Math.min(MAX_DAY_WIDTH, Math.max(MIN_DAY_WIDTH, fitted))
}

function onBarPointerDown(event: PointerEvent, task: TimelineTask) {
  if (linkMode.value) {
    pickLink(task)
    return
  }
  if (!task.canEdit) {
    if (event.button === 0) selectedTaskId.value = task.id
    return
  }
  if (!task.barStart || !task.barEnd || event.button !== 0) return
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  dragMoved.value = false
  drag.value = {
    taskId: task.id,
    startX: event.clientX,
    dayDelta: 0,
    originStart: new Date(task.barStart),
    originEnd: new Date(task.barEnd),
  }
}

function onBarPointerMove(event: PointerEvent) {
  if (!drag.value) return
  const px = event.clientX - drag.value.startX
  if (Math.abs(px) >= DRAG_THRESHOLD) dragMoved.value = true
  drag.value.dayDelta = Math.round(px / dayWidth.value)
}

async function onBarPointerUp(event: PointerEvent, task: TimelineTask) {
  if (!drag.value || drag.value.taskId !== task.id) return
  const state = drag.value
  drag.value = null
  try {
    ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
  } catch {
    /* already released */
  }

  if (!dragMoved.value) {
    if (linkMode.value) {
      pickLink(task)
      return
    }
    selectedTaskId.value = task.id
    return
  }

  if (state.dayDelta === 0 || !auth.activeWorkspace) return

  const nextStart = addDays(state.originStart, state.dayDelta)
  const nextEnd = addDays(state.originEnd, state.dayDelta)
  const payload: { startDate?: string | null; dueDate?: string | null } = {}

  if (task.startDate && task.dueDate) {
    payload.startDate = toDateInput(nextStart)
    payload.dueDate = toDateInput(nextEnd)
  } else if (task.startDate && !task.dueDate) {
    payload.startDate = toDateInput(nextStart)
  } else if (!task.startDate && task.dueDate) {
    payload.dueDate = toDateInput(nextEnd)
  } else {
    payload.startDate = toDateInput(nextStart)
    payload.dueDate = toDateInput(nextEnd)
  }

  const idx = tasks.value.findIndex((item) => item.id === task.id)
  const prev = idx >= 0 ? { ...tasks.value[idx] } : null
  if (idx >= 0) {
    tasks.value[idx] = {
      ...tasks.value[idx],
      startDate: payload.startDate ?? tasks.value[idx].startDate,
      dueDate: payload.dueDate ?? tasks.value[idx].dueDate,
      barStart: nextStart.toISOString(),
      barEnd: nextEnd.toISOString(),
    }
  }

  try {
    await api.patch(`/workspaces/${auth.activeWorkspace.id}/tasks/${task.id}`, payload)
  } catch (e: unknown) {
    if (prev && idx >= 0) tasks.value[idx] = prev
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to reschedule task'
  }
}

function onConnectFrom(event: PointerEvent, task: TimelineTask) {
  event.preventDefault()
  event.stopPropagation()
  linkMode.value = true
  linkSourceId.value = task.id
}

async function pickLink(task: TimelineTask) {
  if (!linkMode.value) return

  if (!linkSourceId.value) {
    linkSourceId.value = task.id
    return
  }

  if (linkSourceId.value === task.id) {
    linkSourceId.value = null
    return
  }

  await createDependency(linkSourceId.value, task.id)
  linkSourceId.value = null
  linkMode.value = false
}

async function createDependency(dependsOnId: string, taskId: string) {
  if (!auth.activeWorkspace || linking.value) return
  const target = tasks.value.find((task) => task.id === taskId)
  if (target && target.canEdit === false) {
    error.value = 'You can only link dependencies on tasks you can edit'
    return
  }
  linking.value = true
  error.value = ''
  try {
    await api.post(`/workspaces/${auth.activeWorkspace.id}/tasks/${taskId}/dependencies`, {
      dependsOnId,
    })
    await load()
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Could not link tasks'
  } finally {
    linking.value = false
  }
}

watch(linkMode, (on) => {
  if (!on) linkSourceId.value = null
})

watch(isDesktopTimeline, (desktop) => {
  if (!desktop) {
    linkMode.value = false
    linkSourceId.value = null
    drag.value = null
  }
})

async function load() {
  if (!auth.activeWorkspace) return
  loading.value = true
  error.value = ''
  try {
    const [taskRes, memberRes] = await Promise.all([
      api.get<TimelineTask[]>(`/workspaces/${auth.activeWorkspace.id}/timeline`, {
        params: {
          from: rangeStart.value.toISOString(),
          to: rangeEnd.value.toISOString(),
        },
      }),
      api.get<WorkspaceMember[]>(`/workspaces/${auth.activeWorkspace.id}/members`),
    ])
    tasks.value = taskRes.data
    members.value = memberRes.data
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to load timeline'
  } finally {
    loading.value = false
    await nextTick()
    measureLayout()
  }
}

function onUpdated(_task: Task) {
  void load()
}

function onWindowPointerUp() {
  drag.value = null
}

function onDesktopMqChange(event: MediaQueryListEvent) {
  isDesktopTimeline.value = event.matches
}

let resizeObserver: ResizeObserver | undefined
let desktopMq: MediaQueryList | undefined

watch([() => auth.activeWorkspaceId, anchor, effectiveWeeks], () => {
  void load()
})

watch(days, () => {
  measureLayout()
})

onMounted(() => {
  desktopMq = window.matchMedia(DESKTOP_MQ)
  isDesktopTimeline.value = desktopMq.matches
  desktopMq.addEventListener('change', onDesktopMqChange)

  void load()
  window.addEventListener('pointerup', onWindowPointerUp)
  measureLayout()
})

onUnmounted(() => {
  window.removeEventListener('pointerup', onWindowPointerUp)
  desktopMq?.removeEventListener('change', onDesktopMqChange)
  resizeObserver?.disconnect()
})

watch(shellEl, (el) => {
  resizeObserver?.disconnect()
  resizeObserver = undefined
  if (!el) return
  resizeObserver = new ResizeObserver(() => measureLayout())
  resizeObserver.observe(el)
  measureLayout()
})
</script>

<template>
  <div>
    <TimelineToolbar
      v-model:weeks-visible="weeksVisible"
      v-model:link-mode="linkMode"
      v-model:dependency-mode="dependencyMode"
      :weeks-options="weeksOptions"
      :dependency-mode-options="dependencyModeOptions"
      :range-label="rangeLabel"
      :link-hint="linkHint"
      :mobile="!isDesktopTimeline"
      @today="goToday"
      @prev="shiftWeeks(-1)"
      @next="shiftWeeks(1)"
    />

    <p v-if="error" class="mb-4 text-sm text-danger">{{ error }}</p>
    <p v-if="loading" class="mb-4 text-sm text-muted">Loading timeline…</p>

    <TimelineMobileSchedule
      v-if="!isDesktopTimeline"
      :tasks="tasks"
      :days="days"
      :range-start="rangeStart"
      :selected-task-id="selectedTaskId"
      @open="selectedTaskId = $event"
    />

    <div
      v-else
      ref="shellEl"
      class="overflow-x-auto overflow-y-hidden rounded-xl border border-line-strong bg-surface"
    >
      <TimelineChart
        :tasks="tasks"
        :days="days"
        :range-start="rangeStart"
        :day-width="dayWidth"
        :label-width="labelWidth"
        :chart-width="chartWidth"
        :show-weekday="showWeekday"
        :compact-labels="compactLabels"
        :link-mode="linkMode"
        :link-source-id="linkSourceId"
        :hover-task-id="hoverTaskId"
        :selected-task-id="selectedTaskId"
        :dependency-mode="dependencyMode"
        :drag="drag"
        @update:hover-task-id="hoverTaskId = $event"
        @open="selectedTaskId = $event"
        @bar-pointer-down="onBarPointerDown"
        @bar-pointer-move="onBarPointerMove"
        @bar-pointer-up="onBarPointerUp"
        @connect-from="onConnectFrom"
        @pick-link="pickLink"
      />
    </div>

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
