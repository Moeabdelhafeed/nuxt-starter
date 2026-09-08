export default defineNuxtPlugin(async (nuxtApp) => {
  // SSR already fetched both and shipped them in the payload — refetching on
  // hydration doubles every page load against Laravel's throttle:api bucket.
  if (import.meta.client && nuxtApp.payload.serverRendered) return

  const cfgState = useState('config', () => ({}))
  const user = useSanctumUser()
  const { baseUrl } = useRuntimeConfig().public
  const { headers } = useApiHeaders()
  const lang = useCookie('lang')
  const i18nLocale = useCookie('i18n_locale')

  // First visit has no `lang` cookie, so without this every request in the same render
  // would go out as `en` while the layout takes its dir/lang from the backend's default
  // language — an Arabic-first site rendering rtl with English copy. Resolving the
  // language here, before any other fetch, means one consistent locale from the start.
  if (!lang.value) {
    try {
      // The API rejects a request with no Accept-Language, so the discovery call sends
      // one; the list it returns is the same whichever locale asks for it.
      const res = await $fetch('/api/languages', {
        baseURL: baseUrl,
        headers: headers({ 'Accept-Language': 'en' }),
      })
      const languages = res?.data ?? res ?? []

      // Prefer what the visitor's browser asks for, when the project actually has it.
      // `Accept-Language` is ranked — `ar,en;q=0.8` means Arabic first — so the list is
      // sorted by q and walked in *that* order. Searching the project's languages instead
      // hands an Arabic speaker whichever locale the backend happens to list first, since
      // their header mentions English too.
      const preferred = (import.meta.server ? useRequestHeaders(['accept-language'])['accept-language'] : navigator.language)
      const wanted = String(preferred ?? '')
        .split(',')
        .map((part) => {
          const [tag, ...params] = part.split(';')
          const q = params.map((entry) => entry.trim()).find((entry) => entry.startsWith('q='))
          return { code: tag.trim().split('-')[0].toLowerCase(), q: q ? Number(q.slice(2)) : 1 }
        })
        .filter((entry) => entry.code && !Number.isNaN(entry.q))
        .sort((a, b) => b.q - a.q)

      const fallback = wanted
        .map(({ code }) => languages.find((l) => String(l.code).toLowerCase() === code))
        .find(Boolean)
        ?? languages.find((l) => l.is_default)
        ?? languages[0]
        ?? null

      if (fallback) {
        lang.value = fallback
        i18nLocale.value = fallback.code

        // Nuxt's useCookie re-parses the *incoming* request header on every call, so a
        // value written here is invisible to the composables that read it later in this
        // same render (they would still see no language). Writing it back onto the
        // request makes the rest of the pass behave as if the browser had sent it.
        if (import.meta.server) {
          const jar = useRequestEvent()?.node?.req?.headers
          if (jar) {
            const encoded = `lang=${encodeURIComponent(JSON.stringify(fallback))}; i18n_locale=${fallback.code}`
            jar.cookie = jar.cookie ? `${jar.cookie}; ${encoded}` : encoded
          }
        }
      }

      // useLang() reads the same key through useApiFetch — hand it this response so the
      // list is not fetched twice per render.
      nuxtApp.payload.data.languages = res
    } catch (err) {
      // 404 = the backend has HAS_TRANSLATIONS off; the app then runs on its inline defaults.
      if (err?.status !== 404) console.warn('[bootstrap-config] failed to resolve default language', err?.message ?? err)
    }
  }

  // nuxt-auth-sanctum's own tokenStorage only gets wired up on the router's
  // `page:loading:start` hook, which fires after plugins run — so on every SSR render
  // (first load or a full navigation) `useSanctumAppConfig().tokenStorage` is still
  // undefined here, and this fetch would silently go out unauthenticated even for a
  // logged-in visitor. Read the same cookie the module itself stores the token in.
  const bearer = useCookie('sanctum.token.cookie', { readonly: true }).value

  // `/api/user` is asked for even with no token: a guest has no token at all and is
  // resolved from X-Device-Id alone, so this is the only way to know one is signed in.
  const [cfgRes, userRes] = await Promise.allSettled([
    $fetch('/api/config', { baseURL: baseUrl, headers: headers() }),
    $fetch('/api/user', { baseURL: baseUrl, headers: headers(bearer ? { Authorization: `Bearer ${bearer}` } : {}) }),
  ])

  if (cfgRes.status === 'fulfilled') {
    cfgState.value = cfgRes.value?.data ?? cfgRes.value ?? {}
  } else {
    console.warn('[bootstrap-config] failed to load /api/config', cfgRes.reason?.message ?? cfgRes.reason)
    cfgState.value = {}
  }

  if (userRes.status === 'fulfilled') {
    user.value = userRes.value ?? null
  } else if (userRes.reason?.status !== 401) {
    console.warn('[bootstrap-config] failed to load /api/user', userRes.reason?.message ?? userRes.reason)
  }
})
