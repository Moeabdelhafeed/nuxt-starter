const FIVE_YEARS = 60 * 60 * 24 * 365 * 5

const detectPlatform = () => {
  if (!import.meta.client) return 'web'
  const ua = navigator.userAgent || ''
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'web'
}

export const useDevice = () => {
  const deviceId = useCookie('device_id', { maxAge: FIVE_YEARS, sameSite: 'lax' })
  const platform = useCookie('device_platform', { maxAge: FIVE_YEARS, sameSite: 'lax' })
  const fcmToken = useCookie('fcm_token', { maxAge: FIVE_YEARS, sameSite: 'lax' })

  if (import.meta.client && !deviceId.value) {
    deviceId.value = crypto.randomUUID()
  }
  if (import.meta.client && !platform.value) {
    platform.value = detectPlatform()
  }

  return { deviceId, platform, fcmToken }
}
