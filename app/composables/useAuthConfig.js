export const useAuthConfig = () => {
  const cfgState = useState('config', () => ({}))
  const cfg = computed(() => cfgState.value ?? {})

  const refresh = async () => {
    const { baseUrl, xApiToken, translationsMode } = useRuntimeConfig().public
    const { deviceId, platform, fcmToken } = useDevice()
    const lang = useCookie('lang')
    const i18nLocale = useCookie('i18n_locale')
    const code = translationsMode === 'local'
      ? (i18nLocale.value ?? lang.value?.code ?? 'en')
      : (lang.value?.code ?? 'en')
    const headers = { 'X-API-TOKEN': xApiToken, 'Accept-Language': code }
    if (deviceId.value) headers['X-Device-Id'] = deviceId.value
    if (platform.value) headers['X-Platform'] = platform.value
    if (fcmToken.value && (platform.value === 'ios' || platform.value === 'android')) {
      headers['X-FCM-Token'] = fcmToken.value
    }
    try {
      const res = await $fetch('/api/config', { baseURL: baseUrl, headers })
      cfgState.value = res?.data ?? res ?? {}
    } catch (err) {
      console.warn('[useAuthConfig] refresh failed', err?.message ?? err)
    }
  }

  const identifiers = computed(() => (cfg.value.identifiers?.length ? cfg.value.identifiers : ['email']))
  const isMultiIdentifier = computed(() => identifiers.value.length > 1)
  const hasUsername = computed(() => !!cfg.value.has_username_field)
  const hasEmail = computed(() => !!cfg.value.has_email_field)
  const hasPhone = computed(() => !!cfg.value.has_phone_field)
  const socialProviders = computed(() => cfg.value.social_providers ?? [])
  const socialAuthAvailable = computed(() => !!cfg.value.social_auth_available)
  const maxSocialAccounts = computed(() => cfg.value.max_social_accounts ?? 0)
  const isOtpWhatsapp = computed(() => !!cfg.value.is_otp_whatsapp)
  const multiSession = computed(() => !!cfg.value.multi_session)
  const appUsers = computed(() => cfg.value.app_users !== false)
  const appGuests = computed(() => cfg.value.app_guests !== false)
  const authMode = computed(() => cfg.value.auth_mode ?? 'password')
  const isOtpMode = computed(() => authMode.value === 'otp')

  const labelFor = (k) => {
    const { t } = useLang()
    const en = { email: 'Email', phone: 'Phone', username: 'Username' }
    const ar = { email: 'البريد', phone: 'الهاتف', username: 'اسم المستخدم' }
    return en[k] ? t(`label_${k}`, en[k], ar[k]) : k
  }
  const inputTypeFor = (k) => ({ email: 'email', phone: 'tel', username: 'text' }[k] ?? 'text')
  const placeholderFor = (k) => {
    const { t } = useLang()
    const en = { email: 'm@example.com', phone: '+1234567890', username: 'jdoe' }
    const ar = { email: 'm@example.com', phone: '+9665XXXXXXXX', username: 'jdoe' }
    return en[k] ? t(`placeholder_${k}`, en[k], ar[k]) : ''
  }

  const showsExtraField = (kind) => {
    if (kind === 'username') return hasUsername.value
    if (kind === 'email') return hasEmail.value
    if (kind === 'phone') return hasPhone.value
    return false
  }

  const isExtraRequired = (kind) => {
    if (kind === 'username') return true
    return identifiers.value.includes(kind)
  }

  const identifierLabel = computed(() => {
    const { t } = useLang()
    const parts = identifiers.value.map(labelFor)
    const orWord = t('or', 'or', 'أو')
    let base = parts.length > 1 ? parts.join(` ${orWord} `) : parts[0] ?? labelFor('email')
    if (hasUsername.value && !isOtpMode.value) base += ` ${orWord} ${labelFor('username')}`
    return base
  })

  const identifierInputType = computed(() => {
    if (hasUsername.value && !isOtpMode.value) return 'text'
    if (identifiers.value.length === 1) return inputTypeFor(identifiers.value[0])
    return 'text'
  })

  const identifierPlaceholder = computed(() => {
    const includeUsername = hasUsername.value && !isOtpMode.value
    if (identifiers.value.length === 1 && !includeUsername) {
      return placeholderFor(identifiers.value[0])
    }
    const samples = identifiers.value.map((k) => placeholderFor(k)).filter(Boolean)
    if (includeUsername) samples.push('jdoe')
    return samples.join(' / ')
  })

  return {
    refresh,
    cfg,
    identifiers,
    isMultiIdentifier,
    hasUsername,
    hasEmail,
    hasPhone,
    socialProviders,
    socialAuthAvailable,
    maxSocialAccounts,
    isOtpWhatsapp,
    multiSession,
    appUsers,
    appGuests,
    authMode,
    isOtpMode,
    labelFor,
    inputTypeFor,
    placeholderFor,
    showsExtraField,
    isExtraRequired,
    identifierLabel,
    identifierInputType,
    identifierPlaceholder,
  }
}
