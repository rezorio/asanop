<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ChevronDown, FolderKanban } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'
import { PROJECTS_CHANGED_EVENT } from '@/lib/projectEvents'
import type { Project } from '@/types'

const auth = useAuthStore()
const route = useRoute()

const projects = ref<Project[]>([])
const loading = ref(false)
const expanded = ref(true)

const activeProjectId = computed(() =>
  route.name === 'project' ? String(route.params.projectId) : null,
)

async function loadProjects() {
  if (!auth.activeWorkspace) {
    projects.value = []
    return
  }
  loading.value = true
  try {
    const { data } = await api.get<Project[]>(
      `/workspaces/${auth.activeWorkspace.id}/projects`,
    )
    projects.value = data
  } catch {
    projects.value = []
  } finally {
    loading.value = false
  }
}

function isProjectActive(projectId: string) {
  return activeProjectId.value === projectId
}

function onProjectsChanged() {
  void loadProjects()
}

watch(
  () => auth.activeWorkspaceId,
  () => {
    void loadProjects()
  },
  { immediate: true },
)

watch(
  () => route.params.projectId,
  () => {
    void loadProjects()
  },
)

onMounted(() => {
  window.addEventListener(PROJECTS_CHANGED_EVENT, onProjectsChanged)
})

onUnmounted(() => {
  window.removeEventListener(PROJECTS_CHANGED_EVENT, onProjectsChanged)
})
</script>

<template>
  <section class="mb-4">
    <button
      type="button"
      class="mb-1 flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1 text-left transition hover:bg-sidebar-hover"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <span class="overline flex items-center gap-1.5 text-sidebar-text">
        <FolderKanban class="h-3.5 w-3.5" aria-hidden="true" />
        Projects
      </span>
      <span class="flex items-center gap-1.5">
        <span v-if="projects.length" class="text-[10px] tabular-nums text-sidebar-text">
          {{ projects.length }}
        </span>
        <ChevronDown
          class="h-3.5 w-3.5 text-sidebar-text transition-transform duration-150"
          :class="expanded ? 'rotate-180' : ''"
          aria-hidden="true"
        />
      </span>
    </button>

    <div v-if="expanded" class="sidebar-project-list">
      <p v-if="loading" class="px-3 py-2 text-xs text-sidebar-text">Loading…</p>
      <p v-else-if="!projects.length" class="px-3 py-2 text-xs text-sidebar-text">
        No projects yet
      </p>
      <ul v-else class="space-y-0.5" role="list">
        <li v-for="project in projects" :key="project.id">
          <RouterLink
            :to="{ name: 'project', params: { projectId: project.id } }"
            class="sidebar-project-link"
            :class="isProjectActive(project.id) ? 'sidebar-project-link-active' : ''"
          >
            <span class="truncate">{{ project.name }}</span>
            <span
              v-if="project._count?.tasks"
              class="shrink-0 text-[10px] tabular-nums text-sidebar-text"
            >
              {{ project._count.tasks }}
            </span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </section>
</template>
