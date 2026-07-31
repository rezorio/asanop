<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, FolderKanban, CheckSquare, User } from 'lucide-vue-next'
import api from '@/lib/api'
import type { SearchResults } from '@/types'
import { useAuthStore } from '@/stores/auth'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const auth = useAuthStore()
const router = useRouter()
const query = ref('')
const loading = ref(false)
const results = ref<SearchResults | null>(null)
const error = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | undefined

const hasQuery = computed(() => query.value.trim().length >= 2)
const isEmpty = computed(() => {
  if (!results.value) return false
  return (
    !results.value.tasks.length &&
    !results.value.projects.length &&
    !results.value.people.length
  )
})

function close() {
  emit('update:open', false)
}

async function runSearch(q: string) {
  if (!auth.activeWorkspace || q.trim().length < 2) {
    results.value = null
    return
  }
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get<SearchResults>(
      `/workspaces/${auth.activeWorkspace.id}/search`,
      { params: { q: q.trim() } },
    )
    results.value = data
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Search failed'
    results.value = null
  } finally {
    loading.value = false
  }
}

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    void runSearch(query.value)
  }, 220)
}

function openTask(projectId: string, taskId: string) {
  close()
  void router.push({
    name: 'project',
    params: { projectId },
    query: { taskId },
  })
}

function openProject(projectId: string) {
  close()
  void router.push({ name: 'project', params: { projectId } })
}

function openPeople() {
  close()
  void router.push({ name: 'members' })
}

function openFirstResult() {
  if (!results.value) return
  const task = results.value.tasks[0]
  if (task) {
    openTask(task.projectId, task.id)
    return
  }
  const project = results.value.projects[0]
  if (project) {
    openProject(project.id)
    return
  }
  if (results.value.people[0]) {
    openPeople()
  }
}

function onKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    emit('update:open', !props.open)
  }
  if (event.key === 'Escape' && props.open) {
    close()
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await nextTick()
      inputEl.value?.focus()
      inputEl.value?.select()
    } else {
      query.value = ''
      results.value = null
      error.value = ''
    }
  },
)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[60] flex items-start justify-center bg-charcoal/40 px-3 pt-[8vh] sm:px-4 sm:pt-[12vh]"
    @click.self="close"
  >
    <div class="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
      <div class="flex items-center gap-2 border-b border-line px-4 py-3">
        <Search class="h-4 w-4 shrink-0 text-muted" />
        <input
          ref="inputEl"
          v-model="query"
          class="search-modal-input w-full bg-transparent text-sm text-charcoal placeholder:text-muted"
          placeholder="Search tasks, projects, people…"
          @input="onInput"
          @keydown.enter.prevent="openFirstResult"
        />
        <kbd class="hidden rounded border border-line px-1.5 py-0.5 text-[10px] text-muted sm:inline">
          Esc
        </kbd>
      </div>

      <div class="max-h-[min(70vh,28rem)] overflow-y-auto p-2">
        <p v-if="!hasQuery" class="px-3 py-6 text-center text-sm text-muted">
          Type at least 2 characters to search tasks, projects, and people.
        </p>
        <p v-else-if="loading" class="px-3 py-6 text-center text-sm text-muted">Searching…</p>
        <p v-else-if="error" class="px-3 py-6 text-center text-sm text-danger">{{ error }}</p>
        <p v-else-if="isEmpty" class="px-3 py-6 text-center text-sm text-muted">
          No matches for “{{ results?.query }}”.
        </p>

        <template v-else-if="results">
          <section v-if="results.tasks.length" class="mb-2">
            <p class="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Tasks
            </p>
            <button
              v-for="task in results.tasks"
              :key="task.id"
              type="button"
              class="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left hover:bg-canvas"
              @click="openTask(task.projectId, task.id)"
            >
              <CheckSquare class="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-charcoal">{{ task.title }}</p>
                <div class="mt-1 flex flex-wrap items-center gap-1.5">
                  <span class="truncate text-xs text-muted">{{ task.project.name }}</span>
                  <StatusBadge :status="task.status" />
                </div>
              </div>
            </button>
          </section>

          <section v-if="results.projects.length" class="mb-2">
            <p class="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Projects
            </p>
            <button
              v-for="project in results.projects"
              :key="project.id"
              type="button"
              class="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left hover:bg-canvas"
              @click="openProject(project.id)"
            >
              <FolderKanban class="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-charcoal">{{ project.name }}</p>
                <p class="truncate text-xs text-muted">
                  {{ project._count?.tasks ?? 0 }} tasks
                </p>
              </div>
            </button>
          </section>

          <section v-if="results.people.length">
            <p class="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
              People
            </p>
            <button
              v-for="person in results.people"
              :key="person.id"
              type="button"
              class="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left hover:bg-canvas"
              @click="openPeople"
            >
              <User class="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-charcoal">{{ person.name }}</p>
                <p class="truncate text-xs text-muted">
                  {{ person.email }} · {{ person.roleName }}
                </p>
              </div>
            </button>
          </section>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-modal-input:focus,
.search-modal-input:focus-visible {
  outline: none;
  box-shadow: none;
}
</style>
