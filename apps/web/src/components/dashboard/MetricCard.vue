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
  <div class="kpi-card" :class="`kpi-card-${accent}`">
    <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">{{ label }}</p>
    <p
      class="mt-1 font-display text-2xl font-bold leading-none text-charcoal"
      :class="valueClass"
    >
      {{ value }}
    </p>
    <p v-if="detail" class="mt-1 text-[11px] leading-snug text-muted">{{ detail }}</p>
  </div>
</template>
