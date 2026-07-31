<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'
import type { Invite, Permission, WorkspaceMember, WorkspaceRole } from '@/types'
import { ALL_PERMISSIONS, PERMISSION_LABELS } from '@/types'
import { hasPermission } from '@/lib/permissions'
import AppSelect from '@/components/AppSelect.vue'
import { Copy, Check } from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()
const members = ref<WorkspaceMember[]>([])
const invites = ref<Invite[]>([])
const roles = ref<WorkspaceRole[]>([])
const email = ref('')
const inviteRoleId = ref('')
const loading = ref(false)
const inviting = ref(false)
const deleting = ref(false)
const confirmDelete = ref('')
const error = ref('')
const copiedId = ref<string | null>(null)

const editingRoleId = ref<string | null>(null)
const draftPermissions = ref<string[]>([])
const newRoleName = ref('')
const creatingRole = ref(false)
const savingRole = ref(false)

const canInvite = computed(() =>
  hasPermission(auth.activeWorkspace?.permissions, 'members.invite'),
)
const canManageMembers = computed(() =>
  hasPermission(auth.activeWorkspace?.permissions, 'members.manage'),
)
const canManageRoles = computed(() =>
  hasPermission(auth.activeWorkspace?.permissions, 'roles.manage'),
)
const canManageWorkspace = computed(() =>
  hasPermission(auth.activeWorkspace?.permissions, 'workspace.manage'),
)

const inviteRoleOptions = computed(() =>
  roles.value
    .filter((r) => r.key !== 'project_manager')
    .map((r) => ({ value: r.id, label: r.name })),
)

const memberRoleOptions = computed(() =>
  roles.value.map((r) => ({ value: r.id, label: r.name })),
)

async function load() {
  if (!auth.activeWorkspace) return
  loading.value = true
  error.value = ''
  try {
    const [memberRes, rolesRes] = await Promise.all([
      api.get<WorkspaceMember[]>(`/workspaces/${auth.activeWorkspace.id}/members`),
      api.get<WorkspaceRole[]>(`/workspaces/${auth.activeWorkspace.id}/roles`),
    ])
    members.value = memberRes.data
    roles.value = rolesRes.data
    if (!inviteRoleId.value) {
      const contributor = roles.value.find((r) => r.key === 'contributor')
      inviteRoleId.value = contributor?.id ?? roles.value.find((r) => r.key !== 'project_manager')?.id ?? ''
    }
    if (canInvite.value) {
      const inviteRes = await api.get<Invite[]>(
        `/workspaces/${auth.activeWorkspace.id}/invites`,
      )
      invites.value = inviteRes.data
    } else {
      invites.value = []
    }
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to load members'
  } finally {
    loading.value = false
  }
}

async function createInvite() {
  if (!auth.activeWorkspace || !email.value.trim() || !inviteRoleId.value) return
  inviting.value = true
  error.value = ''
  try {
    const { data } = await api.post<Invite>(
      `/workspaces/${auth.activeWorkspace.id}/invites`,
      { email: email.value.trim(), roleId: inviteRoleId.value },
    )
    invites.value.unshift(data)
    email.value = ''
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Invite failed'
  } finally {
    inviting.value = false
  }
}

async function changeMemberRole(member: WorkspaceMember, roleId: string) {
  if (!auth.activeWorkspace || !canManageMembers.value || roleId === member.roleId) return
  error.value = ''
  try {
    const { data } = await api.patch<WorkspaceMember>(
      `/workspaces/${auth.activeWorkspace.id}/members/${member.id}/role`,
      { roleId },
    )
    const idx = members.value.findIndex((m) => m.id === member.id)
    if (idx >= 0) members.value[idx] = data
    await auth.loadWorkspaces()
    await load()
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to update role'
  }
}

async function copyLink(invite: Invite) {
  await navigator.clipboard.writeText(invite.inviteUrl)
  copiedId.value = invite.id
  setTimeout(() => {
    if (copiedId.value === invite.id) copiedId.value = null
  }, 1500)
}

function startEditRole(role: WorkspaceRole) {
  editingRoleId.value = role.id
  draftPermissions.value = [...role.permissions]
}

function togglePermission(key: Permission) {
  if (draftPermissions.value.includes(key)) {
    draftPermissions.value = draftPermissions.value.filter((p) => p !== key)
  } else {
    draftPermissions.value = [...draftPermissions.value, key]
  }
}

