const FIVE_YEARS = 60 * 60 * 24 * 365 * 5

const detectPlatform = (ua = '') => {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'web'
}

/**
 * Server-side, `useCookie` re-parses the incoming request header on every call, so a
 * value written by one caller is invisible to the next — on a first visit each
 * `useDevice()` would mint its own UUID and the API calls in that same render would go
 * out under different devices. Writing the value back onto the request makes every
 * later read in this render agree.
 */
const remember = (name, value) => {
  if (!import.meta.server) return
  const headers = useRequestEvent()?.node?.req?.headers
  if (!headers) return
  const entry = `${name}=${encodeURIComponent(value)}`
  headers.cookie = headers.cookie ? `${headers.cookie}; ${entry}` : entry
}

export const useDevice = () => {
  // The device id is a guest's whole identity, so it only travels over HTTPS in production.
  const opts = { maxAge: FIVE_YEARS, sameSite: 'lax', secure: useRequestURL().protocol === 'https:' }
  const deviceId = useCookie('device_id', opts)
  const platform = useCookie('device_platform', opts)
  const fcmToken = useCookie('fcm_token', opts)

  // Generated during SSR too, not client-only: Laravel's IdentifyDevice middleware
  // 422s any request missing X-Device-Id, so a first visit with no cookie would
  // fail every server-rendered fetch (config, pages, app-settings, translations).
  if (!deviceId.value) {
    deviceId.value = useState('device-id', () => crypto.randomUUID()).value
    remember('device_id', deviceId.value)
  }
  if (!platform.value) {
    platform.value = detectPlatform(
      import.meta.client
        ? navigator.userAgent
        : useRequestHeaders(['user-agent'])['user-agent'],
    )
    remember('device_platform', platform.value)
  }

  /** `{ device_name, platform }` for login bodies — a readable label for the devices list. */
  const deviceMeta = () => {
    if (!import.meta.client) return { device_name: 'Web', platform: 'web' }
    const ua = navigator.userAgent || ''
    const uaData = navigator.userAgentData
    const browser = uaData?.brands?.find((b) => !/Not.?A.?Brand/i.test(b.brand))?.brand
      ?? (/Edg\//.test(ua) ? 'Edge'
        : /Chrome\//.test(ua) ? 'Chrome'
        : /Firefox\//.test(ua) ? 'Firefox'
        : /Safari\//.test(ua) ? 'Safari'
        : 'Browser')
    const os = uaData?.platform
      ?? (/Windows/.test(ua) ? 'Windows'
        : /Mac OS X|Macintosh/.test(ua) ? 'Mac'
        : /Android/.test(ua) ? 'Android'
        : /iPhone|iPad|iOS/.test(ua) ? 'iOS'
        : /Linux/.test(ua) ? 'Linux'
        : 'Unknown')
    return { device_name: `${browser} on ${os}`, platform: platform.value || 'web' }
  }

  return { deviceId, platform, fcmToken, deviceMeta }
}
