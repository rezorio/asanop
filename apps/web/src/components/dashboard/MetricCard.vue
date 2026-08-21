<script setup lang="ts">
export type KpiAccent = 'blue' | 'red' | 'emerald' | 'amber'

defineProps<{
  label: string
  value: string | number
  detail?: string
  accent: KpiAccent
  valueClass?: string
}>()
</script>

<template>
  <div class="kpi-card group" :class="`kpi-card-${accent}`">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{{ label }}</p>
        <p class="mt-2 font-display text-[2rem] font-bold leading-none text-charcoal" :class="valueClass">
          {{ value }}
        </p>
      </div>
      <span v-if="$slots.icon" class="kpi-icon" :class="`kpi-icon-${accent}`" aria-hidden="true">
        <slot name="icon" />
      </span>
    </div>
    <p v-if="detail" class="mt-3 text-xs leading-snug text-muted">{{ detail }}</p>
  </div>
</template>