async function saveRolePermissions() {
  if (!auth.activeWorkspace || !editingRoleId.value) return
  savingRole.value = true
  error.value = ''
  try {
    await api.patch(`/workspaces/${auth.activeWorkspace.id}/roles/${editingRoleId.value}`, {
      permissions: draftPermissions.value,
    })
    editingRoleId.value = null
    await load()
    await auth.loadWorkspaces()
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to update role'
  } finally {
    savingRole.value = false
  }
}

async function createCustomRole() {
  if (!auth.activeWorkspace || !newRoleName.value.trim()) return
  creatingRole.value = true
  error.value = ''
  try {
    await api.post(`/workspaces/${auth.activeWorkspace.id}/roles`, {
      name: newRoleName.value.trim(),
      permissions: [],
    })
    newRoleName.value = ''
    await load()
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to create role'
  } finally {
    creatingRole.value = false
  }
}

async function deleteRole(role: WorkspaceRole) {
  if (!auth.activeWorkspace || role.isSystem) return
  if (!confirm(`Delete role “${role.name}”? Members must be reassigned first.`)) return
  error.value = ''
  try {
    await api.delete(`/workspaces/${auth.activeWorkspace.id}/roles/${role.id}`)
    if (editingRoleId.value === role.id) editingRoleId.value = null
    await load()
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to delete role'
  }
}

async function deleteWorkspace() {
  if (!auth.activeWorkspace || !canManageWorkspace.value) return
  if (confirmDelete.value !== auth.activeWorkspace.name) {
    error.value = 'Type the exact workspace name to confirm deletion'
    return
  }
  deleting.value = true
  error.value = ''
  const deletedId = auth.activeWorkspace.id
  try {
    await api.delete(`/workspaces/${deletedId}`)
    confirmDelete.value = ''
    await auth.loadWorkspaces()
    const next = auth.workspaces.find((w) => w.id !== deletedId) ?? auth.workspaces[0]
    if (next) {
      auth.setWorkspace(next.id)
      router.push({ name: 'dashboard' })
    } else {
      auth.logout()
      router.push({ name: 'login' })
    }
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to delete workspace'
  } finally {
    deleting.value = false
  }
}

watch(() => auth.activeWorkspaceId, () => {
  confirmDelete.value = ''
  editingRoleId.value = null
  inviteRoleId.value = ''
  void load()
})

