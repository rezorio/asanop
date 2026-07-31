<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/lib/api'
import type { PublicIntakeForm } from '@/types'
import AppSelect from '@/components/AppSelect.vue'

const route = useRoute()
const token = String(route.params.token)

const form = ref<PublicIntakeForm | null>(null)
const loading = ref(true)
const submitting = ref(false)
const submitted = ref(false)
const error = ref('')
const answers = reactive<Record<string, string>>({})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get<PublicIntakeForm>(`/forms/${token}`)
    form.value = data
    for (const field of data.fields) {
      answers[field.key] = ''
    }
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Form not available'
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!form.value) return
  submitting.value = true
  error.value = ''
  try {
    const payload: Record<string, string | number | null> = {}
    for (const field of form.value.fields) {
      const raw = answers[field.key]
      if (field.type === 'NUMBER' && raw !== '') {
        payload[field.key] = Number(raw)
      } else {
        payload[field.key] = raw || null
      }
    }
    await api.post(`/forms/${token}/submit`, { answers: payload })
    submitted.value = true
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message?.toString() ??
      'Submit failed'
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-canvas px-4 py-12">
    <div class="mx-auto max-w-lg">
      <p class="font-display text-2xl font-semibold text-brand">Asanop</p>
      <p v-if="loading" class="mt-8 text-muted">Loading form…</p>
      <p v-else-if="error && !form" class="mt-8 text-danger">{{ error }}</p>

      <div v-else-if="submitted" class="mt-8 panel p-6">
        <h1 class="font-display text-2xl font-semibold text-charcoal">Thanks</h1>
        <p class="mt-2 text-muted">Your submission was received.</p>
      </div>

      <form v-else-if="form" class="mt-8 panel space-y-4 p-6" @submit.prevent="submit">
        <div>
          <h1 class="font-display text-3xl font-semibold tracking-tight text-charcoal">
            {{ form.name }}
          </h1>
          <p class="mt-1 text-sm text-muted">
            {{ form.workspaceName }} · {{ form.projectName }}
          </p>
          <p v-if="form.description" class="mt-3 text-charcoal">{{ form.description }}</p>
        </div>

        <p v-if="error" class="text-sm text-danger">{{ error }}</p>

        <div v-for="field in form.fields" :key="field.key">
          <label class="label">
            {{ field.label }}
            <span v-if="field.required" class="text-danger">*</span>
          </label>
          <textarea
            v-if="field.type === 'DESCRIPTION' || (field.type === 'TEXT' && field.key === 'description')"
            v-model="answers[field.key]"
            class="field min-h-[100px]"
            :required="field.required"
          />
          <AppSelect
            v-else-if="field.type === 'SINGLE_SELECT'"
            v-model="answers[field.key]"
            placeholder="Select…"
            :options="[
              { value: '', label: 'Select…' },
              ...(field.options ?? []).map((option) => ({ value: option, label: option })),
            ]"
          />
          <input
            v-else-if="field.type === 'NUMBER'"
            v-model="answers[field.key]"
            type="number"
            class="field"
            :required="field.required"
          />
          <input
            v-else-if="field.type === 'DATE'"
            v-model="answers[field.key]"
            type="date"
            class="field"
            :required="field.required"
          />
          <input
            v-else
            v-model="answers[field.key]"
            type="text"
            class="field"
            :required="field.required"
          />
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="submitting">
          {{ submitting ? 'Submitting…' : 'Submit' }}
        </button>
      </form>
    </div>
  </div>
</template>
