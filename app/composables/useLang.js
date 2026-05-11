const seededKeys = new Set()

export const useLang = (group = 'web') => {
  const lang = useCookie('lang', { default: () => null })
  const transMode = useRuntimeConfig().public.translationsMode ?? 'remote'
  const i18n = (() => {
    try {
      return useI18n()
    } catch {
      return null
    }
  })()

  const { data: langsData, refresh: refreshLanguages } = useSanctumFetch('/api/languages', {
    key: 'languages'
  })
  const languages = computed(() => langsData.value?.data ?? [])
  const defaultLanguage = computed(
    () => languages.value.find((l) => l.is_default) ?? languages.value[0] ?? null
  )

  watch(defaultLanguage, (def) => {
    if (!lang.value && def) lang.value = def
  }, { immediate: true })

  if (i18n) {
    watch(() => lang.value?.code ?? defaultLanguage.value?.code, async (c) => {
      if (!c) return
      try {
        if (typeof i18n.setLocale === 'function') await i18n.setLocale(c)
        else if (i18n.locale && typeof i18n.locale === 'object' && 'value' in i18n.locale) i18n.locale.value = c
      } catch {}
    }, { immediate: true })
  }

  const code = computed(() => lang.value?.code ?? defaultLanguage.value?.code ?? 'en')
  const dir = computed(() => lang.value?.direction ?? defaultLanguage.value?.direction ?? 'ltr')

  const {
    data: transData,
    refresh: refreshTranslations,
    pending: translationsPending,
  } = useSanctumFetch('/api/translations', {
    key: `translations-${group}`,
    query: { group },
    watch: [code],
  })
  const translations = computed(() => transData.value?.data ?? {})

  const client = useSanctumClient()

  const seedTranslation = async (key, defaults) => {
    if (seededKeys.has(key)) return
    const entries = Object.entries(defaults).filter(([, v]) => v !== undefined && v !== null)
    if (!entries.length) return
    seededKeys.add(key)
    try {
      if (transMode === 'local') {
        await $fetch('/api/dev-translations', {
          method: 'POST',
          body: { key, defaults: Object.fromEntries(entries) },
        })
        if (i18n) {
          for (const [locale, value] of entries) {
            i18n.mergeLocaleMessage?.(locale, { [key]: value })
          }
        }
      } else {
        await Promise.all(entries.map(([locale, value]) => client('/api/translations', {
          method: 'POST',
          headers: { 'Accept-Language': locale },
          body: { translations: { [key]: value }, group },
        })))
        refreshTranslations()
      }
    } catch {
      seededKeys.delete(key)
    }
  }

  // Signatures supported:
  //   t(key)
  //   t(key, defaultEn)
  //   t(key, defaultEn, defaultAr)
  //   t(key, defaultEn, defaultAr, params)
  //   t(key, defaultEn, params)
  //   t(key, { en, ar, fr, ... })
  //   t(key, { en, ar, fr, ... }, params)
  const t = (key, second, third, fourth) => {
    let defaults = {}
    let params

    if (second !== undefined) {
      if (typeof second === 'string') {
        defaults.en = second
        if (typeof third === 'string') {
          defaults.ar = third
          params = fourth
        } else {
          params = third
        }
      } else if (typeof second === 'object' && !Array.isArray(second)) {
        defaults = { ...second }
        params = third
      }
    }

    let value, ready
    if (transMode === 'local' && i18n) {
      ready = true
      const localeMsgs = i18n.getLocaleMessage?.(code.value) ?? {}
      value = localeMsgs[key]
    } else {
      ready = transData.value !== null && transData.value !== undefined
      value = ready ? translations.value[key] : undefined
    }
    const has = typeof value === 'string' && value !== ''
    let str
    if (has) str = value
    else if (defaults[code.value] !== undefined && defaults[code.value] !== null) str = defaults[code.value]
    else str = key

    if (ready && !has && Object.keys(defaults).length && import.meta.client) {
      seedTranslation(key, defaults)
    }

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(`:${k}`, String(v))
      }
    }
    return str
  }

  const setLanguage = (codeOrLang) => {
    const target =
      typeof codeOrLang === 'string'
        ? languages.value.find((l) => l.code === codeOrLang)
        : codeOrLang
    if (target) lang.value = target
  }

  return {
    lang,
    languages,
    defaultLanguage,
    code,
    dir,
    translations,
    translationsPending,
    t,
    setLanguage,
    refreshLanguages,
    refreshTranslations,
  }
}
