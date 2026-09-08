<template>
  <AuthCard
    :title="t('reset_password', 'Choose a new password', 'اختر كلمة مرور جديدة')"
    :description="t('reset_password_description', 'Set a new password for your account.', 'عيّن كلمة مرور جديدة لحسابك.')"
    :show-logo="false"
  >
    <form class="grid gap-4" @submit.prevent="onSubmit">
      <FormField id="password" :label="t('new_password', 'New password', 'كلمة مرور جديدة')" :error="form.first('password')" :hint="t('password_hint', 'At least 8 characters.', '8 أحرف على الأقل.')">
        <template #default="{ field }">
          <AuthPasswordInput v-model="password" autocomplete="new-password" minlength="8" v-bind="field" required />
        </template>
      </FormField>
      <FormField id="password_confirmation" :label="t('confirm_password', 'Confirm password', 'تأكيد كلمة المرور')" :error="form.first('password_confirmation')">
        <template #default="{ field }">
          <AuthPasswordInput v-model="passwordConfirmation" autocomplete="new-password" v-bind="field" required />
        </template>
      </FormField>
      <FormAlert :message="form.message.value" />
      <Button type="submit" class="w-full" :disabled="loading">
        <LucideLoaderCircle v-if="loading" class="size-4 animate-spin" />
        {{ loading ? t('updating', 'Updating...', 'جارٍ التحديث...') : t('update_password', 'Update password', 'تحديث كلمة المرور') }}
      </Button>
    </form>

    <template #footer>
      <NuxtLink to="/login" class="font-medium underline-offset-4 hover:underline">{{ t('back_to_login', 'Back to sign in', 'العودة لتسجيل الدخول') }}</NuxtLink>
    </template>
  </AuthCard>
</template>

<script setup>
definePageMeta({
  layout: 'auth',
  middleware: ['auth-mode', 'require-pre-auth', 'password-mode-only'],
  name: 'forgot-password-reset',
})

const { t } = useLang('web', 'auth')
useHead({ title: t('reset_password', 'Choose a new password', 'اختر كلمة مرور جديدة') })

const flowState = useState('forgot-password')
const flow = computed(() => flowState.value ?? {})
if (!flow.value.identifier || !flow.value.otp) await navigateTo({ name: 'forgot-password' })

const client = useApi()
const form = useFormErrors(['password', 'password_confirmation', 'otp', 'identifier'])
const password = ref('')
const passwordConfirmation = ref('')
const loading = ref(false)

const onSubmit = async () => {
  form.clear()
  if (password.value !== passwordConfirmation.value) {
    form.errors.value = { password_confirmation: [t('password_mismatch', 'Passwords do not match.', 'كلمتا المرور غير متطابقتين.')] }
    return
  }
  loading.value = true
  try {
    await client('/api/change-forgot-password', {
      method: 'POST',
      body: {
        identifier: flow.value.identifier,
        type: flow.value.type,
        otp: flow.value.otp,
        password: password.value,
        password_confirmation: passwordConfirmation.value,
      },
    })
    flowState.value = null
    await navigateTo({ name: 'login', query: { reset: '1' } })
  } catch (error) {
    form.set(error)
  } finally {
    loading.value = false
  }
}
</script>
