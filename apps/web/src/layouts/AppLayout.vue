<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  Users,
  LogOut,
  Plus,
  CheckSquare,
  Search,
  CalendarDays,
  GanttChart,
  ClipboardList,
  Zap,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-vue-next'
import api from '@/lib/api'
import NotificationBell from '@/components/NotificationBell.vue'
import SearchModal from '@/components/SearchModal.vue'
import WorkspaceSelect from '@/components/WorkspaceSelect.vue'
import SidebarProjectList from '@/components/layout/SidebarProjectList.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const showCreate = ref(false)
const showSearch = ref(false)
const mobileNavOpen = ref(false)
const newName = ref('')
const creating = ref(false)
const error = ref('')
const menuButtonEl = ref<HTMLButtonElement | null>(null)
const mobileNavEl = ref<HTMLElement | null>(null)

const workspaceOptions = computed(() => auth.workspaces)

const navLinks = [
  { name: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { name: 'my-tasks' as const, label: 'My Tasks', icon: CheckSquare },
  { name: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
  { name: 'timeline' as const, label: 'Timeline', icon: GanttChart },
  { name: 'forms' as const, label: 'Forms', icon: ClipboardList },
  { name: 'automations' as const, label: 'Automations', icon: Zap },
  { name: 'members' as const, label: 'Members & roles', icon: Users },
]

function isNavActive(name: (typeof navLinks)[number]['name']) {
  return route.name === name
}

async function createWorkspace() {
  if (!newName.value.trim()) return
  creating.value = true
  error.value = ''
  try {
    const { data } = await api.post('/workspaces', { name: newName.value.trim() })
    await auth.loadWorkspaces()
    auth.setWorkspace(data.id)
    showCreate.value = false
    newName.value = ''
    mobileNavOpen.value = false
    router.push({ name: 'dashboard' })
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to create workspace'
  } finally {
    creating.value = false
  }
}

function onWorkspaceChange(id: string) {
  auth.setWorkspace(id)
  mobileNavOpen.value = false
  router.push({ name: 'dashboard' })
}

function logout() {
  auth.logout()
  mobileNavOpen.value = false
  router.push({ name: 'login' })
}

function closeMobileNav() {
  mobileNavOpen.value = false
}

function onGlobalKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && mobileNavOpen.value) closeMobileNav()
}

watch(
  () => route.fullPath,
  () => {
    mobileNavOpen.value = false
  },
)

