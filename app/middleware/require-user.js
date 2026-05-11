export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = useSanctumAuth()
  if (!isAuthenticated.value) {
    return navigateTo({ name: 'login' })
  }
})
