import { describe, it, expect } from 'vitest'

// Mirrors the prefix check in server/api/[...].js: the proxy must never forward a
// request that escapes /api/ through dot-segments.
const escapes = (path) => !new URL(path, 'http://localhost').pathname.startsWith('/api/')

describe('proxy path normalisation', () => {
  it('rejects dot-segment escapes and keeps real API paths', () => {
    expect(escapes('/api/../login')).toBe(true)
    expect(escapes('/api/%2e%2e/login')).toBe(true)
    expect(escapes('/api/pages/../../docs.postman')).toBe(true)
    expect(escapes('/api/pages/about')).toBe(false)
    expect(escapes('/api/translations?group=web')).toBe(false)
  })
})
