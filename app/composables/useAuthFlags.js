/**
 * The `/api/config` flags with nothing else attached — safe to call from route
 * middleware, where composables that fetch (`useLang`, `useApiFetch`) are not.
 * `useAuthConfig()` builds on this and adds the translated labels.
 */
export const useAuthFlags = () => {
  const cfgState = useState('config', () => ({}))
  const cfg = computed(() => cfgState.value ?? {})

  const refresh = async () => {
    try {
      const res = await useNuxtApp().$publicApi('/api/config')
      cfgState.value = res?.data ?? res ?? {}
    } catch (err) {
      console.warn('[useAuthFlags] refresh failed', err?.message ?? err)
    }
  }

  const appUsers = computed(() => cfg.value.app_users !== false)
  const appGuests = computed(() => cfg.value.app_guests !== false)
  const hasAuthSystem = computed(() => appUsers.value || appGuests.value)
  const authMode = computed(() => cfg.value.auth_mode ?? 'password')
  const isOtpMode = computed(() => authMode.value === 'otp')
  const multiSession = computed(() => !!cfg.value.multi_session)

  return { cfg, refresh, appUsers, appGuests, hasAuthSystem, authMode, isOtpMode, multiSession }
}
