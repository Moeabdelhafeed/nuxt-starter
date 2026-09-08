<template>
  <AuthCard
    :title="t('verify_code_title', 'Enter your code', 'أدخل الرمز')"
    :description="t('enter_otp_sent_to', 'Enter the verification code sent to :target.', 'أدخل رمز التحقق المرسل إلى :target.', { target: flow.sentTo })"
    :show-logo="false"
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
        {{ loading ? t('verifying', 'Verifying...', 'جارٍ التحقق...') : t('continue', 'Continue', 'متابعة') }}
      </Button>
    </form>

    <template #footer>
      <ResendCodeButton :cooldown="cooldown" :busy="resending || loading" @resend="resend" />
      <span class="text-muted-foreground" aria-hidden="true">·</span>
      <NuxtLink :to="{ name: 'forgot-password' }" class="font-medium underline-offset-4 hover:underline">{{ t('start_over', 'Start over', 'البدء من جديد') }}</NuxtLink>
    </template>
  </AuthCard>
</template>

<script setup>
definePageMeta({
  layout: 'auth',
  middleware: ['auth-mode', 'require-pre-auth', 'password-mode-only'],
  name: 'forgot-password-verify',
})

const { t } = useLang('web', 'auth')
useHead({ title: t('verify_code_title', 'Enter your code', 'أدخل الرمز') })

const flowState = useState('forgot-password')
const flow = computed(() => flowState.value ?? {})
if (!flow.value.identifier) await navigateTo({ name: 'forgot-password' })

const client = useApi()
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
    await client('/api/verify-forgot-password-otp', {
      method: 'POST',
      body: { identifier: flow.value.identifier, type: flow.value.type, otp: otp.value },
    })
    flowState.value = { ...flow.value, otp: otp.value }
    await navigateTo({ name: 'forgot-password-reset' })
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
    await client('/api/forgot-password', {
      method: 'POST',
      body: { identifier: flow.value.identifier, type: flow.value.type },
    })
    cooldown.start()
    toast({ title: t('code_resent', 'A new code has been sent.', 'تم إرسال رمز جديد.'), variant: 'success' })
  } catch (error) {
    form.set(error)
  } finally {
    resending.value = false
  }
}
</script>
