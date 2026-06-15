export default defineNuxtRouteMiddleware(async () => {
  const { appUsers, appGuests, cfg, refresh } = useAuthConfig()
  if (!cfg.value || !Object.keys(cfg.value).length) {
    await refresh()
  }
  // No auth system at all (app_users + app_guests both off) — the app is a
  // public content app with no user concept. Let the route through.
  if (!appUsers.value && !appGuests.value) {
    return
  }
  const { isAuthenticated } = useSanctumAuth()
  if (!isAuthenticated.value) {
    return navigateTo({ name: 'login' })
  }
})
