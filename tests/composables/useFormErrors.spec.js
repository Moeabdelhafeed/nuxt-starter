// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

mockNuxtImport('useLang', () => () => ({ t: (key, en) => en }))

const { useFormErrors } = await import('~/composables/useFormErrors')

describe('useFormErrors', () => {
  it('keeps known field errors inline and folds stray ones into the message', () => {
    const form = useFormErrors(['identifier'])
    form.set({ status: 422, data: { message: 'The identifier field is required. (and 1 more error)', errors: { identifier: ['Required.'], device_id: ['Header missing.'] } } })
    expect(form.first('identifier')).toBe('Required.')
    expect(form.message.value).toBe('Header missing.')
  })

  it('hides the 422 summary when every error is a rendered field', () => {
    const form = useFormErrors(['password'])
    form.set({ status: 422, data: { message: 'summary', errors: { password: ['Too short.'] } } })
    expect(form.message.value).toBe('')
  })

  it('falls back to a generic message for network and server failures', () => {
    const form = useFormErrors()
    form.set({})
    expect(form.message.value).toMatch(/reach the server/)
    form.set({ status: 500, data: { message: 'Server error' } })
    expect(form.message.value).toBe('Server error')
    form.set({ status: 429, data: { message: 'Too many attempts.' } })
    expect(form.message.value).toBe('Too many attempts.')
  })

  it('clear() resets both', () => {
    const form = useFormErrors(['a'])
    form.set({ status: 422, data: { errors: { a: ['x'] } } })
    form.clear()
    expect(form.errors.value).toEqual({})
    expect(form.message.value).toBe('')
  })
})
