const ONE_YEAR = 60 * 60 * 24 * 365

/**
 * The bits of "being signed in" nuxt-auth-sanctum does not own: which token this browser
 * holds (`current_token_id`, so a device-revoked event can tell if it was us), applying a
 * login-shaped response that did not go through `login()` (OTP verify, social sign-in),
 * and a sign-out that always leaves the browser clean even when the API call fails.
 *
 * A guest has no token — the backend resolves guests from X-Device-Id — so `isGuest`
 * comes from the identity payload, not from token presence.
 */
export const useAuthSession = () => {
  const nuxtApp = useNuxtApp()
  const { user, isAuthenticated, logout, refreshIdentity } = useSanctumAuth()
  const tokenId = useCookie('current_token_id', {
    maxAge: ONE_YEAR,
    sameSite: 'lax',
    secure: useRequestURL().protocol === 'https:',
  })

  const profile = computed(() => user.value?.data ?? null)
  const isGuest = computed(() => !!profile.value?.is_guest)
  const isMember = computed(() => isAuthenticated.value && !isGuest.value)
  const isVerified = computed(() => !!profile.value?.verified_at)

  const setToken = async (token) => {
    const storage = useSanctumAppConfig()?.tokenStorage
    if (storage) await storage.set(nuxtApp, token)
    else useCookie('sanctum.token.cookie', { secure: useRequestURL().protocol === 'https:' }).value = token
  }

  /** Store the token from a login-shaped response and reload the identity. */
  const applyLogin = async (res) => {
    const data = res?.data ?? res ?? {}
    const token = res?.token ?? data.token
    if (token) await setToken(token)
    if (data.token_id != null) tokenId.value = String(data.token_id)
    await refreshIdentity()
    return data
  }

  /** Forget the session locally without telling the API (token already revoked, etc.). */
  const clearLocal = async () => {
    await setToken(undefined)
    tokenId.value = null
    user.value = null
  }

  /** Revoke the current token server-side when there is one, then forget it here. */
  const signOut = async () => {
    if (isMember.value) {
      try {
        await logout()
      } catch {
        // Token already gone (expired, revoked elsewhere) — the local cleanup still applies.
      }
    }
    await clearLocal()
  }

  return { user, profile, isAuthenticated, isGuest, isMember, isVerified, tokenId, applyLogin, clearLocal, signOut, refreshIdentity }
}