watch(mobileNavOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) {
    void nextTick(() => mobileNavEl.value?.querySelector<HTMLElement>('button, a, input')?.focus())
  } else {
    menuButtonEl.value?.focus()
  }
})

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="app-shell min-h-screen lg:grid lg:h-screen lg:grid-cols-[268px_1fr] lg:overflow-hidden">
    <!-- Mobile top bar -->
    <header
      class="mobile-app-bar sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 backdrop-blur-sm lg:hidden"
    >
      <button
        ref="menuButtonEl"
        type="button"
        class="mobile-icon-button inline-flex h-10 w-10 items-center justify-center rounded-full"
        aria-label="Open menu"
        :aria-expanded="mobileNavOpen"
        aria-controls="app-navigation"
        @click="mobileNavOpen = true"
      >
        <Menu class="h-5 w-5" />
      </button>
      <p class="font-display text-xl font-semibold tracking-tight text-white">Asanop</p>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="mobile-icon-button inline-flex h-10 w-10 items-center justify-center rounded-full"
          aria-label="Search"
          @click="showSearch = true"
        >
          <Search class="h-4 w-4" />
        </button>
        <NotificationBell
          v-if="auth.activeWorkspace"
          :workspace-id="auth.activeWorkspace.id"
        />
      </div>
    </header>

    <!-- Mobile overlay -->
    <div
      v-if="mobileNavOpen"
      class="fixed inset-0 z-40 bg-charcoal/40 lg:hidden"
      @click="closeMobileNav"
    />

    <aside
      id="app-navigation"
      ref="mobileNavEl"
      class="app-sidebar fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(100%,292px)] max-w-full -translate-x-full flex-col overflow-hidden px-4 py-5 transition-transform duration-200 ease-out lg:static lg:z-auto lg:h-screen lg:w-auto lg:max-w-none lg:translate-x-0 lg:transition-none"
      :class="mobileNavOpen ? 'translate-x-0' : ''"
    >
      <div class="mb-6 flex shrink-0 items-start justify-between gap-2 lg:mb-8">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="app-brand-mark inline-flex h-9 w-9 -rotate-3 items-center justify-center rounded-full bg-sidebar-active text-charcoal shadow-sm">
              <CheckSquare class="h-4 w-4" aria-hidden="true" />
            </span>
            <p class="font-display text-[1.6rem] font-semibold tracking-tight text-white">Asanop</p>
          </div>
          <p class="mt-1.5 font-sans text-sm text-sidebar-text">A clear route through work</p>
        </div>
        <div class="flex items-center gap-1">
          <div class="hidden lg:block">
            <NotificationBell
              v-if="auth.activeWorkspace"
              :workspace-id="auth.activeWorkspace.id"
              dark
            />
          </div>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-text hover:bg-sidebar-input hover:text-white lg:hidden"
            aria-label="Close menu"
            @click="closeMobileNav"
          >
            <X class="h-5 w-5" />
          </button>
        </div>
      </div>

      <div class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-0.5">
        <button
          type="button"
          class="sidebar-search mb-0 hidden lg:flex"
          @click="showSearch = true"
        >
          <Search class="h-4 w-4 shrink-0" aria-hidden="true" />
          <span class="flex-1">Search…</span>
          <kbd
            class="rounded border border-sidebar-border px-1.5 py-0.5 text-[10px] text-sidebar-text"
          >
            ⌘K
          </kbd>
        </button>

        <div>
          <label class="overline mb-2 block text-sidebar-text">Workspace</label>
          <WorkspaceSelect
            :workspaces="workspaceOptions"
            :model-value="auth.activeWorkspace?.id"
            @update:model-value="onWorkspaceChange"
          />
          <button
            type="button"
            class="mt-2 inline-flex items-center gap-2 text-sm text-sidebar-text transition-colors duration-150 hover:text-white"
            @click="showCreate = !showCreate"
          >
            <Plus class="h-4 w-4" aria-hidden="true" /> New workspace
          </button>

          <div
            v-if="showCreate"
            class="mt-3 space-y-2 rounded-lg border border-sidebar-border bg-sidebar-input p-3"
          >
            <input
              v-model="newName"
              class="sidebar-field"
              placeholder="Workspace name"
              @keyup.enter="createWorkspace"
            />
            <p v-if="error" class="text-xs text-danger">{{ error }}</p>
            <button
              type="button"
              class="btn-primary w-full"
              :disabled="creating"
              @click="createWorkspace"
            >
              {{ creating ? 'Creating…' : 'Create' }}
            </button>
          </div>
        </div>

        <SidebarProjectList v-if="auth.activeWorkspace" />

        <nav class="space-y-1 pb-2" aria-label="Main navigation">
          <RouterLink
            v-for="link in navLinks"
            :key="link.name"
            :to="{ name: link.name }"
            class="sidebar-nav-link"
            :class="isNavActive(link.name) ? 'sidebar-nav-link-active' : ''"
          >
            <component :is="link.icon" class="h-4 w-4 shrink-0" aria-hidden="true" />
            {{ link.label }}
          </RouterLink>
        </nav>
      </div>

      <div class="sidebar-divider mt-4 shrink-0 border-t pt-4">
        <p class="truncate text-sm font-medium text-white">{{ auth.user?.name }}</p>
        <p class="truncate text-xs text-sidebar-text">{{ auth.user?.email }}</p>
        <button
          type="button"
          class="mt-3 inline-flex items-center gap-2 text-sm text-sidebar-text transition-colors duration-150 hover:text-danger"
          @click="logout"
        >
          <LogOut class="h-4 w-4" aria-hidden="true" /> Log out
        </button>
      </div>
    </aside>

    <main class="app-content min-h-0 min-w-0 overflow-y-auto px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6 lg:px-9 lg:py-8">
      <div class="app-content-inner"><RouterView /></div>
    </main>

    <SearchModal v-model:open="showSearch" />
  </div>
</template>

<style scoped>
.app-shell {
  background: var(--color-canvas);
}

.app-sidebar {
  position: relative;
  isolation: isolate;
  border-right: 1px solid var(--color-sidebar-border);
  background:
    radial-gradient(circle at -15% 18%, rgba(244, 183, 0, 0.16), transparent 13rem),
    linear-gradient(
      160deg,
      color-mix(in srgb, var(--color-sidebar) 86%, var(--color-brand)) 0%,
      var(--color-sidebar) 55%,
      color-mix(in srgb, var(--color-sidebar) 90%, black) 100%
    );
}

.app-sidebar::before,
.app-sidebar::after {
  content: '';
  position: absolute;
  z-index: -1;
  border: 1px solid rgba(244, 183, 0, 0.11);
  border-radius: 50%;
  pointer-events: none;
}

.app-sidebar::before {
  width: 270px;
  height: 160px;
  right: -135px;
  top: 36%;
  transform: rotate(-18deg);
}

.app-sidebar::after {
  width: 360px;
  height: 210px;
  left: -250px;
  bottom: 5%;
  transform: rotate(12deg);
}

.app-brand-mark {
  box-shadow: 0 10px 26px rgba(244, 183, 0, 0.22);
}

.mobile-app-bar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(8, 47, 41, 0.96);
  box-shadow: 0 8px 26px rgba(8, 47, 41, 0.14);
}

.mobile-icon-button {
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: color-mix(in srgb, white 92%, var(--color-sidebar));
  background: rgba(255, 255, 255, 0.05);
}

.mobile-icon-button:hover {
  background: rgba(255, 255, 255, 0.11);
}

.app-content {
  position: relative;
  background:
    radial-gradient(circle at 92% -8%, rgba(244, 183, 0, 0.13), transparent 25rem),
    radial-gradient(circle at 4% 105%, rgba(11, 106, 87, 0.08), transparent 28rem),
    var(--color-canvas);
}

.app-content-inner {
  position: relative;
  z-index: 1;
  width: min(100%, 1480px);
  margin-inline: auto;
}

@media (min-width: 1536px) {
  .app-shell {
    grid-template-columns: 292px 1fr;
  }

  .app-content {
    padding-inline: 3.25rem;
  }
}
</style>
