<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const token = route.params.token as string
const preview = ref<{
  email: string
  roleName: string
  workspace: { id: string; name: string }
  expiresAt: string
} | null>(null)
const error = ref('')
const accepting = ref(false)

onMounted(async () => {
  try {
    const { data } = await api.get(`/invites/${token}`)
    preview.value = data
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Invite not found'
  }
})

async function accept() {
  if (!auth.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  accepting.value = true
  error.value = ''
  try {
    const { data } = await api.post('/invites/accept', { token })
    await auth.loadWorkspaces()
    auth.setWorkspace(data.workspaceId)
    router.push({ name: 'dashboard' })
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Could not accept invite'
  } finally {
    accepting.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
    <div class="panel p-8">
      <p class="overline text-brand">Workspace invite</p>
      <h1 class="page-title mt-2">Join a team on Asanop</h1>

      <p v-if="error" class="mt-6 text-sm text-danger">{{ error }}</p>

      <div v-else-if="preview" class="mt-6 space-y-3">
        <p class="text-muted">
          You’re invited to <strong class="text-charcoal">{{ preview.workspace.name }}</strong>
          as <strong class="text-charcoal">{{ preview.roleName }}</strong>.
        </p>
        <p class="text-sm text-muted">
          Invite email: {{ preview.email }} (sign in with this address)
        </p>
        <button type="button" class="btn-primary mt-4 w-full" :disabled="accepting" @click="accept">
          {{ accepting ? 'Joining…' : auth.isAuthenticated ? 'Accept invite' : 'Sign in to accept' }}
        </button>
        <p v-if="!auth.isAuthenticated" class="text-sm text-muted">
          Need an account first?
          <RouterLink class="text-brand hover:underline" :to="{ name: 'register' }">
            Register with {{ preview.email }}
          </RouterLink>
        </p>
      </div>

      <p v-else class="mt-6 text-muted">Loading invite…</p>
    </div>
  </div>
</template>
