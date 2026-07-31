<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  UserRound,
} from 'lucide-vue-next'
import AppSelect from '@/components/AppSelect.vue'
import type { WorkspaceMember } from '@/types'
import type { CalendarViewMode } from '@/lib/calendar/dates'

const props = defineProps<{
  viewMode: CalendarViewMode
  rangeLabel: string
  onlyMine: boolean
  assigneeId: string
  members: WorkspaceMember[]
  currentUserId?: string | null
  overdueCount: number
  todayCount: number
  /** Compact single-row toolbar for small screens */
  mobile?: boolean
}>()

const emit = defineEmits<{
  'update:viewMode': [value: CalendarViewMode]
  'update:onlyMine': [value: boolean]
  'update:assigneeId': [value: string]
  prev: []
  next: []
  today: []
}>()

const filterOpen = ref(false)
const filterRoot = ref<HTMLElement | null>(null)

const viewModeOptions = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
]

const assigneeOptions = computed(() => [
  { value: '', label: 'All assignees' },
  ...props.members.map((member) => ({
    value: member.user.id,
    label:
      member.user.id === props.currentUserId
        ? `${member.user.name} · you`
        : member.user.name,
  })),
])

const filterActive = computed(() => props.onlyMine || Boolean(props.assigneeId))

function toggleMine() {
  const next = !props.onlyMine
  emit('update:onlyMine', next)
  if (next) emit('update:assigneeId', '')
}

function onAssignee(value: string | number) {
  emit('update:assigneeId', String(value))
  if (value) emit('update:onlyMine', false)
}

function onDocPointerDown(event: PointerEvent) {
  if (!filterOpen.value || !filterRoot.value) return
  if (!filterRoot.value.contains(event.target as Node)) {
    filterOpen.value = false
  }
}

onMounted(() => document.addEventListener('pointerdown', onDocPointerDown))
onUnmounted(() => document.removeEventListener('pointerdown', onDocPointerDown))
</script>

