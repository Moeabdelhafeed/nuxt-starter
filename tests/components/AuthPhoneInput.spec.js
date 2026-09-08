// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import AuthPhoneInput from '~/components/AuthPhoneInput.vue'

describe('AuthPhoneInput', () => {
  it('joins country dial code and digits into E.164', async () => {
    const wrapper = await mountSuspended(AuthPhoneInput, {
      props: { id: 'phone', allowed: ['DZ'], modelValue: '', 'onUpdate:modelValue': (v) => wrapper.setProps({ modelValue: v }) },
    })
    const input = wrapper.find('input[type="tel"]')
    await input.setValue('0555000000')
    await nextTick()
    expect(wrapper.props('modelValue')).toBe('+2130555000000')
  })

  it('restores a +E.164 value into country and digits', async () => {
    const wrapper = await mountSuspended(AuthPhoneInput, {
      props: { id: 'phone', modelValue: '+966501234567' },
    })
    expect(wrapper.text()).toContain('+966')
    expect(wrapper.find('input[type="tel"]').element.value).toBe('501234567')
  })
})
