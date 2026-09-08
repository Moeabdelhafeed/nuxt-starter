/**
 * One place for the failures no form can handle on its own: a session that died under
 * the user, rate limiting, server crashes, no network. Forms still receive the error and
 * render field messages; this only adds the app-wide notice and, for a dead session, the
 * trip back to the sign-in page.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const { toast } = useToast()
  const { t } = useLang('web', 'general')
  let lastNoticeAt = 0

  const notice = (title, description) => {
    // A page that fires several requests at once should not stack the same notice.
    const now = Date.now()
    if (now - lastNoticeAt < 1500) return
    lastNoticeAt = now
    toast({ title, description, variant: 'destructive' })
  }

  const onResponseError = async (ctx) => {
    const status = ctx?.response?.status
    if (status === 401) {
      const { isMember, clearLocal } = useAuthSession()
      // A guest never had a token, so a 401 for a guest is not an expired session.
      if (!isMember.value) return
      await clearLocal()
      notice(
        t('session_expired', 'Your session has expired.', 'انتهت صلاحية جلستك.'),
        t('sign_in_again', 'Please sign in again.', 'يرجى تسجيل الدخول مجددًا.'),
      )
      await navigateTo({ name: 'login' })
      return
    }
    if (status === 429) {
      notice(t('error_too_many_requests', 'Too many attempts. Please wait a moment.', 'محاولات كثيرة. انتظر قليلًا.'))
      return
    }
    if (status >= 500) {
      notice(t('error_generic', 'Something went wrong. Please try again.', 'حدث خطأ ما. حاول مجددًا.'))
    }
  }

  const onRequestError = () => {
    notice(t('error_network', 'Could not reach the server. Check your connection.', 'تعذّر الوصول إلى الخادم. تحقق من اتصالك.'))
  }

  nuxtApp.hook('sanctum:error:response', onResponseError)
  nuxtApp.hook('sanctum:error:request', onRequestError)
  nuxtApp.hook('api:error:response', onResponseError)
  nuxtApp.hook('api:error:request', onRequestError)
})
