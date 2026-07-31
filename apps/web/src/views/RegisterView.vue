<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await auth.register({
      name: name.value,
      email: email.value,
      password: password.value,
    })
    router.push({ name: 'dashboard' })
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message?.toString() ??
      'Registration failed'
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
      style="background: radial-gradient(circle, rgba(224, 155, 20, 0.28), transparent 70%)"
    />

    <div class="panel relative p-8">
      <p class="font-display text-overline uppercase tracking-wider text-sky">Get started</p>
      <h1 class="mt-2 text-brand-mark">Asanop</h1>
      <p class="page-subtitle">Create an account — no OTP required</p>

      <form class="mt-8 space-y-4" @submit.prevent="submit">
        <div>
          <label class="label">Name</label>
          <input v-model="name" required class="field" />
        </div>
        <div>
          <label class="label">Email</label>
          <input v-model="email" type="email" required class="field" />
        </div>
        <div>
          <label class="label">Password</label>
          <input v-model="password" type="password" required minlength="8" class="field" />
        </div>
        <p v-if="error" class="text-sm text-danger">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Creating…' : 'Create account' }}
        </button>
      </form>

      <p class="mt-6 text-sm text-muted">
        Already have an account?
        <RouterLink class="font-semibold text-sky hover:underline" :to="{ name: 'login' }">
          Sign in
        </RouterLink>
      </p>
    </div>
  </div>
</template>
