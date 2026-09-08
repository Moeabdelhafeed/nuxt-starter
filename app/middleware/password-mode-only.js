export default defineNuxtRouteMiddleware(() => {
  const { cfg } = useAuthFlags()
  if (cfg.value?.auth_mode === 'otp') {
    return navigateTo({ name: 'login' })
  }
})
