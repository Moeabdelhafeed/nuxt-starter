/**
 * Per-request cache lookup. Nuxt's default only reads the payload while
 * hydrating, so two components calling the same keyed fetch during one SSR
 * render each hit the API. `cause: 'initial'` covers exactly the duplicate-call
 * case — `watch` and `refresh()` still go to the network.
 */
const cachedForKey = (key, nuxtApp, ctx) =>
  ctx.cause === 'initial'
    ? (nuxtApp.payload.data[key] ?? nuxtApp.static.data[key])
    : undefined

/**
 * SSR-friendly data fetcher. Dispatches to `useSanctumFetch` when
 * `app_users=true`, else to `useFetch` against `$publicApi` (same header set,
 * no Bearer).
 *
 * Shared-key calls are deduped: `dedupe: 'defer'` reuses an in-flight request
 * instead of firing (and cancelling) a second one, and `getCachedData` reuses
 * an already-resolved one. Without both, a composable used by N components
 * costs N API calls per render and burns through Laravel's `throttle:api`.
 *
 * Mirrors the `useFetch` signature so all native options
 * (key, watch, transform, default, lazy, server, etc.) work as expected.
 *
 * @type {typeof import('#app').useFetch}
 */
export const useApiFetch = (url, options = {}) => {
  const shared = { dedupe: 'defer', getCachedData: cachedForKey, ...options }

  // Read the flag off state directly: `useAuthConfig()` itself builds on `useLang`, which
  // fetches through here — going through it would recurse.
  if (useState('config').value?.app_users !== false) {
    return useSanctumFetch(url, shared)
  }
  return useFetch(url, { $fetch: useNuxtApp().$publicApi, ...shared })
}