<template>
  <!-- Mobile: month title fully visible, controls on one row under it -->
  <div v-if="mobile" class="mb-3 space-y-2">
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="shrink-0 rounded-lg border border-line bg-surface p-2 hover:bg-canvas"
        :aria-label="viewMode === 'week' ? 'Previous week' : 'Previous month'"
        @click="emit('prev')"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>

      <p
        class="min-w-0 flex-1 px-1 text-center font-display text-base font-semibold leading-tight text-charcoal"
      >
        {{ rangeLabel }}
      </p>

      <button
        type="button"
        class="shrink-0 rounded-lg border border-line bg-surface p-2 hover:bg-canvas"
        :aria-label="viewMode === 'week' ? 'Next week' : 'Next month'"
        @click="emit('next')"
      >
        <ChevronRight class="h-4 w-4" />
      </button>
    </div>

    <div class="flex items-center gap-1.5">
      <AppSelect
        :model-value="viewMode"
        class="min-w-0 flex-1"
        variant="compact"
        :options="viewModeOptions"
        @update:model-value="emit('update:viewMode', $event as CalendarViewMode)"
      />

      <button
        type="button"
        class="shrink-0 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-charcoal hover:bg-canvas"
        @click="emit('today')"
      >
        Today
      </button>

      <div ref="filterRoot" class="relative shrink-0">
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-semibold transition"
          :class="
            filterActive || filterOpen
              ? 'border-brand bg-brand-soft text-brand'
              : 'border-line bg-surface text-charcoal hover:bg-canvas'
          "
          :aria-expanded="filterOpen"
          aria-haspopup="dialog"
          @click="filterOpen = !filterOpen"
        >
          <Filter class="h-3.5 w-3.5" aria-hidden="true" />
          Filter
          <span
            v-if="filterActive"
            class="h-1.5 w-1.5 rounded-full bg-brand"
            aria-hidden="true"
          />
        </button>

        <div
          v-if="filterOpen"
          class="absolute right-0 z-30 mt-1.5 w-64 rounded-xl border border-line-strong bg-surface p-3 shadow-lg"
          role="dialog"
          aria-label="Calendar filters"
        >
          <button
            type="button"
            class="mb-2 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition"
            :class="
              onlyMine
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-line text-charcoal hover:border-brand/40'
            "
            @click="toggleMine"
          >
            <UserRound class="h-4 w-4 shrink-0" aria-hidden="true" />
            Only my tasks
          </button>

          <AppSelect
            :model-value="assigneeId"
            class="w-full"
            variant="compact"
            :options="assigneeOptions"
            @update:model-value="onAssignee"
          />

          <div class="mt-3 flex flex-wrap gap-1.5 text-[11px]">
            <span
              v-if="overdueCount"
              class="rounded-md bg-danger-soft/50 px-2 py-0.5 font-semibold text-danger"
            >
              {{ overdueCount }} overdue
            </span>
            <span
              v-if="todayCount"
              class="rounded-md bg-brand-soft px-2 py-0.5 font-semibold text-brand"
            >
              {{ todayCount }} due today
            </span>
            <span v-if="!overdueCount && !todayCount" class="text-muted">
              No urgent tasks in range
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Desktop: existing multi-row layout -->
  <div v-else class="mb-4 space-y-3">
    <div class="page-header !mb-0">
      <div class="min-w-0">
        <h1 class="page-title">Calendar</h1>
        <p class="page-subtitle">
          Plan by due date — filter, scan the week, create on any day.
        </p>
      </div>
      <div class="flex max-w-full flex-wrap items-center gap-2">
        <div class="inline-flex rounded-lg border border-line bg-surface p-0.5">
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium transition"
            :class="
              viewMode === 'month'
                ? 'bg-brand-soft text-brand'
                : 'text-muted hover:text-charcoal'
            "
            @click="emit('update:viewMode', 'month')"
          >
            Month
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium transition"
            :class="
              viewMode === 'week'
                ? 'bg-brand-soft text-brand'
                : 'text-muted hover:text-charcoal'
            "
            @click="emit('update:viewMode', 'week')"
          >
            Week
          </button>
        </div>

        <button type="button" class="btn-secondary py-2 text-sm" @click="emit('today')">
          Today
        </button>
        <button
          type="button"
          class="rounded-lg border border-line bg-surface p-2 hover:bg-canvas"
          :aria-label="viewMode === 'week' ? 'Previous week' : 'Previous month'"
          @click="emit('prev')"
        >
          <ChevronLeft class="h-4 w-4" />
        </button>
        <p
          class="min-w-[8rem] flex-1 text-center font-display text-base font-semibold text-charcoal sm:min-w-[11rem] sm:flex-none sm:text-lg"
        >
          {{ rangeLabel }}
        </p>
        <button
          type="button"
          class="rounded-lg border border-line bg-surface p-2 hover:bg-canvas"
          :aria-label="viewMode === 'week' ? 'Next week' : 'Next month'"
          @click="emit('next')"
        >
          <ChevronRight class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition"
        :class="
          onlyMine
            ? 'border-brand bg-brand-soft text-brand'
            : 'border-line bg-surface text-charcoal hover:border-brand/40'
        "
        @click="toggleMine"
      >
        <UserRound class="h-4 w-4" aria-hidden="true" />
        Only my tasks
      </button>

      <AppSelect
        :model-value="assigneeId"
        class="w-auto min-w-[11rem]"
        :options="assigneeOptions"
        @update:model-value="onAssignee"
      />

      <div class="ml-auto flex flex-wrap items-center gap-2 text-xs">
        <span
          v-if="overdueCount"
          class="inline-flex items-center gap-1 rounded-md bg-danger-soft/50 px-2 py-1 font-semibold text-danger"
        >
          {{ overdueCount }} overdue
        </span>
        <span
          v-if="todayCount"
          class="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-1 font-semibold text-brand"
        >
          {{ todayCount }} due today
        </span>
        <span v-if="!overdueCount && !todayCount" class="text-muted">
          No overdue or due-today tasks in this range
        </span>
      </div>
    </div>
  </div>
</template>
