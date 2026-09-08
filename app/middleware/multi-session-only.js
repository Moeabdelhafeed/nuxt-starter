export default defineNuxtRouteMiddleware(() => {
  const { cfg } = useAuthFlags()
  if (cfg.value && Object.keys(cfg.value).length && !cfg.value.multi_session) {
    return navigateTo('/profile')
  }
})
