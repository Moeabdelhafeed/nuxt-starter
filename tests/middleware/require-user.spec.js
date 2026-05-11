// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'

const { navigateTo, sanctumState } = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  sanctumState: { user: { value: null }, isAuthenticated: { value: false } },
}))

mockNuxtImport('navigateTo', () => navigateTo)
mockNuxtImport('useSanctumAuth', () => () => sanctumState)

const middleware = (await import('~/middleware/require-user')).default

beforeEach(() => {
  navigateTo.mockReset()
  sanctumState.user.value = null
  sanctumState.isAuthenticated.value = false
})

describe('require-user', () => {
  it('anon → redirect /login', () => {
    middleware()
    expect(navigateTo).toHaveBeenCalledWith({ name: 'login' })
  })

  it('guest → pass', () => {
    sanctumState.user.value = { data: { is_guest: true } }
    sanctumState.isAuthenticated.value = true
    middleware()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('registered → pass', () => {
    sanctumState.user.value = { data: { is_guest: false } }
    sanctumState.isAuthenticated.value = true
    middleware()
    expect(navigateTo).not.toHaveBeenCalled()
  })
})
