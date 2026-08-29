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
  <div class="auth-page">
    <div class="auth-story">
      <p class="auth-story-kicker">Welcome back</p>
      <p class="auth-story-title">Pick up the path<br><em>where you left it.</em></p>
      <p class="auth-story-copy">Your projects, decisions, and next steps are waiting in one shared place.</p>
    </div>
    <div class="auth-card panel relative p-8">
      <RouterLink :to="{ name: 'home' }" class="mb-7 inline-flex items-center gap-2 font-display text-sm font-semibold text-brand hover:text-brand-hover">
        <span aria-hidden="true">←</span> Back to Asanop
      </RouterLink>
      <p class="font-display text-overline uppercase tracking-wider text-brand">Welcome back</p>
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
        <RouterLink class="font-semibold text-brand hover:underline" :to="{ name: 'register' }">
          Create one
        </RouterLink>
      </p>
    </div>
  </div>
</template>
