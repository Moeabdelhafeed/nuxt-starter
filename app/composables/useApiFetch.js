/**
 * SSR-friendly data fetcher. Dispatches to `useSanctumFetch` when
 * `app_users=true`, else to `useFetch` configured against `$publicApi`'s
 * baseURL with the same header set.
 *
 * Mirrors the `useFetch` signature so all native options
 * (key, watch, transform, default, lazy, server, etc.) work as expected.
 *
 * @type {typeof import('#app').useFetch}
 */
export const useApiFetch = (url, options = {}) => {
  const { appUsers } = useAuthConfig()
  if (appUsers.value) {
    return useSanctumFetch(url, options)
  }
  const { baseUrl, translationsMode } = useRuntimeConfig().public
  const { deviceId, platform, fcmToken } = useDevice()
  const lang = useCookie('lang')
  const i18nLocale = useCookie('i18n_locale')
  return useFetch(url, {
    baseURL: baseUrl,
    onRequest({ options: opts }) {
      const headers = new Headers(opts.headers)
      if (deviceId.value) headers.set('X-Device-Id', deviceId.value)
      if (platform.value) headers.set('X-Platform', platform.value)
      if (fcmToken.value && (platform.value === 'ios' || platform.value === 'android')) {
        headers.set('X-FCM-Token', fcmToken.value)
      }
      if (!headers.has('Accept-Language')) {
        const code = translationsMode === 'local'
          ? (i18nLocale.value ?? lang.value?.code ?? 'en')
          : (lang.value?.code ?? 'en')
        headers.set('Accept-Language', code)
      }
      opts.headers = headers
    },
    ...options,
  })
}
