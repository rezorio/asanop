<script setup lang="ts">
import { computed } from 'vue'
import { Ban, CalendarDays } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import type { Task } from '@/types'
import PriorityBadge from '@/components/ui/PriorityBadge.vue'
import { formatDueLabel, getDueUrgency, initials } from '@/lib/taskDue'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  open: []
}>()

const auth = useAuthStore()

const urgency = computed(() => getDueUrgency(props.task.dueDate))
const dueLabel = computed(() => formatDueLabel(props.task.dueDate))
const isDone = computed(() => props.task.status === 'DONE')
const isMine = computed(
  () => Boolean(auth.user?.id && props.task.assigneeId === auth.user.id),
)

const dueClass = computed(() => {
  if (urgency.value === 'overdue') {
    return 'text-danger font-semibold'
  }
  if (urgency.value === 'today') {
    return 'text-charcoal font-semibold'
  }
  return 'text-muted'
})

const hasMeta = computed(
  () =>
    Boolean(props.task.section?.name) ||
    props.task.priority !== 'NONE' ||
    Boolean(props.task.dueDate) ||
    Boolean(props.task.isBlocked),
)
</script>

<template>
  <article
    class="board-card group cursor-pointer"
    :class="[
      isDone ? 'board-card-done' : '',
      isMine ? 'board-card-mine' : '',
    ]"
    role="button"
    tabindex="0"
    :title="isMine ? 'Assigned to you' : undefined"
    @click="emit('open')"
    @keydown.enter.prevent="emit('open')"
    @keydown.space.prevent="emit('open')"
  >
    <div class="mb-1.5 flex items-start justify-between gap-2">
      <p
        class="min-w-0 flex-1 font-display text-[13px] font-semibold leading-snug"
        :class="[
          'text-charcoal',
          isDone ? 'line-through decoration-charcoal/50' : '',
        ]"
      >
        {{ task.title }}
      </p>
      <span
        v-if="task.assignee"
        class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold"
        :class="isMine ? 'bg-brand text-white' : 'bg-brand-soft text-brand'"
        :title="task.assignee.name"
      >
        {{ initials(task.assignee.name) }}
      </span>
      <span
        v-else
        class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-brand/40 text-[8px] font-semibold text-brand/70"
        title="Unassigned"
      >
        ?
      </span>
    </div>

    <div v-if="hasMeta" class="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <span
        v-if="task.section?.name"
        class="text-[10px] font-medium text-muted"
      >
        {{ task.section.name }}
      </span>
      <PriorityBadge :priority="task.priority" />
      <span
        v-if="task.dueDate"
        class="inline-flex items-center gap-0.5 text-[10px] font-medium"
        :class="dueClass"
      >
        <CalendarDays class="h-3 w-3" aria-hidden="true" />
        {{ dueLabel }}
      </span>
      <span
        v-if="task.isBlocked"
        class="inline-flex items-center gap-0.5 text-[10px] font-medium text-danger"
      >
        <Ban class="h-3 w-3" aria-hidden="true" />
        Blocked
      </span>
    </div>
  </article>
</template>
