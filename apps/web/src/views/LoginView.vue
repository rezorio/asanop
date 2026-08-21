<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await auth.login({ email: email.value, password: password.value })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(redirect)
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message?.toString() ??
      'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
    <div
      class="pointer-events-none absolute inset-x-0 top-16 mx-auto h-40 w-72 rounded-full opacity-70 blur-3xl"
      style="background: radial-gradient(circle, rgba(2, 132, 199, 0.35), transparent 70%)"
    />
    <div
      class="pointer-events-none absolute inset-x-10 top-28 mx-auto h-28 w-48 rounded-full opacity-55 blur-3xl"
      style="background: radial-gradient(circle, rgba(255, 90, 54, 0.28), transparent 70%)"
    />

    <div class="panel relative p-8">
      <RouterLink :to="{ name: 'home' }" class="mb-7 inline-flex items-center gap-2 font-display text-sm font-semibold text-brand hover:text-brand-hover">
        <span aria-hidden="true">←</span> Back to Asanop
      </RouterLink>
      <p class="font-display text-overline uppercase tracking-wider text-accent">Welcome back</p>
      <h1 class="mt-2 text-brand-mark">Asanop</h1>
      <p class="page-subtitle">Sign in to manage tasks and teams</p>

      <form class="mt-8 space-y-4" @submit.prevent="submit">
        <div>
          <label class="label">Email</label>
          <input v-model="email" type="email" required class="field" />
        </div>
        <div>
          <label class="label">Password</label>
          <input v-model="password" type="password" required minlength="8" class="field" />
        </div>
        <AppAlert v-if="error" tone="danger">{{ error }}</AppAlert>
        <AppButton type="submit" class="w-full" :loading="loading">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </AppButton>
      </form>

      <p class="mt-6 text-sm text-muted">
        No account?
        <RouterLink class="font-semibold text-sky hover:underline" :to="{ name: 'register' }">
          Create one
        </RouterLink>
      </p>
    </div>
  </div>
</template>
