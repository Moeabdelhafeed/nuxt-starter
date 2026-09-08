<template>
  <AuthCard
    :title="t('verify_account_title', 'Verify your account', 'تأكيد حسابك')"
    :description="t('enter_otp_sent_to', 'Enter the verification code sent to :target.', 'أدخل رمز التحقق المرسل إلى :target.', { target })"
  >
    <form class="grid gap-4" @submit.prevent="onSubmit">
      <div class="grid gap-2">
        <Label for="otp" class="sr-only">{{ t('otp', 'Verification code', 'رمز التحقق') }}</Label>
        <AuthOtpInput id="otp" v-model="otp" :disabled="loading" @complete="onSubmit" />
        <p v-if="form.first('otp')" role="alert" class="text-center text-xs text-destructive">{{ form.first('otp') }}</p>
      </div>
      <FormAlert :message="form.message.value" />
      <Button type="submit" class="w-full" :disabled="loading || resending || otp.length < 6">
        <LucideLoaderCircle v-if="loading" class="size-4 animate-spin" />
        {{ loading ? t('verifying', 'Verifying...', 'جارٍ التحقق...') : t('verify', 'Verify', 'تحقق') }}
      </Button>
    </form>

    <template #footer>
      <ResendCodeButton :cooldown="cooldown" :busy="resending || loading" @resend="resend" />
      <span class="text-muted-foreground" aria-hidden="true">·</span>
      <button type="button" class="font-medium underline-offset-4 hover:underline disabled:opacity-50" :disabled="signingOut" @click="onSignOut">
        {{ t('sign_out', 'Sign out', 'تسجيل الخروج') }}
      </button>
    </template>
  </AuthCard>
</template>

<script setup>
definePageMeta({
  layout: 'auth',
  middleware: ['auth-mode', 'require-registered', 'unverified'],
  name: 'verify',
})

const { t } = useLang('web', 'auth')
useHead({ title: t('verify_account_title', 'Verify your account', 'تأكيد حسابك') })

const client = useApi()
const { identifiers } = useAuthConfig()
const { profile, refreshIdentity, signOut } = useAuthSession()
const { toast } = useToast()
const form = useFormErrors(['otp'])
const cooldown = useCooldown(120)

// The code goes to whichever identifier the account was registered with.
const target = computed(() => identifiers.value.map((kind) => profile.value?.[kind]).find(Boolean) ?? '')

const otp = ref('')
const loading = ref(false)
const resending = ref(false)
const signingOut = ref(false)

const onSubmit = async () => {
  if (loading.value || otp.value.length < 6) return
  form.clear()
  loading.value = true
  try {
    await client('/api/verify-otp', { method: 'POST', body: { otp: otp.value } })
    await refreshIdentity()
    toast({ title: t('account_verified', 'Account verified.', 'تم تأكيد الحساب.'), variant: 'success' })
    await navigateTo({ name: 'home' })
  } catch (error) {
    form.set(error)
    otp.value = ''
  } finally {
    loading.value = false
  }
}

const resend = async () => {
  form.clear()
  resending.value = true
  try {
    await client('/api/send-otp', { method: 'POST' })
    cooldown.start()
    toast({ title: t('code_resent', 'A new code has been sent.', 'تم إرسال رمز جديد.'), variant: 'success' })
  } catch (error) {
    form.set(error)
  } finally {
    resending.value = false
  }
}

const onSignOut = async () => {
  signingOut.value = true
  try {
    await signOut()
    await navigateTo({ name: 'login' })
  } finally {
    signingOut.value = false
  }
}
</script>
