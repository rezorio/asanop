import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import HomeView from './HomeView.vue'

const RouterLinkStub = {
  props: ['to'],
  template: '<a><slot /></a>',
}

describe('HomeView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('invites a guest to create a free account', () => {
    const wrapper = mount(HomeView, {
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.get('h1').text()).toContain('clear place')
    expect(wrapper.text()).toContain('Create free account')
    expect(wrapper.text()).not.toContain('Open Asanop')
  })

  it('offers authenticated visitors a direct path into the app', () => {
    localStorage.setItem('asanop_token', 'test-token')
    localStorage.setItem(
      'asanop_user',
      JSON.stringify({ id: 'user-1', name: 'Maya', email: 'maya@example.test' }),
    )

    const wrapper = mount(HomeView, {
      global: {
        plugins: [createPinia()],
        stubs: { RouterLink: RouterLinkStub },
      },
    })

    expect(wrapper.text()).toContain('Open Asanop')
    expect(wrapper.text()).not.toContain('Create free account')
  })
})
