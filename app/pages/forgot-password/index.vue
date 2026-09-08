<template>
  <AuthCard
    :title="t('forgot_password_title', 'Reset your password', 'إعادة تعيين كلمة المرور')"
    :description="t('forgot_password_description', 'Enter your :field and we will send you a verification code.', 'أدخل :field وسنرسل لك رمز التحقق.', { field: identifierLabel.toLowerCase() })"
    :show-logo="false"
  >
    <form class="grid gap-4" @submit.prevent="onSubmit">
      <IdentifierKindPicker v-model="type" :kinds="identifierTypes" :label="t('identify_with', 'Identify with', 'التعريف عبر')" />

      <FormField id="identifier" :label="labelFor(type)" :error="form.first('identifier')">
        <template #default="{ field }">
          <IdentifierInput v-model="identifier" :kind="type" v-bind="field" required />
        </template>
      </FormField>
      <p v-if="check.checking.value" class="-mt-2 text-xs text-muted-foreground">{{ t('checking', 'Checking...', 'جارٍ التحقق...') }}</p>
      <FormAlert v-else-if="status === 'missing'" :message="t('no_account_with_identifier', 'No account with this :field.', 'لا يوجد حساب بهذا :field.', { field: labelFor(type).toLowerCase() })" />
      <FormAlert v-else-if="status === 'suspended'" :message="t('account_suspended', 'This account is suspended. Contact support.', 'هذا الحساب موقوف. تواصل مع الدعم.')" />
      <FormAlert v-else-if="exists && !channels.length" :message="t('no_delivery_channel', 'No way to deliver a code to this account.', 'لا توجد وسيلة لإرسال الرمز لهذا الحساب.')" />

      <FormField v-if="exists && channels.length > 1" id="channel" :label="t('send_code_via', 'Send the code via', 'إرسال الرمز عبر')" :error="form.first('channel')">
        <div role="group" class="flex flex-wrap gap-2">
          <Button
            v-for="ch in channels"
            :key="ch"
            type="button"
            size="sm"
            :variant="channel === ch ? 'default' : 'outline'"
            :aria-pressed="channel === ch"
            @click="channel = ch"
          >{{ labelFor(ch) }}</Button>
        </div>
      </FormField>

      <FormAlert :message="form.message.value" />

      <Button type="submit" class="w-full" :disabled="loading || check.checking.value || status === 'missing' || status === 'suspended' || (exists && !channels.length)">
        <LucideLoaderCircle v-if="loading" class="size-4 animate-spin" />
        {{ loading ? t('sending', 'Sending...', 'جارٍ الإرسال...') : t('send_code', 'Send code', 'إرسال الرمز') }}
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
  name: 'forgot-password',
})

const { t } = useLang('web', 'auth')
useHead({ title: t('forgot_password_title', 'Reset your password', 'إعادة تعيين كلمة المرور') })

const { identifierLabel, identifierTypes, defaultIdentifierType, labelFor } = useAuthConfig()
const client = useApi()
const form = useFormErrors(['identifier', 'channel'])

// `type` = which kind of identifier was typed (declared, never guessed).
// `channel` = where the reset code should be sent, when the account has both.
const identifier = ref('')
const type = ref(defaultIdentifierType.value)
const channel = ref('')
const loading = ref(false)

watch(identifierTypes, (list) => {
  if (list.length && !list.includes(type.value)) type.value = list[0]
}, { immediate: true })

const check = useIdentifierCheck(identifier, type)
const status = check.status
const exists = computed(() => !!check.result.value?.exists)
const channels = computed(() => check.result.value?.available_channels ?? [])
watch(channels, (list) => { channel.value = list.length === 1 ? list[0] : '' })

const onSubmit = async () => {
  form.clear()
  loading.value = true
  try {
    const body = { identifier: identifier.value, type: type.value }
    if (channel.value) body.channel = channel.value
    const res = await client('/api/forgot-password', { method: 'POST', body })
    // The code travels in state, never the URL — the next steps read it from here.
    useState('forgot-password').value = { identifier: identifier.value, type: type.value, sentTo: res?.data?.identifier ?? identifier.value }
    await navigateTo({ name: 'forgot-password-verify' })
  } catch (error) {
    form.set(error)
  } finally {
    loading.value = false
  }
}
</script>
