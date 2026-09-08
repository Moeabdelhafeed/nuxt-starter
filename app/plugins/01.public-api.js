export default defineNuxtPlugin((nuxtApp) => {
  const { baseUrl } = useRuntimeConfig().public
  const { apply } = useApiHeaders()

  /** @type {import('ofetch').$Fetch} */
  const publicApi = $fetch.create({
    baseURL: baseUrl,
    onRequest({ options }) {
      const headers = apply(options.headers)

      // The production host blocks real PUT/PATCH/DELETE — send them as POST
      // with an X-HTTP-Method-Override header. Laravel's kernel resolves the
      // real verb from the header, so routes stay Route::put/delete.
      const method = String(options.method ?? 'GET').toUpperCase()
      if (method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
        headers.set('X-HTTP-Method-Override', method)
        options.method = 'POST'
      }

      options.headers = headers
    },
    // Same app-wide error handling the Sanctum client gets (see 04.api-errors.client.js).
    onResponseError: (ctx) => nuxtApp.callHook('api:error:response', ctx),
    onRequestError: (ctx) => nuxtApp.callHook('api:error:request', ctx),
  })

  return { provide: { publicApi } }
})
