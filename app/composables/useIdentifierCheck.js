/**
 * Debounced `POST /api/check-identifier` for a typed identifier. `result` is the API's
 * data object (`exists`, `suspended`, `pending_deletion`, `available_channels`,
 * `has_password`, `social_providers`, `verified`, `is_guest`) or null while unknown.
 *
 * @param {import('vue').Ref<string>} identifier
 * @param {import('vue').Ref<string>} type  'email' | 'phone' | 'username'
 */
export const useIdentifierCheck = (identifier, type) => {
  const client = useApi()
  const checking = ref(false)
  const result = ref(null)
  let timer = null
  let latest = 0

  const run = async (value, kind) => {
    const ticket = ++latest
    try {
      const res = await client('/api/check-identifier', {
        method: 'POST',
        body: { identifier: value, type: kind },
      })
      if (ticket !== latest) return
      result.value = res?.data ?? res ?? null
    } catch {
      if (ticket === latest) result.value = null
    } finally {
      if (ticket === latest) checking.value = false
    }
  }

  watch([identifier, type], ([value, kind]) => {
    result.value = null
    if (timer) clearTimeout(timer)
    if (!value || value.length < 3) {
      checking.value = false
      return
    }
    checking.value = true
    timer = setTimeout(() => run(value, kind), 500)
  })

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })

  const status = computed(() => {
    const r = result.value
    if (!r) return null
    if (!r.exists) return 'missing'
    if (r.suspended) return 'suspended'
    if (r.pending_deletion) return 'pending_deletion'
    return 'active'
  })

  return { checking, result, status }
}
