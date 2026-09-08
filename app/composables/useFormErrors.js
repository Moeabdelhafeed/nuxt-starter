/**
 * Turns a failed API call into what a form shows: field errors inline, everything else
 * as one message above the submit button. Field errors win — the 422 summary Laravel puts
 * in `message` ("The identifier field is required. (and 1 more error)") is noise once the
 * fields themselves are marked.
 *
 * `fields` lists the inputs the form renders. An error keyed by anything else (a header
 * check like `device_id`, or a field this project's config hides) would otherwise be
 * invisible, so it is folded into the message.
 */
export const useFormErrors = (fields = []) => {
  const { t } = useLang('web', 'general')
  const errors = ref({})
  const message = ref('')

  const clear = () => {
    errors.value = {}
    message.value = ''
  }

  const fallback = (status) => {
    if (status === 401) return t('error_unauthenticated', 'Please sign in again.', 'يرجى تسجيل الدخول مجددًا.')
    if (status === 403) return t('error_forbidden', 'You are not allowed to do that.', 'غير مسموح لك بذلك.')
    if (status === 404) return t('error_not_found', 'Not found.', 'غير موجود.')
    if (status === 429) return t('error_too_many_requests', 'Too many attempts. Please wait a moment.', 'محاولات كثيرة. انتظر قليلًا.')
    if (!status) return t('error_network', 'Could not reach the server. Check your connection.', 'تعذّر الوصول إلى الخادم. تحقق من اتصالك.')
    return t('error_generic', 'Something went wrong. Please try again.', 'حدث خطأ ما. حاول مجددًا.')
  }

  const set = (err) => {
    const status = err?.status ?? err?.response?.status
    const data = err?.data ?? {}
    const all = (data.errors && typeof data.errors === 'object') ? data.errors : {}

    const known = {}
    const stray = []
    for (const [key, value] of Object.entries(all)) {
      const list = Array.isArray(value) ? value : [String(value)]
      if (fields.includes(key)) known[key] = list
      else stray.push(...list)
    }
    errors.value = known

    if (stray.length) message.value = stray.join(' ')
    else if (Object.keys(known).length) message.value = ''
    // Laravel's own 401/404/429 bodies carry a bare `message` outside the envelope —
    // still the best text we have, unless it is the framework's terse default.
    else if (data.message && status !== 401 && status !== 404) message.value = data.message
    else message.value = fallback(status)
  }

  const first = (field) => errors.value[field]?.[0]

  return { errors, message, set, clear, first }
}
