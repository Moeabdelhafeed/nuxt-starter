<template>
  <AuthCard
    :title="appUsers ? t('sign_in', 'Sign in', 'تسجيل الدخول') : t('welcome', 'Welcome', 'مرحبًا')"
    :description="appUsers
      ? (isOtpMode
        ? t('login_otp_description', 'Enter your :field and we will send you a sign-in code.', 'أدخل :field وسنرسل لك رمز الدخول.', { field: identifierLabel.toLowerCase() })
        : t('login_description', 'Enter your :field below to sign in.', 'أدخل :field للدخول.', { field: identifierLabel.toLowerCase() }))
      : t('guest_only_description', 'Continue as guest to browse.', 'تابع كزائر للتصفح.')"
  >
    <FormAlert v-if="passwordReset" variant="success" :message="t('password_reset_done', 'Password updated. Sign in with your new password.', 'تم تحديث كلمة المرور. سجّل الدخول بكلمة المرور الجديدة.')" />

    <form v-if="appUsers" class="grid gap-4" @submit.prevent="onSubmit">
      <IdentifierKindPicker v-model="identifierType" :kinds="identifierTypes" :label="t('sign_in_with', 'Sign in with', 'الدخول عبر')" />

      <FormField id="identifier" :label="labelFor(identifierType)" :error="form.first('identifier')" :hint="identifierHint">
        <template #default="{ field }">
          <IdentifierInput v-model="identifier" :kind="identifierType" v-bind="field" required />
        </template>
      </FormField>

      <p v-if="check.checking.value" class="-mt-2 text-xs text-muted-foreground">{{ t('checking', 'Checking...', 'جارٍ التحقق...') }}</p>
      <FormAlert v-else-if="status === 'suspended'" :message="t('account_suspended', 'This account is suspended. Contact support.', 'هذا الحساب موقوف. تواصل مع الدعم.')" />
      <FormAlert v-else-if="status === 'pending_deletion'" variant="warning" :message="t('account_pending_deletion_hint', 'This account is scheduled for deletion. Signing in restores it.', 'هذا الحساب مجدول للحذف. تسجيل الدخول يستعيده.')" />
      <FormAlert v-else-if="status === 'missing' && !isOtpMode" :message="t('no_account_with_identifier', 'No account with this :field.', 'لا يوجد حساب بهذا :field.', { field: labelFor(identifierType).toLowerCase() })" />
      <FormAlert v-else-if="status === 'active' && !isOtpMode && !hasPasswordOnAccount" variant="warning" :message="t('no_password_use_social', 'This account has no password. Continue with a social provider below.', 'لا توجد كلمة مرور لهذا الحساب. تابع عبر مزوّد اجتماعي أدناه.')" />

      <FormField
        v-if="isOtpMode && status === 'missing'"
        id="name"
        :label="t('name', 'Name', 'الاسم')"
        :error="form.first('name')"
        :hint="t('otp_new_account_hint', 'No account yet — we will create one for you.', 'لا يوجد حساب بعد — سننشئ واحدًا لك.')"
      >
        <template #default="{ field }">
          <Input v-model="name" type="text" autocomplete="name" :placeholder="t('placeholder_name', 'John Doe', 'محمد أحمد')" v-bind="field" required />
        </template>
      </FormField>

      <FormField v-if="!isOtpMode" id="password" :error="form.first('password')">
        <template #label>
          <span class="flex w-full items-center justify-between">
            {{ t('password', 'Password', 'كلمة المرور') }}
            <NuxtLink to="/forgot-password" class="text-xs font-normal text-muted-foreground underline-offset-4 hover:underline">
              {{ t('forgot_password', 'Forgot password?', 'نسيت كلمة المرور؟') }}
            </NuxtLink>
          </span>
        </template>
        <template #default="{ field }">
          <AuthPasswordInput v-model="password" autocomplete="current-password" v-bind="field" required />
        </template>
      </FormField>

      <FormAlert :message="form.message.value" />

      <Button type="submit" class="w-full" :disabled="submitDisabled">
        <LucideLoaderCircle v-if="loading" class="size-4 animate-spin" />
        {{ submitLabel }}
      </Button>
    </form>

    <template v-if="appUsers && socialAuthAvailable && socialProviders.length">
      <div class="flex items-center gap-3" aria-hidden="true">
        <span class="h-px flex-1 bg-border" />
        <span class="text-xs text-muted-foreground">{{ t('or_continue_with', 'Or continue with', 'أو المتابعة عبر') }}</span>
        <span class="h-px flex-1 bg-border" />
      </div>
      <SocialAuthButtons :providers="socialProviders" :loading="loading" @select="onSocial" />
      <FormAlert :message="socialError" />
    </template>

    <template v-if="appGuests">
      <div v-if="appUsers" class="flex items-center gap-3" aria-hidden="true">
        <span class="h-px flex-1 bg-border" />
        <span class="text-xs text-muted-foreground">{{ t('or', 'or', 'أو') }}</span>
        <span class="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" class="w-full" :disabled="loading" @click="continueAsGuest">
        {{ t('continue_as_guest', 'Continue as guest', 'المتابعة كزائر') }}
      </Button>
    </template>

    <template v-if="appUsers && !isOtpMode" #footer>
      <span class="text-muted-foreground">{{ t('no_account', "Don't have an account?", 'ليس لديك حساب؟') }}</span>
      <NuxtLink to="/register" class="font-medium underline-offset-4 hover:underline">{{ t('register', 'Register', 'إنشاء حساب') }}</NuxtLink>
    </template>
  </AuthCard>

  <ConfirmDialog
    v-model:open="restoreDialogOpen"
    :title="t('account_pending_deletion_title', 'Restore account?', 'استعادة الحساب؟')"
    :description="t('account_pending_deletion_body', 'This account is scheduled for deletion. Signing in will restore it.', 'هذا الحساب مجدول للحذف. تسجيل الدخول سيستعيده.')"
    :confirm-label="t('restore_and_login', 'Restore & sign in', 'استعادة وتسجيل الدخول')"
    :loading="loading"
    @confirm="confirmRestore"
  />
