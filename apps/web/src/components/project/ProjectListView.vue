<script setup lang="ts">
import { CheckCircle2 } from 'lucide-vue-next'
import type { Task, TaskStatus } from '@/types'
import type { ListGroup, ListGroupBy } from '@/lib/projectListQuery'
import ProjectListRow from '@/components/project/ProjectListRow.vue'
import { openTaskCount, doneTaskCount } from '@/lib/taskDue'

defineProps<{
  groups: ListGroup[]
  groupBy: ListGroupBy
  filtering: boolean
  total: number
  visibleCount: number
  canCreate?: boolean
}>()

const emit = defineEmits<{
  open: [taskId: string]
  move: [task: Task, status: TaskStatus]
  create: []
  reset: []
}>()

function sectionMeta(tasks: Task[]) {
  return {
    open: openTaskCount(tasks),
    done: doneTaskCount(tasks),
  }
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="!total" class="panel flex flex-col items-center px-6 py-14 text-center">
      <CheckCircle2 class="mb-3 h-10 w-10 text-done" aria-hidden="true" />
      <p class="font-medium text-charcoal">No tasks yet</p>
      <p class="mt-1 text-sm text-muted">Create a task to start filling this project.</p>
      <button
        v-if="canCreate"
        type="button"
        class="btn-primary mt-4"
        @click="emit('create')"
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
        Try clearing “Only my tasks” or other filters to widen the queue.
      </p>
      <button type="button" class="btn-secondary mt-4" @click="emit('reset')">Clear filters</button>
    </div>

    <section
      v-for="(group, groupIndex) in groups"
      :key="group.id"
      class="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm"
    >
      <header class="border-b border-line bg-canvas/70 px-4 py-3 sm:px-5">
        <div class="flex flex-wrap items-end justify-between gap-2">
          <div class="min-w-0">
            <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              {{ groupBy === 'none' ? 'Queue' : `Group ${String(groupIndex + 1).padStart(2, '0')}` }}
            </p>
            <h3 class="font-display text-base font-semibold text-charcoal">
              {{ group.label }}
            </h3>
          </div>
          <p class="text-xs text-muted">
            {{ sectionMeta(group.tasks).open }} open · {{ sectionMeta(group.tasks).done }} done
            <span v-if="filtering"> · filtered</span>
          </p>
        </div>
      </header>

      <div>
        <ProjectListRow
          v-for="(task, taskIndex) in group.tasks"
          :key="task.id"
          :task="task"
          :index="taskIndex + 1"
          @open="emit('open', task.id)"
          @move="emit('move', task, $event)"
        />
      </div>
    </section>
  </div>
</template>
