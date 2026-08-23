import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { clearMemoryCache } from '@/lib/api'
import type { User, Workspace } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('asanop_token'))
  const user = ref<User | null>(
    localStorage.getItem('asanop_user')
      ? (JSON.parse(localStorage.getItem('asanop_user')!) as User)
      : null,
  )
  const workspaces = ref<Workspace[]>([])
  const activeWorkspaceId = ref<string | null>(
    localStorage.getItem('asanop_workspace'),
  )

  const isAuthenticated = computed(() => Boolean(token.value && user.value))
  const activeWorkspace = computed(
    () => workspaces.value.find((w) => w.id === activeWorkspaceId.value) ?? workspaces.value[0] ?? null,
  )

  function persistSession(accessToken: string, nextUser: User) {
    clearMemoryCache()
    token.value = accessToken
    user.value = nextUser
    localStorage.setItem('asanop_token', accessToken)
    localStorage.setItem('asanop_user', JSON.stringify(nextUser))
  }

  async function register(payload: { name: string; email: string; password: string }) {
    const { data } = await api.post('/auth/register', payload)
    persistSession(data.accessToken, data.user)
    await loadWorkspaces()
  }

  async function login(payload: { email: string; password: string }) {
    const { data } = await api.post('/auth/login', payload)
    persistSession(data.accessToken, data.user)
    await loadWorkspaces()
  }

  async function loadWorkspaces() {
    const { data } = await api.get<Workspace[]>('/workspaces')
    workspaces.value = data
    if (!activeWorkspaceId.value || !data.some((w) => w.id === activeWorkspaceId.value)) {
      activeWorkspaceId.value = data[0]?.id ?? null
    }
    if (activeWorkspaceId.value) {
      localStorage.setItem('asanop_workspace', activeWorkspaceId.value)
    }
  }

  function setWorkspace(id: string) {
    clearMemoryCache()
    activeWorkspaceId.value = id
    localStorage.setItem('asanop_workspace', id)
  }

  function logout() {
    clearMemoryCache()
    token.value = null
    user.value = null
    workspaces.value = []
    activeWorkspaceId.value = null
    localStorage.removeItem('asanop_token')
    localStorage.removeItem('asanop_user')
    localStorage.removeItem('asanop_workspace')
  }

  return {
    token,
    user,
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    isAuthenticated,
    register,
    login,
    loadWorkspaces,
    setWorkspace,
    logout,
  }
})
