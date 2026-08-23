<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Check, Copy, Plus } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import api, { cachedGet } from '@/lib/api'
import type { IntakeForm, Project } from '@/types'
import AppSelect from '@/components/AppSelect.vue'
import { hasPermission } from '@/lib/permissions'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'

const auth = useAuthStore()
const forms = ref<IntakeForm[]>([])
const projects = ref<Project[]>([])
const loading = ref(false)
const creating = ref(false)
const error = ref('')
const copiedId = ref<string | null>(null)

const name = ref('')
const projectId = ref('')

const canManage = computed(
  () => hasPermission(auth.activeWorkspace?.permissions, 'intake_forms.manage'),
)

const projectOptions = computed(() =>
  projects.value.map((project) => ({ value: project.id, label: project.name })),
)

async function load() {
  if (!auth.activeWorkspace) return
  loading.value = true
  error.value = ''
  try {
    const [formsRes, projectsRes] = await Promise.all([
      cachedGet<IntakeForm[]>(`/workspaces/${auth.activeWorkspace.id}/forms`),
      cachedGet<Project[]>(`/workspaces/${auth.activeWorkspace.id}/projects`, { cacheTtlMs: 60_000 }),
    ])
    forms.value = formsRes.data
    projects.value = projectsRes.data
    if (!projectId.value && projects.value[0]) {
      projectId.value = projects.value[0].id
    }
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to load forms'
  } finally {
    loading.value = false
  }
}

async function createForm() {
  if (!auth.activeWorkspace || !name.value.trim() || !projectId.value) return
  creating.value = true
  error.value = ''
  try {
    const { data } = await api.post<IntakeForm>(
      `/workspaces/${auth.activeWorkspace.id}/forms`,
      { name: name.value.trim(), projectId: projectId.value },
    )
    forms.value.unshift(data)
    name.value = ''
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to create form'
  } finally {
    creating.value = false
  }
}

async function copyLink(form: IntakeForm) {
  await navigator.clipboard.writeText(form.shareUrl)
  copiedId.value = form.id
  setTimeout(() => {
    if (copiedId.value === form.id) copiedId.value = null
  }, 1500)
}

async function toggleActive(form: IntakeForm) {
  if (!auth.activeWorkspace || !canManage.value) return
  const { data } = await api.patch<IntakeForm>(
    `/workspaces/${auth.activeWorkspace.id}/forms/${form.id}`,
    { isActive: !form.isActive },
  )
  const idx = forms.value.findIndex((f) => f.id === form.id)
  if (idx >= 0) forms.value[idx] = { ...forms.value[idx], ...data }
}

watch(() => auth.activeWorkspaceId, () => {
  void load()
})

onMounted(load)
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="page-title">Intake forms</h1>
      <p class="page-subtitle">
        Share a public link to collect work into a project. No login required to submit.
      </p>
    </div>

    <p v-if="error" class="mb-4 text-sm text-danger">{{ error }}</p>
    <AppSkeleton v-if="loading" :rows="4" label="Loading intake forms" />

    <form
      v-if="canManage"
      class="panel mb-8 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto]"
      @submit.prevent="createForm"
    >
      <input v-model="name" class="field" placeholder="Form name" required />
      <AppSelect
        v-model="projectId"
        class="w-full sm:w-auto sm:min-w-[10rem]"
        placeholder="Project"
        :options="projectOptions"
      />
      <button type="submit" class="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto" :disabled="creating">
        <Plus class="h-4 w-4" />
        {{ creating ? 'Creating…' : 'Create' }}
      </button>
    </form>

    <div class="panel overflow-hidden">
      <div class="table-scroll">
        <table class="w-full min-w-[36rem] text-left text-sm">
        <thead class="border-b border-line bg-surface-muted/60 text-muted">
          <tr>
            <th class="px-4 py-3 font-medium">Name</th>
            <th class="px-4 py-3 font-medium">Project</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Share</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!forms.length">
            <td colspan="4" class="px-4 py-8 text-muted">No forms yet.</td>
          </tr>
          <tr v-for="form in forms" :key="form.id" class="border-b border-line">
            <td class="px-4 py-3">
              <RouterLink
                :to="{ name: 'form-builder', params: { formId: form.id } }"
                class="font-medium text-brand hover:underline"
              >
                {{ form.name }}
              </RouterLink>
            </td>
            <td class="px-4 py-3 text-charcoal">{{ form.project?.name }}</td>
            <td class="px-4 py-3">
              <button
                v-if="canManage"
                type="button"
                :class="form.isActive ? 'badge-active' : 'badge-paused'"
                @click="toggleActive(form)"
              >
                <span class="badge-dot" />
                {{ form.isActive ? 'Active' : 'Paused' }}
              </button>
              <span v-else :class="form.isActive ? 'badge-active' : 'badge-paused'">
                <span class="badge-dot" />
                {{ form.isActive ? 'Active' : 'Paused' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <button
                type="button"
                class="inline-flex items-center gap-1 text-sm text-muted hover:text-charcoal"
                @click="copyLink(form)"
              >
                <Check v-if="copiedId === form.id" class="h-4 w-4 text-brand" />
                <Copy v-else class="h-4 w-4" />
                {{ copiedId === form.id ? 'Copied' : 'Copy link' }}
              </button>
            </td>
          </tr>
        </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
