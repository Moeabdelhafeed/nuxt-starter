export default defineAppConfig({
  echo: {
    interceptors: {
      onRequest: async (app, ctx) => {
        ctx.options.headers = useApiHeaders().apply(ctx.options.headers)

        const sanctum = useSanctumAppConfig()
        const token = await sanctum?.tokenStorage?.get?.(app)
        if (token) ctx.options.headers.set('Authorization', `Bearer ${token}`)
      },
    },
  },
})
