/**
 * When this browser's token is revoked from another device (or by a single-session
 * login elsewhere), the API broadcasts `device.revoked` with the token id. If it is ours,
 * drop the session locally and go back to sign-in — the token is already dead.
 */
export default defineNuxtPlugin(() => {
  const { user, tokenId, clearLocal } = useAuthSession()
  const { toast } = useToast()
  const { t } = useLang('web', 'general')
  const { $echo } = useNuxtApp()
  if (!$echo) return

  let activeUserId = null

  const handleRevoke = async (event) => {
    const local = Number(tokenId.value)
    if (!local || Number(event?.token_id) !== local) return
    await clearLocal()
    toast({ title: t('signed_out_elsewhere', 'You were signed out from another device.', 'تم تسجيل خروجك من جهاز آخر.'), variant: 'destructive' })
    await navigateTo({ name: 'login' })
  }

  const subscribe = (uid) => {
    activeUserId = uid
    $echo.private(`user.${uid}`).listen('.device.revoked', handleRevoke)
  }

  const unsubscribe = () => {
    if (activeUserId) $echo.leave(`user.${activeUserId}`)
    activeUserId = null
  }

  watch(
    () => (user.value?.data?.is_guest ? null : user.value?.data?.id ?? null),
    (next) => {
      if (activeUserId === next) return
      unsubscribe()
      if (next) subscribe(next)
    },
    { immediate: true },
  )
})