</template>

<script setup>
definePageMeta({
  layout: 'auth',
  middleware: ['require-pre-auth'],
  name: 'login',
})

const { t } = useLang('web', 'auth')
useHead({ title: t('sign_in', 'Sign in', 'تسجيل الدخول') })

const {
  identifierLabel, identifierTypes, defaultIdentifierType, labelFor,
  socialAuthAvailable, socialProviders, appUsers, appGuests, isOtpMode,
  isEmailDomainAllowed, allowedEmailDomains,
} = useAuthConfig()
const route = useRoute()
const client = useApi()
const { user, login } = useSanctumAuth()
const { applyLogin, refreshIdentity } = useAuthSession()
const { deviceMeta } = useDevice()
const { toast } = useToast()

const passwordReset = computed(() => route.query.reset === '1')

// Which kind of identifier the box holds. Sent on every request — the API rejects a
// value that does not match its declared type instead of guessing from the string.
const identifierType = ref(defaultIdentifierType.value)
watch(identifierTypes, (list) => {
  if (list.length && !list.includes(identifierType.value)) identifierType.value = list[0]
}, { immediate: true })

const identifier = ref('')
const password = ref('')
const name = ref('')
const loading = ref(false)
const restoreDialogOpen = ref(false)
const socialError = ref('')

const form = useFormErrors(['identifier', 'password', 'name'])
const check = useIdentifierCheck(identifier, identifierType)
const status = check.status
const hasPasswordOnAccount = computed(() => check.result.value?.has_password !== false)

const identifierHint = computed(() => {
  if (identifierType.value !== 'email' || !Array.isArray(allowedEmailDomains.value)) return ''
  return t('allowed_email_domains_hint', 'Accepted: :domains', 'المقبول: :domains', { domains: allowedEmailDomains.value.join(', ') })
})

const submitDisabled = computed(() => {
  if (loading.value || check.checking.value) return true
  if (status.value === 'suspended') return true
  if (isOtpMode.value) return status.value === 'missing' && !name.value
  if (status.value === 'missing') return true
  return status.value === 'active' && !hasPasswordOnAccount.value
})

const submitLabel = computed(() => {
  if (loading.value) {
    return isOtpMode.value ? t('sending', 'Sending...', 'جارٍ الإرسال...') : t('signing_in', 'Signing in...', 'جارٍ تسجيل الدخول...')
  }
  return isOtpMode.value ? t('send_code', 'Send code', 'إرسال الرمز') : t('sign_in', 'Sign in', 'تسجيل الدخول')
})

const validateEmailDomain = () => {
  if (identifierType.value === 'email' && !isEmailDomainAllowed(identifier.value)) {
    form.errors.value = { identifier: [t('email_domain_not_allowed', 'Email must be from: :domains', 'يجب أن يكون البريد من: :domains', { domains: allowedEmailDomains.value.join(', ') })] }
    return false
  }
  return true
}

// A guest identity lives on this device with no token; the module refuses to log in
// while any identity is set, so it is dropped first and replaced by the member.
const clearGuestUser = () => {
  if (user.value?.data?.is_guest) user.value = null
}

const performLogin = async () => {
  form.clear()
  loading.value = true
  try {
    clearGuestUser()
    const res = await login({ identifier: identifier.value, password: password.value, type: identifierType.value, ...deviceMeta() }, true)
    const data = res?.data ?? {}
    if (data.token_id != null) useAuthSession().tokenId.value = String(data.token_id)
    if (data.account_restored) toast({ title: t('account_restored', 'Account restored.', 'تم استعادة الحساب.'), variant: 'success' })
  } catch (error) {
    form.set(error)
  } finally {
    loading.value = false
  }
}

const performOtpRequest = async () => {
  form.clear()
  if (status.value === 'missing' && !validateEmailDomain()) return
  loading.value = true
  try {
    const body = { identifier: identifier.value, type: identifierType.value }
    if (status.value === 'missing' && name.value) body.name = name.value
    const res = await client('/api/login', { method: 'POST', body })
    const sent = res?.data?.identifier ?? identifier.value
    await navigateTo({ name: 'verify-login', query: { identifier: sent, type: identifierType.value } })
  } catch (error) {
    form.set(error)
  } finally {
    loading.value = false
  }
}

const continueAsGuest = async () => {
  form.clear()
  loading.value = true
  try {
    await client('/api/guest', { method: 'POST' })
    await refreshIdentity()
    await navigateTo({ name: 'home' })
  } catch (error) {
    form.set(error)
  } finally {
    loading.value = false
  }
}

const onSubmit = () => {
  if (submitDisabled.value) return
  if (isOtpMode.value) return performOtpRequest()
  if (status.value === 'pending_deletion') {
    restoreDialogOpen.value = true
    return
  }
  return performLogin()
}

const confirmRestore = async () => {
  await performLogin()
  restoreDialogOpen.value = false
}

const onSocial = async ({ idToken, error }) => {
  socialError.value = ''
  if (error) {
    socialError.value = error.message ?? String(error)
    return
  }
  loading.value = true
  try {
    clearGuestUser()
    const res = await client('/api/firebase-login', { method: 'POST', body: { token: idToken, ...deviceMeta() } })
    await applyLogin(res)
    await navigateTo({ name: 'home' })
  } catch (err) {
    socialError.value = socialErrorMessage(err, t)
  } finally {
    loading.value = false
  }
}
</script>
