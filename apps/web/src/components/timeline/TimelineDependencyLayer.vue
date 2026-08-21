<script setup lang="ts">
import type { DependencyDisplayMode, TimelineDependencyLink } from '@/lib/timeline/types'

const props = defineProps<{
  links: TimelineDependencyLink[]
  width: number
  height: number
  hoverId: string | null
  displayMode: DependencyDisplayMode
}>()

const stroke: Record<TimelineDependencyLink['kind'], string> = {
  ok: 'var(--color-todo)',
  open: 'var(--color-progress)',
  conflict: 'var(--color-danger)',
}

function linkOpacity(link: TimelineDependencyLink) {
  const focused =
    props.hoverId && (props.hoverId === link.fromId || props.hoverId === link.toId)

  if (props.displayMode === 'all') {
    if (props.hoverId && !focused) return 0.12
    if (focused) return 0.95
    return link.kind === 'conflict' ? 0.7 : 0.4
  }

  // focused mode — only related links are rendered, keep them clear
  return 0.92
}

function linkWidth(link: TimelineDependencyLink) {
  const focused =
    props.hoverId && (props.hoverId === link.fromId || props.hoverId === link.toId)
  if (props.displayMode === 'all' && focused) return 2.1
  if (props.displayMode === 'focused') return 1.85
  return link.kind === 'conflict' ? 1.6 : 1.35
}
</script>

<template>
  <svg
    class="pointer-events-none absolute left-0 top-0 z-[5] overflow-visible"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    aria-hidden="true"
  >
    <defs>
      <marker
        id="timeline-arrow-ok"
        markerWidth="6"
        markerHeight="6"
        refX="5"
        refY="3"
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <path d="M0,0.5 L5,3 L0,5.5 Z" fill="var(--color-todo)" />
      </marker>
      <marker
        id="timeline-arrow-open"
        markerWidth="6"
        markerHeight="6"
        refX="5"
        refY="3"
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <path d="M0,0.5 L5,3 L0,5.5 Z" fill="var(--color-progress)" />
      </marker>
      <marker
        id="timeline-arrow-conflict"
        markerWidth="6"
        markerHeight="6"
        refX="5"
        refY="3"
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <path d="M0,0.5 L5,3 L0,5.5 Z" fill="var(--color-danger)" />
      </marker>
    </defs>

    <path
      v-for="link in links"
      :key="link.id"
      :d="link.path"
      fill="none"
      :stroke="stroke[link.kind]"
      :stroke-width="linkWidth(link)"
      :stroke-dasharray="link.kind === 'open' ? '5 4' : undefined"
      :opacity="linkOpacity(link)"
      :marker-end="`url(#timeline-arrow-${link.kind})`"
      stroke-linecap="square"
      stroke-linejoin="miter"
      class="transition-opacity duration-150"
    />
  </svg>
</template>
