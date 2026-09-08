/**
 * Catch-all proxy to the Laravel API.
 *
 * Every client/SSR request to `/api/*` lands here and is forwarded to the real
 * Laravel host (`runtimeConfig.apiBaseUrl`). The secret `X-API-TOKEN` is
 * injected SERVER-SIDE here — it lives in private runtimeConfig and never ships
 * to the browser bundle.
 *
 * Headers the client set (Authorization Bearer, Accept-Language, X-Device-Id,
 * X-Platform, X-FCM-Token, X-HTTP-Method-Override) pass through, so per-user auth
 * and device context still reach Laravel. Browser cookies do not: the API is
 * bearer-only, and the token cookie has no business in upstream logs.
 *
 * Literal routes (e.g. server/api/dev-translations.post.js) take priority over
 * this catch-all, so dev-only endpoints stay local.
 */

// Public, read-only, locale-scoped content: identical for every visitor, so one
// upstream call per locale per minute is enough. Keeps a page refresh (7 API
// calls per render) from eating Laravel's 60/min throttle. `/api/translations`
// is cached in production only: in dev the client seeds missing keys and calls
// refreshTranslations(), which a stale cache would hide for up to a minute.
const CACHED_PATHS = [
  // Deliberately not `/api/media`: the client seeds a missing key by uploading it, and a
  // cached list would still report it missing on the next load — so the same file uploads
  // again and again, each time under a new URL.
  ...(import.meta.dev ? [] : [/^\/api\/translations$/, /^\/api\/app-settings$/, /^\/api\/pages(\/[^/]+)?$/]),
]

/**
 * One cached upstream call per path *per locale*.
 *
 * Two things here are load-bearing, and both were learned the hard way in production:
 *
 * The locale is an explicit argument rather than something read back out of the headers,
 * so the key is derived from the same value the request is made with and the two cannot
 * drift apart.
 *
 * And the key is a plain slug. Nitro writes each entry as a file path, so a key holding a
 * URL — `?`, `&`, `=` and all — gets mangled, and two locales of the same endpoint
 * collapse onto one entry. `/api/translations?group=web` is exactly that shape: whichever
 * language warmed the cache was then served to everyone, in production only, where this
 * cache is the one thing that differs from dev.
 */
const fetchPublic = defineCachedFunction(
  (url, locale, headers) => $fetch(url, { headers }),
  {
    name: 'public-api',
    maxAge: 60,
    getKey: (url, locale) => `${url.replace(/[^a-z0-9]+/gi, '-')}-${locale}`,
  },
)

/**
 * Laravel matches `Accept-Language` literally against a language code, so `en` resolves to
 * English while `en-US,en;q=0.9` — what a browser actually sends — matches nothing and
 * falls back to the default language. Everything upstream leaves here as a bare code.
 */
const primaryLanguage = (header) => String(header ?? '')
  .split(',')[0]
  .split(';')[0]
  .trim()
  .split('-')[0]
  .toLowerCase()

// Only a real language code may name a cache entry — otherwise every made-up
// Accept-Language value would grow the cache by one full payload.
const cacheLocale = (code) => (/^[a-z]{2,3}$/.test(code) ? code : 'en')

export default defineEventHandler(async (event) => {
  const { xApiToken, apiBaseUrl, trustProxy } = useRuntimeConfig(event)

  // Nitro routes on the raw path, so `/api/../login` still lands here and undici would
  // collapse the dot-segments into a request for Laravel's admin login. Normalise once
  // and refuse anything that leaves the API prefix.
  const { pathname, search } = new URL(event.path, 'http://localhost')
  if (!pathname.startsWith('/api/')) throw createError({ statusCode: 404 })
  const upstreamPath = pathname + search

  // Laravel keys its rate limits on the client IP, and it trusts X-Forwarded-For — so the
  // value has to be one the caller cannot choose. Straight from the socket when this
  // server is exposed directly; the last hop of the header when a trusted reverse proxy
  // in front of it appends the real address (NUXT_TRUST_PROXY=true).
  const forwarded = getRequestHeader(event, 'x-forwarded-for')
  const clientIp = trustProxy && forwarded
    ? forwarded.split(',').at(-1).trim()
    : event.node.req.socket?.remoteAddress

  // Laravel trusts proxies for X-Forwarded-Host, so left alone the API builds its asset
  // URLs from *this* origin: `image_api` comes back as http://localhost:3000/... and every
  // image 404s against Nuxt. h3 derives that header from the incoming request, so it has
  // to be pinned on the request itself — an override in `headers` below is ignored.
  // Every hint about this origin has to go (host, port, proto), not just the host.
  const apiUrl = new URL(apiBaseUrl)
  const incomingHeaders = event.node.req.headers
  delete incomingHeaders['x-forwarded-port']
  delete incomingHeaders['x-forwarded-proto']
  delete incomingHeaders['x-forwarded-for']
  delete incomingHeaders.cookie
  incomingHeaders['x-forwarded-host'] = apiUrl.host
  incomingHeaders.host = apiUrl.host

  // Without an explicit JSON Accept, Laravel answers an unauthenticated request with a
  // 302 to its own /login page and renders 403/404 as HTML. ofetch only sets Accept when
  // it sends a body, so a plain GET would get the redirect.
  incomingHeaders.accept = 'application/json'

  const headers = {
    'X-API-TOKEN': xApiToken,
    ...(clientIp ? { 'X-Forwarded-For': clientIp } : {}),
  }

  // Reads only: a write carries its locale on purpose — the translation seeder POSTs the
  // same key once per locale with a forced header.
  const language = primaryLanguage(incomingHeaders['accept-language'])
  if (language && event.method === 'GET') incomingHeaders['accept-language'] = language

  if (event.method === 'GET' && CACHED_PATHS.some((re) => re.test(pathname))) {
    const incoming = getRequestHeaders(event)
    // Only `group` can vary a cached read; any other query string would be a new entry.
    const group = new URLSearchParams(search).get('group')
    const cachedPath = pathname + (group && /^[a-z0-9_-]{1,32}$/i.test(group) ? `?group=${group}` : '')
    return fetchPublic(apiBaseUrl + cachedPath, cacheLocale(language), {
      ...headers,
      'Accept-Language': language,
      Accept: 'application/json',
      'X-Device-Id': incoming['x-device-id'] ?? '',
      'X-Platform': incoming['x-platform'] ?? '',
    })
  }

  return proxyRequest(event, apiBaseUrl + upstreamPath, { headers })
})
