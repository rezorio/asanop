<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'line' | 'card' | 'rows' | 'dashboard' | 'editor'
    rows?: number
    label?: string
  }>(),
  {
    variant: 'rows',
    rows: 5,
    label: 'Loading content',
  },
)
</script>

<template>
  <div class="skeleton-wrap" role="status" :aria-label="label" aria-live="polite">
    <span class="sr-only">{{ label }}</span>

    <div v-if="variant === 'line'" class="skeleton h-4 w-full rounded" />

    <div v-else-if="variant === 'card'" class="panel space-y-3 p-4">
      <div class="skeleton h-3 w-24 rounded" />
      <div class="skeleton h-8 w-2/5 rounded" />
      <div class="skeleton h-3 w-3/4 rounded" />
    </div>

    <div v-else-if="variant === 'dashboard'" class="space-y-4">
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="index in 4" :key="index" class="panel space-y-3 p-4">
          <div class="skeleton h-3 w-24 rounded" />
          <div class="skeleton h-8 w-20 rounded" />
          <div class="skeleton h-3 w-32 rounded" />
        </div>
      </div>
      <div class="skeleton h-48 rounded-[var(--radius-panel)]" />
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="skeleton h-80 rounded-[var(--radius-panel)]" />
        <div class="skeleton h-80 rounded-[var(--radius-panel)]" />
      </div>
    </div>

    <div v-else-if="variant === 'editor'" class="space-y-4">
      <div class="skeleton h-12 w-2/3 rounded" />
      <div class="skeleton h-24 w-full rounded" />
      <div class="grid grid-cols-2 gap-3">
        <div class="skeleton h-11 rounded" />
        <div class="skeleton h-11 rounded" />
      </div>
      <div v-for="index in 4" :key="index" class="skeleton h-11 rounded" />
    </div>

    <div v-else class="panel overflow-hidden">
      <div v-for="index in rows" :key="index" class="flex items-center gap-4 border-b border-line p-4 last:border-0">
        <div class="skeleton h-9 w-9 shrink-0 rounded-full" />
        <div class="min-w-0 flex-1 space-y-2">
          <div class="skeleton h-4 w-[min(18rem,70%)] rounded" />
          <div class="skeleton h-3 w-[min(12rem,50%)] rounded" />
        </div>
        <div class="skeleton hidden h-7 w-20 rounded sm:block" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton {
  position: relative;
  overflow: hidden;
  background: var(--color-surface-muted);
}

.skeleton::after {
  position: absolute;
  inset: 0;
  content: '';
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent);
  animation: skeleton-shimmer 1.45s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  100% { transform: translateX(100%); }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton::after { display: none; }
}
</style>
