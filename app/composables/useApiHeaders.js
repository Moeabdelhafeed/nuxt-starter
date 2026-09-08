/**
 * The header set every request to the API carries, built from the same cookies on
 * server and client: device identity, and the locale the translations mode reads from.
 * `X-API-TOKEN` is not here on purpose — the Nitro proxy adds it server-side.
 *
 * Used by every transport ($publicApi, the Sanctum client hook, useApiFetch, Echo) so
 * the rule lives in one place.
 */
export const useApiHeaders = () => {
  const { translationsMode } = useRuntimeConfig().public
  const { deviceId, platform, fcmToken } = useDevice()
  const lang = useCookie('lang')
  const i18nLocale = useCookie('i18n_locale')

  const localeCode = () => (translationsMode === 'local'
    ? (i18nLocale.value ?? lang.value?.code ?? 'en')
    : (lang.value?.code ?? 'en'))

  /** Fill `headers` (a Headers instance or plain object) with whatever is missing. */
  const apply = (headers) => {
    const h = headers instanceof Headers ? headers : new Headers(headers ?? undefined)
    if (deviceId.value) h.set('X-Device-Id', deviceId.value)
    if (platform.value) h.set('X-Platform', platform.value)
    if (fcmToken.value && (platform.value === 'ios' || platform.value === 'android')) {
      h.set('X-FCM-Token', fcmToken.value)
    }
    // A caller that sets its own locale (the translation seeder) keeps it.
    if (!h.has('Accept-Language')) h.set('Accept-Language', localeCode())
    return h
  }

  /** Plain-object form for `$fetch` calls made outside an interceptor. */
  const headers = (extra = {}) => Object.fromEntries(apply(extra).entries())

  return { apply, headers, localeCode }
}
