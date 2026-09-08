<template>
  <AuthCard
    :title="t('create_account', 'Create account', 'إنشاء حساب')"
    :description="t('register_description', 'Enter your details below to register.', 'أدخل بياناتك أدناه للتسجيل.')"
  >
    <form class="grid gap-4" @submit.prevent="onSubmit">
      <FormField id="name" :label="t('name', 'Name', 'الاسم')" :error="form.first('name')">
        <template #default="{ field }">
          <Input v-model="fields.name" type="text" autocomplete="name" :placeholder="t('placeholder_name', 'John Doe', 'محمد أحمد')" v-bind="field" required />
        </template>
      </FormField>

      <IdentifierKindPicker v-model="identifierKind" :kinds="identifiers" :label="t('sign_up_with', 'Sign up with', 'سجّل عبر')" />

      <FormField id="identifier" :label="labelFor(identifierKind)" :error="form.first('identifier')" :hint="identifierHint">
        <template #default="{ field }">
          <IdentifierInput v-model="fields.identifier" :kind="identifierKind" v-bind="field" required />
        </template>
      </FormField>
      <p v-if="check.checking.value" class="-mt-2 text-xs text-muted-foreground">{{ t('checking', 'Checking...', 'جارٍ التحقق...') }}</p>
      <FormAlert v-else-if="identifierTaken" :message="t('identifier_already_taken', 'This :field is already in use.', 'هذا :field مستخدم بالفعل.', { field: labelFor(identifierKind).toLowerCase() })" />

      <FormField v-if="showsExtraField('username')" id="username" :label="labelFor('username')" :optional="!isExtraRequired('username')" :error="form.first('username')">
        <template #default="{ field }">
          <Input v-model="fields.username" type="text" autocomplete="username" :placeholder="placeholderFor('username')" v-bind="field" :required="isExtraRequired('username')" />
        </template>
      </FormField>
      <FormField v-if="showsExtraField('email')" id="email" :label="labelFor('email')" :optional="!isExtraRequired('email')" :error="form.first('email')">
        <template #default="{ field }">
          <Input v-model="fields.email" type="email" inputmode="email" autocomplete="email" :placeholder="placeholderFor('email')" v-bind="field" :required="isExtraRequired('email')" />
        </template>
      </FormField>
      <FormField v-if="showsExtraField('phone')" id="phone" :label="labelFor('phone')" :optional="!isExtraRequired('phone')" :error="form.first('phone')">
        <template #default="{ field }">
          <AuthPhoneInput v-model="fields.phone" :allowed="allowedPhoneCountries" autocomplete="tel" v-bind="field" :required="isExtraRequired('phone')" />
        </template>
      </FormField>

      <FormField id="password" :label="t('password', 'Password', 'كلمة المرور')" :error="form.first('password')" :hint="t('password_hint', 'At least 8 characters.', '8 أحرف على الأقل.')">
        <template #default="{ field }">
          <AuthPasswordInput v-model="fields.password" autocomplete="new-password" minlength="8" v-bind="field" required />
        </template>
      </FormField>
      <FormField id="password_confirmation" :label="t('confirm_password', 'Confirm password', 'تأكيد كلمة المرور')" :error="form.first('password_confirmation')">
        <template #default="{ field }">
          <AuthPasswordInput v-model="fields.password_confirmation" autocomplete="new-password" v-bind="field" required />
        </template>
      </FormField>

      <div class="grid gap-2">
        <div class="flex items-start gap-2">
          <Checkbox id="policy" v-model="fields.policy_agreed" class="mt-0.5" :aria-invalid="form.first('policy_agreed') ? true : undefined" aria-describedby="policy-error" />
          <Label for="policy" class="text-sm font-normal leading-snug">
            {{ t('policy_agreement', 'I agree to the terms and privacy policy', 'أوافق على الشروط وسياسة الخصوصية') }}
          </Label>
        </div>
        <p v-if="form.first('policy_agreed')" id="policy-error" role="alert" class="text-xs text-destructive">{{ form.first('policy_agreed') }}</p>
      </div>

      <FormAlert :message="form.message.value" />

      <Button type="submit" class="w-full" :disabled="loading || identifierTaken || check.checking.value">
        <LucideLoaderCircle v-if="loading" class="size-4 animate-spin" />
        {{ loading ? t('creating', 'Creating...', 'جارٍ الإنشاء...') : t('create_account', 'Create account', 'إنشاء حساب') }}
      </Button>
    </form>

    <template #footer>
      <span class="text-muted-foreground">{{ t('have_account', 'Already have an account?', 'لديك حساب بالفعل؟') }}</span>
      <NuxtLink to="/login" class="font-medium underline-offset-4 hover:underline">{{ t('sign_in', 'Sign in', 'تسجيل الدخول') }}</NuxtLink>
    </template>
  </AuthCard>