onMounted(load)
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="page-title">Members & roles</h1>
      <p class="page-subtitle">
        Assign job titles and permissions. Mock invites: copy the link and open it locally.
      </p>
    </div>

    <p v-if="error" class="mb-4 text-sm text-danger">{{ error }}</p>
    <p v-if="loading" class="text-muted">Loading…</p>

    <section class="mb-10">
      <h2 class="section-title mb-3">Team</h2>
      <div class="panel overflow-hidden">
        <div class="table-scroll">
          <table class="w-full min-w-[32rem] text-left text-sm">
            <thead class="border-b border-line bg-surface-muted/60 text-muted">
              <tr>
                <th class="px-4 py-3 font-medium">Name</th>
                <th class="px-4 py-3 font-medium">Email</th>
                <th class="px-4 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in members" :key="m.id" class="border-b border-line">
                <td class="px-4 py-3 text-charcoal">{{ m.user.name }}</td>
                <td class="px-4 py-3 text-muted">{{ m.user.email }}</td>
                <td class="px-4 py-3 text-charcoal">
                  <AppSelect
                    v-if="canManageMembers"
                    :model-value="m.roleId"
                    :options="memberRoleOptions"
                    @update:model-value="(v) => changeMemberRole(m, String(v))"
                  />
                  <span v-else>{{ m.roleName }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section v-if="canManageRoles" class="mb-10">
      <h2 class="section-title mb-3">Roles & permissions</h2>
      <p class="mb-4 text-sm text-muted">
        Project Manager has full access. Grant <span class="font-medium text-charcoal">Create tasks</span>
        (and other permissions) on Assistant Manager or a custom role.
      </p>

      <form
        class="panel mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
        @submit.prevent="createCustomRole"
      >
        <div class="min-w-0 flex-1">
          <label class="label">New custom role</label>
          <input
            v-model="newRoleName"
            class="field"
            placeholder="e.g. QA Lead"
            required
          />
        </div>
        <button type="submit" class="btn-secondary" :disabled="creatingRole">
          {{ creatingRole ? 'Creating…' : 'Create role' }}
        </button>
      </form>

      <div class="space-y-3">
        <div v-for="role in roles" :key="role.id" class="panel p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="font-medium text-charcoal">
                {{ role.name }}
                <span
                  v-if="role.isSystem"
                  class="ml-2 text-xs font-normal text-muted"
                >System</span>
              </p>
              <p class="mt-1 text-xs text-muted">
                {{ role.memberCount ?? 0 }} member{{ (role.memberCount ?? 0) === 1 ? '' : 's' }}
                · {{ role.permissions.length }} permission{{ role.permissions.length === 1 ? '' : 's' }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="btn-secondary"
                @click="editingRoleId === role.id ? (editingRoleId = null) : startEditRole(role)"
              >
                {{ editingRoleId === role.id ? 'Cancel' : 'Edit permissions' }}
              </button>
              <button
                v-if="!role.isSystem"
                type="button"
                class="rounded-lg border border-danger/30 px-3 py-1.5 text-sm text-danger hover:bg-danger-soft/30"
                @click="deleteRole(role)"
              >
                Delete
              </button>
            </div>
          </div>

          <div v-if="editingRoleId === role.id" class="mt-4 border-t border-line pt-4">
            <div class="grid gap-2 sm:grid-cols-2">
              <label
                v-for="perm in ALL_PERMISSIONS"
                :key="perm"
                class="flex cursor-pointer items-start gap-2 text-sm text-charcoal"
              >
                <input
                  type="checkbox"
                  class="mt-0.5"
                  :checked="draftPermissions.includes(perm)"
                  @change="togglePermission(perm)"
                />
                <span>{{ PERMISSION_LABELS[perm] }}</span>
              </label>
            </div>
            <button
              type="button"
              class="btn-primary mt-4"
              :disabled="savingRole"
              @click="saveRolePermissions"
            >
              {{ savingRole ? 'Saving…' : 'Save permissions' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="canInvite">
      <h2 class="section-title mb-3">Invite teammate</h2>
      <form
        class="panel mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto]"
        @submit.prevent="createInvite"
      >
        <input v-model="email" type="email" required placeholder="teammate@example.com" class="field" />
        <AppSelect v-model="inviteRoleId" :options="inviteRoleOptions" />
        <button type="submit" class="btn-primary" :disabled="inviting || !inviteRoleId">
          {{ inviting ? 'Creating…' : 'Create invite' }}
        </button>
      </form>

      <div class="space-y-3">
        <div
          v-for="invite in invites"
          :key="invite.id"
          class="panel p-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="font-medium text-charcoal">{{ invite.email }}</p>
              <div class="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>{{ invite.roleName }}</span>
                <span
                  :class="invite.status === 'PENDING' ? 'badge-active' : 'badge-paused'"
                >
                  <span class="badge-dot" />
                  {{ invite.status }}
                </span>
                <span>expires {{ new Date(invite.expiresAt).toLocaleDateString() }}</span>
              </div>
            </div>
            <button
              v-if="invite.status === 'PENDING'"
              type="button"
              class="btn-secondary"
              @click="copyLink(invite)"
            >
              <Check v-if="copiedId === invite.id" class="h-4 w-4 text-brand" />
              <Copy v-else class="h-4 w-4" />
              {{ copiedId === invite.id ? 'Copied' : 'Copy invite link' }}
            </button>
          </div>
          <p
            v-if="invite.status === 'PENDING'"
            class="mt-3 break-all rounded-md bg-canvas px-3 py-2 font-mono text-xs text-muted"
          >
            {{ invite.inviteUrl }}
          </p>
        </div>
      </div>
    </section>

    <p v-else class="text-sm text-muted">
      You need invite permission to add teammates to this workspace.
    </p>

    <section
      v-if="canManageWorkspace && auth.activeWorkspace"
      class="mt-12 rounded-xl border border-danger/30 bg-danger-soft/20 p-4 sm:p-5"
    >
      <h2 class="section-title text-danger">Danger zone</h2>
      <p class="mt-2 text-sm text-muted">
        Delete this workspace and all of its projects, tasks, and invites. This cannot be undone.
        You must be Project Manager of at least one other workspace first.
      </p>
      <label class="label mt-4">
        Type <span class="font-semibold text-charcoal">{{ auth.activeWorkspace.name }}</span> to confirm
      </label>
      <div class="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          v-model="confirmDelete"
          class="field flex-1"
          :placeholder="auth.activeWorkspace.name"
          autocomplete="off"
        />
        <button
          type="button"
          class="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger/90 disabled:opacity-50"
          :disabled="deleting || confirmDelete !== auth.activeWorkspace.name"
          @click="deleteWorkspace"
        >
          {{ deleting ? 'Deleting…' : 'Delete workspace' }}
        </button>
      </div>
    </section>
  </div>
</template>
