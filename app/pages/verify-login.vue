<template>
  <AuthCard
    :title="t('verify_login_title', 'Enter your code', 'أدخل الرمز')"
    :description="t('enter_otp_sent_to', 'Enter the verification code sent to :target.', 'أدخل رمز التحقق المرسل إلى :target.', { target: identifier })"
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
      <NuxtLink to="/login" class="font-medium underline-offset-4 hover:underline">{{ t('back_to_login', 'Back to sign in', 'العودة لتسجيل الدخول') }}</NuxtLink>
    </template>
  </AuthCard>
</template>

<script setup>
definePageMeta({
  layout: 'auth',
  middleware: ['require-pre-auth'],
  name: 'verify-login',
})

const { t } = useLang('web', 'auth')
useHead({ title: t('verify_login_title', 'Enter your code', 'أدخل الرمز') })

const route = useRoute()
const identifier = String(route.query.identifier ?? '')
const identifierType = String(route.query.type ?? '')
if (!identifier || !identifierType) await navigateTo({ name: 'login' })

const client = useApi()
const { user } = useSanctumAuth()
const { applyLogin } = useAuthSession()
const { toast } = useToast()
const form = useFormErrors(['otp', 'identifier'])
const cooldown = useCooldown(120)

const otp = ref('')
const loading = ref(false)
const resending = ref(false)

const onSubmit = async () => {
  if (loading.value || otp.value.length < 6) return
  form.clear()
  loading.value = true
  try {
    if (user.value?.data?.is_guest) user.value = null
    const res = await client('/api/verify-login', {
      method: 'POST',
      body: { identifier, type: identifierType, otp: otp.value },
    })
    const data = await applyLogin(res)
    if (data.account_restored) toast({ title: t('account_restored', 'Account restored.', 'تم استعادة الحساب.'), variant: 'success' })
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
    await client('/api/login', { method: 'POST', body: { identifier, type: identifierType } })
    cooldown.start()
    toast({ title: t('code_resent', 'A new code has been sent.', 'تم إرسال رمز جديد.'), variant: 'success' })
  } catch (error) {
    form.set(error)
  } finally {
    resending.value = false
  }
}
</script>
