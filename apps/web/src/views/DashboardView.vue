<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'
import type { Project, WorkspaceDashboard } from '@/types'
import CreateProjectModal from '@/components/CreateProjectModal.vue'
import DashboardHealthRibbon from '@/components/dashboard/DashboardHealthRibbon.vue'
import DashboardAttentionFeed from '@/components/dashboard/DashboardAttentionFeed.vue'
import DashboardProjectRadar from '@/components/dashboard/DashboardProjectRadar.vue'
import DashboardActivityPulse from '@/components/dashboard/DashboardActivityPulse.vue'
import { hasPermission } from '@/lib/permissions'

const auth = useAuthStore()
const data = ref<WorkspaceDashboard | null>(null)
const loading = ref(false)
const error = ref('')
const showCreateProject = ref(false)

const workspaceLabel = computed(() => auth.activeWorkspace?.name ?? 'workspace')
const canCreateProject = computed(() =>
  hasPermission(auth.activeWorkspace?.permissions, 'projects.create'),
)

async function load() {
  if (!auth.activeWorkspace) return
  loading.value = true
  error.value = ''
  try {
    const { data: dashRes } = await api.get<WorkspaceDashboard>(
      `/workspaces/${auth.activeWorkspace.id}/dashboard`,
    )
    data.value = dashRes
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to load dashboard'
  } finally {
    loading.value = false
  }
}

function onProjectCreated(_project: Project) {
  void load()
}

watch(() => auth.activeWorkspaceId, () => {
  void load()
})

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="page-header !mb-2">
      <div class="min-w-0">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle !mt-0.5">
          Portfolio command center for {{ workspaceLabel }}
        </p>
      </div>
      <button
        v-if="canCreateProject"
        type="button"
        class="btn-primary inline-flex items-center gap-1.5"
        :disabled="!auth.activeWorkspace"
        @click="showCreateProject = true"
      >
        <Plus class="h-4 w-4" aria-hidden="true" />
        New project
      </button>
    </div>

    <p v-if="error" class="text-sm text-danger" role="alert">{{ error }}</p>
    <p v-if="loading && !data" class="text-muted">Loading dashboard…</p>

    <template v-if="data">
      <DashboardHealthRibbon :summary="data.summary" />

      <div class="grid gap-4 lg:grid-cols-2">
        <DashboardAttentionFeed :items="data.needsAttention" />
        <DashboardActivityPulse :events="data.recentActivity" />
      </div>

      <DashboardProjectRadar :projects="data.byProject" />
    </template>

    <CreateProjectModal
      v-if="auth.activeWorkspace"
      v-model:open="showCreateProject"
      :workspace-id="auth.activeWorkspace.id"
      @created="onProjectCreated"
    />
  </div>
</template>
