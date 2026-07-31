<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, FolderKanban, Sparkles } from 'lucide-vue-next'
import type { MyTasksBuckets, Task } from '@/types'
import type { TaskUrgency } from '@/components/my-tasks/MyTaskRow.vue'

const props = defineProps<{
  buckets: MyTasksBuckets
  selectedProjectId: string | null
}>()

const emit = defineEmits<{
  openTask: [taskId: string]
  'update:selectedProjectId': [projectId: string | null]
}>()

const nextUp = computed<{ task: Task; urgency: TaskUrgency; label: string } | null>(() => {
  if (props.buckets.overdue[0]) {
    return { task: props.buckets.overdue[0], urgency: 'overdue', label: 'Overdue — start here' }
  }
  if (props.buckets.today[0]) {
    return { task: props.buckets.today[0], urgency: 'today', label: 'Due today' }
  }
  if (props.buckets.upcoming[0]) {
    return { task: props.buckets.upcoming[0], urgency: 'upcoming', label: 'Coming up next' }
  }
  if (props.buckets.later[0]) {
    return { task: props.buckets.later[0], urgency: 'later', label: 'On your plate' }
  }
  return null
})

const projectFilters = computed(() => {
  const counts = new Map<string, { id: string; name: string; count: number }>()

  for (const task of [
    ...props.buckets.overdue,
    ...props.buckets.today,
    ...props.buckets.upcoming,
    ...props.buckets.later,
  ]) {
    if (task.status === 'DONE') continue
    const existing = counts.get(task.projectId)
    if (existing) {
      existing.count += 1
    } else {
      counts.set(task.projectId, {
        id: task.projectId,
        name: task.project?.name ?? 'Project',
        count: 1,
      })
    }
  }

  return [...counts.values()].sort((a, b) => b.count - a.count)
})

const urgencyClass = computed(() => {
  switch (nextUp.value?.urgency) {
    case 'overdue':
      return 'border-danger bg-danger/5'
    case 'today':
      return 'border-brand bg-brand-soft/40'
    case 'upcoming':
      return 'border-upcoming bg-upcoming-soft/30'
    default:
      return 'border-line bg-canvas/60'
  }
})

function selectProject(projectId: string | null) {
  emit('update:selectedProjectId', projectId)
}
</script>

<template>
  <section class="space-y-3">
    <div
      v-if="nextUp"
      class="rounded-xl border-l-4 px-4 py-3"
      :class="urgencyClass"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <Sparkles class="h-3.5 w-3.5" aria-hidden="true" />
            Next up · {{ nextUp.label }}
          </p>
          <p class="mt-1 font-display text-base font-semibold text-charcoal">{{ nextUp.task.title }}</p>
          <p class="mt-0.5 text-sm text-muted">{{ nextUp.task.project?.name ?? 'Project' }}</p>
        </div>
        <button
          type="button"
          class="btn-primary inline-flex shrink-0 items-center gap-1.5"
          @click="emit('openTask', nextUp.task.id)"
        >
          Open task
          <ArrowRight class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div v-if="projectFilters.length > 1" class="flex flex-wrap items-center gap-2">
      <span class="inline-flex items-center gap-1 text-xs font-medium text-muted">
        <FolderKanban class="h-3.5 w-3.5" aria-hidden="true" />
        Project
      </span>
      <button
        type="button"
        class="rounded-full border px-2.5 py-1 text-xs font-medium transition"
        :class="
          selectedProjectId === null
            ? 'border-brand bg-brand-soft text-brand'
            : 'border-line bg-surface text-muted hover:border-brand/40 hover:text-charcoal'
        "
        @click="selectProject(null)"
      >
        All
      </button>
      <button
        v-for="project in projectFilters"
        :key="project.id"
        type="button"
        class="rounded-full border px-2.5 py-1 text-xs font-medium transition"
        :class="
          selectedProjectId === project.id
            ? 'border-brand bg-brand-soft text-brand'
            : 'border-line bg-surface text-muted hover:border-brand/40 hover:text-charcoal'
        "
        @click="selectProject(project.id)"
      >
        {{ project.name }}
        <span class="opacity-70">· {{ project.count }}</span>
      </button>
    </div>
  </section>
</template>