</template>

<script setup>
definePageMeta({
  layout: 'auth',
  middleware: ['auth-mode', 'require-pre-auth', 'password-mode-only'],
  name: 'register',
})

const { t } = useLang('web', 'auth')
useHead({ title: t('create_account', 'Create account', 'إنشاء حساب') })

const {
  identifiers, showsExtraField, isExtraRequired, placeholderFor, labelFor,
  allowedPhoneCountries, allowedEmailDomains, isEmailDomainAllowed,
} = useAuthConfig()
const client = useApi()
const { user, login } = useSanctumAuth()
const { applyLogin } = useAuthSession()
const { deviceMeta } = useDevice()

const identifierKind = ref(identifiers.value[0] ?? 'email')
watch(identifiers, (list) => {
  if (list.length && !list.includes(identifierKind.value)) identifierKind.value = list[0]
}, { immediate: true })

const fields = reactive({
  name: '', identifier: '', username: '', email: '', phone: '',
  password: '', password_confirmation: '', policy_agreed: false,
})
const loading = ref(false)
const form = useFormErrors(['name', 'identifier', 'username', 'email', 'phone', 'password', 'password_confirmation', 'policy_agreed'])

const identifierRef = toRef(fields, 'identifier')
const check = useIdentifierCheck(identifierRef, identifierKind)
// Pre-submit uniqueness: any existing row counts as taken, whatever its state.
const identifierTaken = computed(() => !!check.result.value?.exists)

const identifierHint = computed(() => {
  if (identifierKind.value !== 'email' || !Array.isArray(allowedEmailDomains.value)) return ''
  return t('allowed_email_domains_hint', 'Accepted: :domains', 'المقبول: :domains', { domains: allowedEmailDomains.value.join(', ') })
})

const buildBody = () => {
  const body = {
    name: fields.name,
    identifier: fields.identifier,
    // The API never infers the kind from the value — the picker (or the single
    // configured identifier) is what says whether this is an email or a phone.
    type: identifierKind.value,
    password: fields.password,
    password_confirmation: fields.password_confirmation,
    policy_agreed: fields.policy_agreed,
    ...deviceMeta(),
  }
  const include = (kind) => showsExtraField(kind) && (isExtraRequired(kind) || !!fields[kind])
  if (include('username')) body.username = fields.username
  if (include('email')) body.email = fields.email
  if (include('phone')) body.phone = fields.phone
  return body
}

const validate = () => {
  const errors = {}
  if (!fields.policy_agreed) errors.policy_agreed = [t('policy_required', 'You must accept the terms to continue.', 'يجب الموافقة على الشروط للمتابعة.')]
  if (fields.password !== fields.password_confirmation) errors.password_confirmation = [t('password_mismatch', 'Passwords do not match.', 'كلمتا المرور غير متطابقتين.')]
  const emailValue = identifierKind.value === 'email' ? fields.identifier : (showsExtraField('email') ? fields.email : '')
  if (emailValue && !isEmailDomainAllowed(emailValue)) {
    errors[identifierKind.value === 'email' ? 'identifier' : 'email'] = [t('email_domain_not_allowed', 'Email must be from: :domains', 'يجب أن يكون البريد من: :domains', { domains: allowedEmailDomains.value.join(', ') })]
  }
  form.errors.value = errors
  return !Object.keys(errors).length
}

const onSubmit = async () => {
  form.clear()
  if (!validate()) return
  loading.value = true
  try {
    const res = await client('/api/register', { method: 'POST', body: buildBody() })
    if (user.value?.data?.is_guest) user.value = null
    if (res?.token ?? res?.data?.token) {
      await applyLogin(res)
    } else {
      await login({ identifier: fields.identifier, type: identifierKind.value, password: fields.password, ...deviceMeta() }, true)
    }
    await navigateTo({ name: 'home' })
  } catch (error) {
    form.set(error)
  } finally {
    loading.value = false
  }
}
</script>
