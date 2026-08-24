/**
 * Catch-all proxy to the Laravel API.
 *
 * Every client/SSR request to `/api/*` lands here and is forwarded to the real
 * Laravel host (`runtimeConfig.apiBaseUrl`). The secret `X-API-TOKEN` is
 * injected SERVER-SIDE here — it lives in private runtimeConfig and never ships
 * to the browser bundle.
 *
 * All other headers the client set (Authorization Bearer, Accept-Language,
 * X-Device-Id, X-Platform, X-FCM-Token, X-HTTP-Method-Override) pass through
 * untouched, so per-user auth and device context still reach Laravel.
 *
 * Literal routes (e.g. server/api/dev-translations.post.js) take priority over
 * this catch-all, so dev-only endpoints stay local.
 */
export default defineEventHandler((event) => {
  const { xApiToken, apiBaseUrl } = useRuntimeConfig(event)
  return proxyRequest(event, apiBaseUrl + event.path, {
    headers: { 'X-API-TOKEN': xApiToken },
  })
})
