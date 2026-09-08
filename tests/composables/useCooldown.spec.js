// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { useCooldown } from '~/composables/useCooldown'

describe('useCooldown', () => {
  it('counts down to zero and reports active state', () => {
    vi.useFakeTimers()
    const cooldown = useCooldown(3)
    expect(cooldown.active.value).toBe(false)
    cooldown.start()
    expect(cooldown.remaining.value).toBe(3)
    expect(cooldown.active.value).toBe(true)
    vi.advanceTimersByTime(2000)
    expect(cooldown.remaining.value).toBe(1)
    vi.advanceTimersByTime(1000)
    expect(cooldown.remaining.value).toBe(0)
    expect(cooldown.active.value).toBe(false)
    vi.useRealTimers()
  })
})
