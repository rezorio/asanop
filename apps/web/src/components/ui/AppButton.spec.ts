import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AppButton from './AppButton.vue'

describe('AppButton', () => {
  it('exposes its loading state and prevents interaction', () => {
    const wrapper = mount(AppButton, {
      props: { loading: true },
      slots: { default: 'Save changes' },
    })

    expect(wrapper.get('button').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('button').attributes()).toHaveProperty('disabled')
    expect(wrapper.text()).toContain('Save changes')
  })

  it('applies the requested visual contract', () => {
    const wrapper = mount(AppButton, {
      props: { variant: 'secondary', size: 'lg' },
      slots: { default: 'Cancel' },
    })

    expect(wrapper.get('button').classes()).toEqual(
      expect.arrayContaining(['ui-button-secondary', 'ui-button-lg']),
    )
  })
})
