<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Archive, Lock } from 'lucide-vue-next'
import AppModal from '@/components/AppModal.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import api from '@/lib/api'
import { notifyProjectsChanged } from '@/lib/projectEvents'
import type { Project } from '@/types'

const props = defineProps<{
  workspaceId: string
  project: Project
  canManage: boolean
}>()

const emit = defineEmits<{
  updated: [project: Project]
  archived: []
}>()

const saving = ref(false)
const archiving = ref(false)
const error = ref('')
const saveMessage = ref('')
const showArchiveConfirm = ref(false)
const archiveConfirmName = ref('')

const form = reactive({
  name: '',
  description: '',
  brief: '',
})

watch(
  () => props.project,
  (project) => {
    form.name = project.name
    form.description = project.description ?? ''
    form.brief = project.brief ?? ''
    error.value = ''
    saveMessage.value = ''
  },
  { immediate: true },
)

const archiveNameMatches = computed(
  () =>
    archiveConfirmName.value.trim().toLowerCase() ===
    props.project.name.trim().toLowerCase(),
)

async function saveGeneral() {
  if (!props.canManage || !form.name.trim()) return
  saving.value = true
  error.value = ''
  saveMessage.value = ''
  try {
    const { data } = await api.patch<Project>(
      `/workspaces/${props.workspaceId}/projects/${props.project.id}`,
      {
        name: form.name.trim(),
        description: form.description.trim() || null,
        brief: form.brief.trim() || null,
      },
    )
    const next = { ...props.project, ...data, stats: props.project.stats }
    emit('updated', next)
    notifyProjectsChanged()
    saveMessage.value = 'Project settings saved.'
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string | string[] } } })?.response?.data
        ?.message?.toString() ?? 'Could not save project settings'
  } finally {
    saving.value = false
  }
}

function openArchiveConfirm() {
  archiveConfirmName.value = ''
  showArchiveConfirm.value = true
}

async function confirmArchive() {
  if (!props.canManage || !archiveNameMatches.value) return
  archiving.value = true
  error.value = ''
  try {
    await api.delete(
      `/workspaces/${props.workspaceId}/projects/${props.project.id}`,
    )
    showArchiveConfirm.value = false
    notifyProjectsChanged()
    emit('archived')
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string | string[] } } })?.response?.data
        ?.message?.toString() ?? 'Could not archive project'
  } finally {
    archiving.value = false
  }
}
</script>

<template>
  <div class="mx-auto grid max-w-3xl gap-4">
    <AppAlert v-if="!canManage" tone="info">
      <span class="inline-flex items-center gap-2">
        <Lock class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        You can view these settings, but only people with project manage access can edit or archive.
      </span>
    </AppAlert>

    <section class="panel space-y-4 p-5">
      <div>
        <p class="dashboard-kicker">General</p>
        <h2 class="section-title">Project details</h2>
        <p class="mt-1 text-sm text-muted">
          Name and description show up in navigation and project lists. The brief is the longer
          launch context for the team.
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="saveGeneral">
        <div>
          <label class="label" for="project-settings-name">Name</label>
          <input
            id="project-settings-name"
            v-model="form.name"
            class="field"
            required
            maxlength="120"
            :disabled="!canManage || saving"
            placeholder="Project name"
          />
        </div>
        <div>
          <label class="label" for="project-settings-description">Description</label>
          <textarea
            id="project-settings-description"
            v-model="form.description"
            class="field min-h-[88px]"
            maxlength="2000"
            :disabled="!canManage || saving"
            placeholder="Optional short description"
          />
        </div>
        <div>
          <label class="label" for="project-settings-brief">Brief</label>
          <textarea
            id="project-settings-brief"
            v-model="form.brief"
            class="field min-h-[160px]"
            maxlength="10000"
            :disabled="!canManage || saving"
            placeholder="Goals, success metrics, and launch notes…"
          />
        </div>

        <AppAlert v-if="error" tone="danger">{{ error }}</AppAlert>
        <AppAlert v-else-if="saveMessage" tone="success">{{ saveMessage }}</AppAlert>

        <div v-if="canManage" class="flex justify-end">
          <button
            type="submit"
            class="btn-primary"
            :disabled="saving || !form.name.trim()"
          >
            {{ saving ? 'Saving…' : 'Save changes' }}
          </button>
        </div>
      </form>
    </section>

    <section class="panel space-y-3 border-danger/25 p-5">
      <div>
        <p class="dashboard-kicker text-danger">Danger zone</p>
        <h2 class="section-title">Archive project</h2>
        <p class="mt-1 text-sm text-muted">
          Archiving removes this project from active lists, sidebar, and dashboards. Tasks stay in
          the database but the project is no longer available for day-to-day work.
        </p>
      </div>

      <button
        v-if="canManage"
        type="button"
        class="btn-secondary inline-flex items-center gap-2 text-danger hover:border-danger/40 hover:bg-danger-soft/30"
        @click="openArchiveConfirm"
      >
        <Archive class="h-4 w-4" aria-hidden="true" />
        Archive project
      </button>
      <p v-else class="text-sm text-muted">You do not have permission to archive this project.</p>
    </section>

    <AppModal
      :open="showArchiveConfirm"
      title="Archive this project?"
      subtitle="This cannot be undone from the app yet. Type the project name to confirm."
      @update:open="showArchiveConfirm = $event"
    >
      <div class="space-y-4">
        <p class="text-sm text-muted">
          Confirm by typing
          <span class="font-semibold text-charcoal">{{ project.name }}</span>
        </p>
        <input
          v-model="archiveConfirmName"
          class="field"
          :placeholder="project.name"
          autofocus
          :disabled="archiving"
        />
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="btn-secondary"
            :disabled="archiving"
            @click="showArchiveConfirm = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn-primary bg-danger hover:bg-danger/90"
            :disabled="archiving || !archiveNameMatches"
            @click="confirmArchive"
          >
            {{ archiving ? 'Archiving…' : 'Archive project' }}
          </button>
        </div>
      </div>
    </AppModal>
  </div>
</template>
