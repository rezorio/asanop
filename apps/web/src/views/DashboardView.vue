<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { CheckCircle2, CircleAlert, Clock3, Layers3, Plus, Users } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'
import type { Project, WorkspaceDashboard } from '@/types'
import CreateProjectModal from '@/components/CreateProjectModal.vue'
import DashboardHealthRibbon from '@/components/dashboard/DashboardHealthRibbon.vue'
import DashboardAttentionFeed from '@/components/dashboard/DashboardAttentionFeed.vue'
import DashboardProjectRadar from '@/components/dashboard/DashboardProjectRadar.vue'
import DashboardActivityPulse from '@/components/dashboard/DashboardActivityPulse.vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import WorkloadByAssignee from '@/components/dashboard/WorkloadByAssignee.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
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
  <div class="dashboard-shell">
    <PageHeader
      eyebrow="Workspace overview"
      :title="`${greeting}, ${firstName}`"
      :description="`Here’s what needs attention across ${workspaceLabel}.`"
    >
      <template #actions>
        <span v-if="data" class="hidden items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-xs text-muted sm:inline-flex">
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
    <div v-if="loading && !data" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard">
      <div v-for="index in 4" :key="index" class="h-28 animate-pulse rounded-xl border border-line bg-surface/70" />
    </div>

    <template v-if="data">
      <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Workspace metrics">
        <MetricCard label="Open work" :value="data.summary.open" :detail="`${data.summary.projectCount} active projects`" accent="blue">
          <template #icon><Layers3 /></template>
        </MetricCard>
        <MetricCard label="Overdue" :value="data.summary.overdue" :detail="data.summary.overdueTrend.newlyThisWeek ? `${data.summary.overdueTrend.newlyThisWeek} new this week` : 'No new overdue work'" accent="red" value-class="text-danger">
          <template #icon><CircleAlert /></template>
        </MetricCard>
        <MetricCard label="Due soon" :value="data.summary.dueSoon" detail="In the next 7 days" accent="amber">
          <template #icon><Clock3 /></template>
        </MetricCard>
        <MetricCard label="Completed" :value="data.summary.completedThisWeek" detail="Finished this week" accent="emerald">
          <template #icon><CheckCircle2 /></template>
        </MetricCard>
      </section>

      <DashboardHealthRibbon :summary="data.summary" />

      <div class="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]">
        <div class="space-y-4">
          <DashboardAttentionFeed :items="data.needsAttention.slice(0, 5)" />
          <DashboardProjectRadar :projects="data.byProject" />
        </div>

        <div class="space-y-4">
          <section class="panel overflow-hidden">
            <header class="dashboard-panel-header">
              <div>
                <p class="dashboard-kicker">Capacity</p>
                <h2 class="section-title">Team workload</h2>
              </div>
              <span class="dashboard-header-meta">{{ data.byAssignee.length }} active</span>
            </header>
            <WorkloadByAssignee :rows="data.byAssignee" />
          </section>
          <DashboardActivityPulse :events="data.recentActivity.slice(0, 6)" />
        </div>
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
.dashboard-shell { display: grid; gap: 1rem; max-width: 92rem; margin-inline: auto; }
</style>
