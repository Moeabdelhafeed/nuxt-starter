/**
 * CMS pages from the public, localized endpoints (gated by backend `HAS_PAGES`).
 * Page shape: { id, slug, name, content, image } — `image` is the backend Image object
 * ({ id, url, type, blurhash, image_api }) or null.
 *
 * `usePages()`      → all active pages (`GET /api/pages`), with a `bySlug` helper.
 * `usePage(slug)`   → one page (`GET /api/pages/{slug}`).
 *
 * Both are SSR-friendly, deduped, and refetch when the language changes.
 */
export const usePages = () => {
  const lang = useCookie('lang')
  const i18nLocale = useCookie('i18n_locale')

  const { data, pending, error, refresh } = useApiFetch('/api/pages', {
    key: 'pages',
    transform: (res) => res?.data ?? [],
    default: () => [],
    watch: [lang, i18nLocale],
  })

  const pages = computed(() => data.value ?? [])
  const bySlug = (slug) => pages.value.find((p) => p.slug === slug)

  return { pages, bySlug, pending, error, refresh }
}

/** Awaitable: `const { page } = await usePage(slug)` blocks until the page is known. */
export const usePage = (slug) => {
  const lang = useCookie('lang')
  const i18nLocale = useCookie('i18n_locale')

  const asyncData = useApiFetch(() => `/api/pages/${toValue(slug)}`, {
    key: `page-${toValue(slug)}`,
    transform: (res) => res?.data ?? null,
    default: () => null,
    watch: [lang, i18nLocale],
  })

  const page = computed(() => asyncData.data.value ?? null)
  const result = { page, pending: asyncData.pending, error: asyncData.error, refresh: asyncData.refresh }
  return Object.assign(asyncData.then((resolved) => ({ ...result, ...resolved })), result)
}
