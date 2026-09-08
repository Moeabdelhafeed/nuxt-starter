let appInstance = null

/**
 * Social sign-in through the Firebase Web SDK. The SDK is imported on first use, not at
 * module load: it is ~100 KB and most visitors never press a social button.
 */
export const useFirebaseAuth = () => {
  const config = useRuntimeConfig().public.firebase

  const ensureApp = async () => {
    if (appInstance) return appInstance
    if (!config?.apiKey) throw new Error('Firebase config missing — set NUXT_PUBLIC_FIREBASE_* env vars')
    const { initializeApp, getApps, getApp } = await import('firebase/app')
    appInstance = getApps().length ? getApp() : initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      appId: config.appId,
    })
    return appInstance
  }

  const buildProvider = (auth, providerId) => {
    switch (providerId) {
      case 'google.com': return new auth.GoogleAuthProvider()
      case 'facebook.com': return new auth.FacebookAuthProvider()
      case 'twitter.com': return new auth.TwitterAuthProvider()
      case 'github.com': return new auth.GithubAuthProvider()
      case 'apple.com':
      case 'microsoft.com':
      case 'yahoo.com': return new auth.OAuthProvider(providerId)
      default: throw new Error(`Unknown provider: ${providerId}`)
    }
  }

  const signInWithProvider = async (providerId) => {
    const app = await ensureApp()
    const firebaseAuth = await import('firebase/auth')
    const provider = buildProvider(firebaseAuth, providerId)
    const result = await firebaseAuth.signInWithPopup(firebaseAuth.getAuth(app), provider)
    const idToken = await result.user.getIdToken()
    return { idToken, user: result.user, providerId }
  }

  return { signInWithProvider }
}
