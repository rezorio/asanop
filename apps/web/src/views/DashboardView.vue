<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Plus, Users } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { cachedGet } from '@/lib/api'
import type { Project, WorkspaceDashboard } from '@/types'
import CreateProjectModal from '@/components/CreateProjectModal.vue'
import DashboardHealthRibbon from '@/components/dashboard/DashboardHealthRibbon.vue'
import DashboardAttentionFeed from '@/components/dashboard/DashboardAttentionFeed.vue'
import WorkloadByAssignee from '@/components/dashboard/WorkloadByAssignee.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { hasPermission } from '@/lib/permissions'

const auth = useAuthStore()
const data = ref<WorkspaceDashboard | null>(null)
const loading = ref(false)
const error = ref('')
const showCreateProject = ref(false)

const workspaceLabel = computed(() => auth.activeWorkspace?.name ?? 'workspace')
const firstName = computed(() => auth.user?.name?.trim().split(/\s+/)[0] ?? 'there')
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})
const canCreateProject = computed(() =>
  hasPermission(auth.activeWorkspace?.permissions, 'projects.create'),
)

async function load() {
  if (!auth.activeWorkspace) return
  loading.value = true
  error.value = ''
  try {
    const { data: dashRes } = await cachedGet<WorkspaceDashboard>(
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
  <div class="dashboard-shell">
    <PageHeader
      eyebrow="Workspace overview"
      :title="`${greeting}, ${firstName}`"
      :description="`Here’s what needs attention across ${workspaceLabel}.`"
    >
      <template #actions>
        <span
          v-if="data"
          class="hidden items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-xs text-muted sm:inline-flex"
        >
          <Users class="h-3.5 w-3.5 text-brand" aria-hidden="true" />
          {{ data.summary.memberCount }} members
        </span>
        <button
          v-if="canCreateProject"
          type="button"
          class="btn-primary"
          :disabled="!auth.activeWorkspace"
          @click="showCreateProject = true"
        >
          <Plus class="h-4 w-4" aria-hidden="true" />
          New project
        </button>
      </template>
    </PageHeader>

    <AppAlert v-if="error" tone="danger">{{ error }}</AppAlert>
    <AppSkeleton v-if="loading && !data" variant="dashboard" label="Loading dashboard" />

    <template v-if="data">
      <DashboardHealthRibbon :summary="data.summary" />

      <div class="dashboard-main grid items-stretch gap-4 lg:grid-cols-2">
        <DashboardAttentionFeed :items="data.needsAttention.slice(0, 8)" />

        <section class="panel flex min-h-0 flex-col overflow-hidden">
          <header class="dashboard-panel-header">
            <div>
              <p class="dashboard-kicker">Capacity</p>
              <h2 class="section-title">Team workload</h2>
            </div>
            <span class="dashboard-header-meta">{{ data.byAssignee.length }} active</span>
          </header>
          <div class="min-h-0 flex-1">
            <WorkloadByAssignee :rows="data.byAssignee" />
          </div>
        </section>
      </div>
    </template>

    <CreateProjectModal
      v-if="auth.activeWorkspace"
      v-model:open="showCreateProject"
      :workspace-id="auth.activeWorkspace.id"
      @created="onProjectCreated"
    />
  </div>
</template>

<style scoped>
.dashboard-shell {
  display: grid;
  gap: 1.25rem;
  max-width: 92rem;
  margin-inline: auto;
}

.dashboard-main > :deep(.panel),
.dashboard-main > .panel {
  min-height: 22rem;
}
</style>
