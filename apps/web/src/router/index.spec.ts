import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import router from './index'

describe('public and compatibility routes', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('keeps the homepage public and places the app under /app', () => {
    expect(router.resolve({ name: 'home' }).path).toBe('/')
    expect(router.resolve({ name: 'dashboard' }).path).toBe('/app/dashboard')
  })

  it('preserves the migrated destination when an old protected bookmark requires login', async () => {
    await router.push('/dashboard')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/app/dashboard')
  })
})
