<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Bell } from 'lucide-vue-next'
import api from '@/lib/api'
import type { AppNotification } from '@/types'

const props = defineProps<{
  workspaceId: string
  dark?: boolean
}>()

const router = useRouter()
const open = ref(false)
const loading = ref(false)
const items = ref<AppNotification[]>([])
const unread = ref(0)
const rootEl = ref<HTMLElement | null>(null)
const buttonEl = ref<HTMLElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})

const unreadLabel = computed(() => (unread.value > 9 ? '9+' : String(unread.value)))

async function refreshCount() {
  const { data } = await api.get<{ count: number }>(
    `/workspaces/${props.workspaceId}/notifications/unread-count`,
  )
  unread.value = data.count
}

async function loadList() {
  loading.value = true
  try {
    const { data } = await api.get<AppNotification[]>(
      `/workspaces/${props.workspaceId}/notifications`,
    )
    items.value = data
    unread.value = data.filter((n) => !n.readAt).length
  } finally {
    loading.value = false
  }
}

function positionPanel() {
  if (!buttonEl.value) return

  const rect = buttonEl.value.getBoundingClientRect()
  const gutter = 8
  const vw = window.innerWidth
  const vh = window.innerHeight
  const preferredWidth = Math.min(352, vw - gutter * 2)
  const maxHeight = Math.min(320, vh - gutter * 2)

  let left = rect.right - preferredWidth
  left = Math.max(gutter, Math.min(left, vw - preferredWidth - gutter))

  const spaceBelow = vh - rect.bottom - gutter
  const spaceAbove = rect.top - gutter
  const openBelow = spaceBelow >= Math.min(200, maxHeight) || spaceBelow >= spaceAbove

  if (openBelow) {
    panelStyle.value = {
      top: `${rect.bottom + gutter}px`,
      left: `${left}px`,
      width: `${preferredWidth}px`,
      maxHeight: `${Math.min(maxHeight, Math.max(160, spaceBelow))}px`,
    }
  } else {
    panelStyle.value = {
      bottom: `${vh - rect.top + gutter}px`,
      left: `${left}px`,
      width: `${preferredWidth}px`,
      maxHeight: `${Math.min(maxHeight, Math.max(160, spaceAbove))}px`,
    }
  }
}

async function toggle() {
  open.value = !open.value
  if (open.value) {
    await nextTick()
    positionPanel()
    await loadList()
    await nextTick()
    positionPanel()
  }
}

async function markAll() {
  await api.post(`/workspaces/${props.workspaceId}/notifications/read-all`)
  items.value = items.value.map((n) => ({
    ...n,
    readAt: n.readAt ?? new Date().toISOString(),
  }))
  unread.value = 0
}

async function openNotification(n: AppNotification) {
  if (!n.readAt) {
    await api.patch(`/workspaces/${props.workspaceId}/notifications/${n.id}/read`)
    n.readAt = new Date().toISOString()
    unread.value = Math.max(0, unread.value - 1)
  }
  open.value = false
  if (n.task?.projectId) {
    await router.push({
      name: 'project',
      params: { projectId: n.task.projectId },
      query: { taskId: n.task.id },
    })
  }
}

function onDocClick(event: MouseEvent) {
  const target = event.target as Node
  if (rootEl.value?.contains(target) || panelEl.value?.contains(target)) return
  open.value = false
}

function onViewportChange() {
  if (open.value) positionPanel()
}

let poll: ReturnType<typeof setInterval> | undefined

watch(
  () => props.workspaceId,
  () => {
    void refreshCount()
    if (open.value) void loadList()
  },
)

onMounted(() => {
  void refreshCount()
  document.addEventListener('click', onDocClick)
  window.addEventListener('resize', onViewportChange)
  window.addEventListener('scroll', onViewportChange, true)
  poll = setInterval(() => {
    void refreshCount()
  }, 30000)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
  if (poll) clearInterval(poll)
})
</script>

<template>
  <div ref="rootEl" class="relative">
    <button
      ref="buttonEl"
      type="button"
      class="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors duration-150"
      :class="
        dark
          ? 'border-sidebar-border bg-sidebar-input text-sidebar-text hover:border-sidebar-text/40 hover:text-white'
          : 'border-line bg-surface text-charcoal hover:bg-canvas'
      "
      aria-label="Notifications"
      :aria-expanded="open"
      @click.stop="toggle"
    >
      <Bell class="h-4 w-4" />
      <span
        v-if="unread"
        class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sidebar-active px-1 text-[10px] font-semibold text-white"
      >
        {{ unreadLabel }}
      </span>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="panelEl"
        class="fixed z-[60] flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xl"
        :style="panelStyle"
        @click.stop
      >
        <div class="flex shrink-0 items-center justify-between gap-2 border-b border-line px-3 py-2">
          <p class="truncate text-sm font-semibold text-charcoal">Notifications</p>
          <button
            type="button"
            class="shrink-0 text-xs text-brand hover:underline disabled:opacity-40"
            :disabled="!unread"
            @click="markAll"
          >
            Mark all read
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <p v-if="loading" class="px-3 py-6 text-sm text-muted">Loading…</p>
          <p v-else-if="!items.length" class="px-3 py-6 text-sm text-muted">
            You’re all caught up.
          </p>
          <button
            v-for="n in items"
            :key="n.id"
            type="button"
            class="flex w-full gap-2 border-b border-line px-3 py-3 text-left last:border-b-0 hover:bg-canvas"
            :class="!n.readAt ? 'bg-brand-soft/40' : ''"
            @click="openNotification(n)"
          >
            <span
              class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              :class="n.readAt ? 'bg-transparent' : 'bg-brand'"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium leading-snug text-charcoal break-words">{{ n.title }}</p>
              <p v-if="n.body" class="mt-0.5 line-clamp-2 text-xs text-muted break-words">
                {{ n.body }}
              </p>
              <p class="mt-1 text-[11px] text-muted">
                {{ new Date(n.createdAt).toLocaleString() }}
              </p>
            </div>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
