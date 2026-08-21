<script setup lang="ts">
import { ref } from 'vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/AppModal.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import PriorityBadge from '@/components/ui/PriorityBadge.vue'

const modalOpen = ref(false)
</script>

<template>
  <main class="min-h-screen bg-canvas px-4 py-8 sm:px-8">
    <div class="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Development only"
        title="Asanop component gallery"
        description="Shared states and primitives used to keep product interactions consistent."
      />

      <section class="gallery-section">
        <h2 class="section-title">Buttons</h2>
        <div class="flex flex-wrap gap-3">
          <AppButton>Primary action</AppButton>
          <AppButton variant="secondary">Secondary action</AppButton>
          <AppButton variant="quiet">Quiet action</AppButton>
          <AppButton loading>Saving</AppButton>
          <AppButton disabled>Disabled</AppButton>
        </div>
      </section>

      <section class="gallery-section">
        <h2 class="section-title">Fields</h2>
        <div class="grid max-w-2xl gap-4 sm:grid-cols-2">
          <label><span class="label">Project name</span><input class="field" value="Website launch" /></label>
          <label><span class="label">Disabled field</span><input class="field" value="Unavailable" disabled /></label>
          <label class="sm:col-span-2"><span class="label">Description</span><textarea class="field" rows="3">Keep launch work aligned.</textarea></label>
        </div>
      </section>

      <section class="gallery-section">
        <h2 class="section-title">Status and feedback</h2>
        <div class="mb-5 flex flex-wrap gap-2">
          <StatusBadge status="TODO" /><StatusBadge status="IN_PROGRESS" /><StatusBadge status="DONE" />
          <PriorityBadge priority="LOW" /><PriorityBadge priority="MEDIUM" /><PriorityBadge priority="HIGH" />
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
          <AppAlert>Informational feedback</AppAlert>
          <AppAlert tone="success">Changes saved successfully</AppAlert>
          <AppAlert tone="danger">Something needs attention</AppAlert>
        </div>
      </section>

      <section class="gallery-section">
        <h2 class="section-title">Overlays</h2>
        <AppButton variant="secondary" @click="modalOpen = true">Open accessible modal</AppButton>
      </section>
    </div>
    <AppModal v-model:open="modalOpen" title="Example dialog" subtitle="Focus stays inside until the dialog closes.">
      <label><span class="label">Task name</span><input class="field" placeholder="Enter a task" /></label>
      <div class="mt-5 flex justify-end gap-2"><AppButton variant="secondary" @click="modalOpen = false">Cancel</AppButton><AppButton @click="modalOpen = false">Save task</AppButton></div>
    </AppModal>
  </main>
</template>

<style scoped>
.gallery-section{margin-top:1rem;border:1px solid var(--color-line);border-radius:var(--radius-panel);background:var(--color-surface);padding:1.5rem;box-shadow:0 2px 8px rgba(16,27,45,.04)}.gallery-section h2{margin-bottom:1rem}
</style>
