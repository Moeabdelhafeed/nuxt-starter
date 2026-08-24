const buildHeaders = (deviceId, platform, fcmToken, langCode, bearer) => {
  const h = {}
  if (deviceId) h['X-Device-Id'] = deviceId
  if (platform) h['X-Platform'] = platform
  if (fcmToken && (platform === 'ios' || platform === 'android')) h['X-FCM-Token'] = fcmToken
  if (langCode) h['Accept-Language'] = langCode
  if (bearer) h['Authorization'] = `Bearer ${bearer}`
  return h
}

export default defineNuxtPlugin(async (nuxtApp) => {
  const cfgState = useState('config', () => ({}))
  const user = useSanctumUser()
  const { baseUrl, translationsMode } = useRuntimeConfig().public
  const { deviceId, platform, fcmToken } = useDevice()
  const lang = useCookie('lang')
  const i18nLocale = useCookie('i18n_locale')

  const code = translationsMode === 'local'
    ? (i18nLocale.value ?? lang.value?.code ?? 'en')
    : (lang.value?.code ?? 'en')

  const sanctumAppCfg = useSanctumAppConfig()
  const bearer = await sanctumAppCfg?.tokenStorage?.get?.(nuxtApp).catch(() => null)

  const headers = buildHeaders(deviceId.value, platform.value, fcmToken.value, code, bearer)

  const [cfgRes, userRes] = await Promise.allSettled([
    $fetch('/api/config', { baseURL: baseUrl, headers }),
    $fetch('/api/user', { baseURL: baseUrl, headers }),
  ])

  if (cfgRes.status === 'fulfilled') {
    cfgState.value = cfgRes.value?.data ?? cfgRes.value ?? {}
  } else {
    console.warn('[bootstrap-config] failed to load /api/config', cfgRes.reason?.message ?? cfgRes.reason)
    cfgState.value = {}
  }

  if (userRes.status === 'fulfilled') {
    user.value = userRes.value ?? null
  } else {
    console.warn('[bootstrap-config] failed to load /api/user', userRes.reason?.message ?? userRes.reason)
  }
})
