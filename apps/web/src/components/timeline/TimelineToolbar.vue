<script setup lang="ts">
import { ChevronLeft, ChevronRight, Link2 } from 'lucide-vue-next'
import AppSelect from '@/components/AppSelect.vue'
import type { DependencyDisplayMode } from '@/lib/timeline/types'

defineProps<{
  weeksVisible: number
  weeksOptions: Array<{ value: number; label: string }>
  rangeLabel: string
  linkMode: boolean
  linkHint: string | null
  dependencyMode: DependencyDisplayMode
  dependencyModeOptions: Array<{ value: DependencyDisplayMode; label: string }>
  /** Compact layout for the mobile schedule */
  mobile?: boolean
}>()

const emit = defineEmits<{
  'update:weeksVisible': [value: number]
  'update:linkMode': [value: boolean]
  'update:dependencyMode': [value: DependencyDisplayMode]
  today: []
  prev: []
  next: []
}>()
</script>

<template>
  <!-- Mobile: full range visible, controls on the row under it -->
  <div v-if="mobile" class="mb-3 space-y-2">
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="shrink-0 rounded-lg border border-line bg-surface p-2 hover:bg-canvas"
        aria-label="Previous week"
        @click="emit('prev')"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>

      <p
        class="min-w-0 flex-1 px-1 text-center font-display text-base font-semibold leading-tight text-charcoal"
      >
        {{ rangeLabel }}
      </p>

      <button
        type="button"
        class="shrink-0 rounded-lg border border-line bg-surface p-2 hover:bg-canvas"
        aria-label="Next week"
        @click="emit('next')"
      >
        <ChevronRight class="h-4 w-4" />
      </button>
    </div>

    <div class="flex items-center justify-end gap-1.5">
      <button
        type="button"
        class="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-charcoal hover:bg-canvas"
        @click="emit('today')"
      >
        Today
      </button>
    </div>
  </div>

  <!-- Desktop -->
  <div v-else class="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div class="min-w-0">
      <h1 class="font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
        Timeline
      </h1>
      <p class="mt-1 text-sm text-muted sm:text-base">
        Bars show duration. Dependencies appear on focus — keep the chart clean by default.
      </p>
    </div>

    <div class="flex max-w-full flex-wrap items-center gap-2">
      <AppSelect
        :model-value="dependencyMode"
        class="w-auto min-w-[9.5rem]"
        :options="dependencyModeOptions"
        @update:model-value="emit('update:dependencyMode', $event as DependencyDisplayMode)"
      />

      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition"
        :class="
          linkMode
            ? 'border-brand bg-brand-soft text-brand'
            : 'border-line bg-surface text-charcoal hover:border-brand/40'
        "
        :aria-pressed="linkMode"
        @click="emit('update:linkMode', !linkMode)"
      >
        <Link2 class="h-4 w-4" aria-hidden="true" />
        {{ linkMode ? 'Linking…' : 'Link tasks' }}
      </button>

      <AppSelect
        :model-value="weeksVisible"
        class="w-auto min-w-[7rem]"
        :options="weeksOptions"
        @update:model-value="emit('update:weeksVisible', $event as number)"
      />

      <button type="button" class="btn-secondary py-2 text-sm" @click="emit('today')">
        Today
      </button>
      <button
        type="button"
        class="rounded-lg border border-line bg-surface p-2 hover:bg-canvas"
        aria-label="Previous week"
        @click="emit('prev')"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>
      <p
        class="min-w-0 max-w-[10rem] truncate text-center text-xs font-medium text-charcoal sm:max-w-none sm:text-sm"
      >
        {{ rangeLabel }}
      </p>
      <button
        type="button"
        class="rounded-lg border border-line bg-surface p-2 hover:bg-canvas"
        aria-label="Next week"
        @click="emit('next')"
      >
        <ChevronRight class="h-4 w-4" />
      </button>
    </div>

    <p
      v-if="linkMode"
      class="w-full rounded-lg border border-brand/30 bg-brand-soft/40 px-3 py-2 text-sm text-charcoal"
    >
      {{ linkHint ?? 'Click the prerequisite task first, then the task that depends on it.' }}
    </p>
    <p
      v-else-if="dependencyMode === 'focused'"
      class="w-full text-xs text-muted"
    >
      Hover or select a task to see only its prerequisite links.
    </p>
  </div>
</template>
