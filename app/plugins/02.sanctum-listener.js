export default defineNuxtPlugin((nuxtApp) => {
  const { apply } = useApiHeaders()

  nuxtApp.hook('sanctum:request', (_app, ctx) => {
    ctx.options.headers = apply(ctx.options.headers)
  })
})
