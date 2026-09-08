<template>
  <div class="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="flex size-14 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary" aria-hidden="true">
          {{ initials }}
        </div>
        <div>
          <h1 class="text-2xl font-bold">{{ profile?.name || t('profile', 'Profile', 'الملف الشخصي') }}</h1>
          <p class="text-sm text-muted-foreground">{{ primaryIdentifier }}</p>
          <div class="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span v-if="isVerified" class="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-medium text-success">
              <LucideShieldCheck class="size-3" /> {{ t('verified', 'Verified', 'موثّق') }}
            </span>
            <span v-if="profile?.created_at" class="text-muted-foreground">{{ t('member_since', 'Member since :date', 'عضو منذ :date', { date: formatDateOnly(profile.created_at) }) }}</span>
          </div>
        </div>
      </div>
      <Button v-if="multiSession" variant="outline" size="sm" as-child>
        <NuxtLink to="/devices"><LucideMonitorSmartphone class="size-4" /> {{ t('active_devices', 'Active devices', 'الأجهزة النشطة') }}</NuxtLink>
      </Button>
    </div>

    <div class="mt-8 grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle as="h2">{{ t('update_profile', 'Profile details', 'بيانات الملف') }}</CardTitle>
          <CardDescription>{{ t('update_profile_description', 'Change how your account appears.', 'غيّر بيانات حسابك.') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <form class="grid gap-4" @submit.prevent="onUpdateProfile">
            <FormField id="name" :label="t('name', 'Name', 'الاسم')" :error="profileForm.first('name')">
              <template #default="{ field }">
                <Input v-model="profileFields.name" type="text" autocomplete="name" v-bind="field" required />
              </template>
            </FormField>
            <FormField v-if="hasUsername" id="username" :label="labelFor('username')" :optional="!isExtraRequired('username')" :error="profileForm.first('username')">
              <template #default="{ field }">
                <Input v-model="profileFields.username" type="text" autocomplete="username" :placeholder="placeholderFor('username')" v-bind="field" />
              </template>
            </FormField>
            <FormField v-if="hasEmail" id="email" :label="labelFor('email')" :optional="!isExtraRequired('email')" :error="profileForm.first('email')">
              <template #default="{ field }">
                <Input v-model="profileFields.email" type="email" inputmode="email" autocomplete="email" :placeholder="placeholderFor('email')" v-bind="field" />
              </template>
            </FormField>
            <FormField v-if="hasPhone" id="phone" :label="labelFor('phone')" :optional="!isExtraRequired('phone')" :error="profileForm.first('phone')">
              <template #default="{ field }">
                <AuthPhoneInput v-model="profileFields.phone" :allowed="allowedPhoneCountries" autocomplete="tel" v-bind="field" />
              </template>
            </FormField>
            <FormAlert :message="profileForm.message.value" />
            <div>
              <Button type="submit" :disabled="profileLoading">
                <LucideLoaderCircle v-if="profileLoading" class="size-4 animate-spin" />
                {{ profileLoading ? t('saving', 'Saving...', 'جارٍ الحفظ...') : t('save_changes', 'Save changes', 'حفظ التغييرات') }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card v-if="!isOtpMode">
        <CardHeader>
          <CardTitle as="h2">{{ hasPassword ? t('change_password', 'Change password', 'تغيير كلمة المرور') : t('set_password', 'Set a password', 'تعيين كلمة مرور') }}</CardTitle>
          <CardDescription>{{ hasPassword ? t('change_password_description', 'Changing your password signs you out of other devices.', 'تغيير كلمة المرور يُخرجك من الأجهزة الأخرى.') : t('set_password_description', 'Add a password so you can sign in without a social provider.', 'أضف كلمة مرور لتسجيل الدخول بدون مزوّد اجتماعي.') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <form class="grid gap-4" @submit.prevent="onChangePassword">
            <FormField v-if="hasPassword" id="old_password" :label="t('current_password', 'Current password', 'كلمة المرور الحالية')" :error="passwordForm.first('old_password')">
              <template #default="{ field }">
                <AuthPasswordInput v-model="passwordFields.old_password" autocomplete="current-password" v-bind="field" required />
              </template>
            </FormField>
            <FormField id="new_password" :label="t('new_password', 'New password', 'كلمة مرور جديدة')" :error="passwordForm.first('password')" :hint="t('password_hint', 'At least 8 characters.', '8 أحرف على الأقل.')">
              <template #default="{ field }">
                <AuthPasswordInput v-model="passwordFields.password" autocomplete="new-password" minlength="8" v-bind="field" required />
              </template>
            </FormField>
            <FormField id="confirm_password" :label="t('confirm_password', 'Confirm password', 'تأكيد كلمة المرور')" :error="passwordForm.first('password_confirmation')">
              <template #default="{ field }">
                <AuthPasswordInput v-model="passwordFields.password_confirmation" autocomplete="new-password" v-bind="field" required />
              </template>
            </FormField>
            <FormAlert :message="passwordForm.message.value" />
            <div>
              <Button type="submit" :disabled="passwordLoading">
                <LucideLoaderCircle v-if="passwordLoading" class="size-4 animate-spin" />
                {{ passwordLoading ? t('updating', 'Updating...', 'جارٍ التحديث...') : t('update_password', 'Update password', 'تحديث كلمة المرور') }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">{{ t('change_kind', 'Change :kind', 'تغيير :kind', { kind: identifierKindLabel.toLowerCase() }) }}</CardTitle>
          <CardDescription>{{ t('change_kind_description', 'We will send a verification code to the new :kind.', 'سنرسل رمز تحقق إلى :kind الجديد.', { kind: identifierKindLabel.toLowerCase() }) }}</CardDescription>
        </CardHeader>
        <CardContent>
          <form class="grid gap-4" @submit.prevent="otpSent ? onVerifyIdentifierChange() : onRequestIdentifierChange()">
            <IdentifierKindPicker v-if="!otpSent" v-model="identifierKind" :kinds="identifiers" :label="t('change_which', 'What do you want to change?', 'ما الذي تريد تغييره؟')" />
            <FormField id="new_identifier" :label="t('new_kind', 'New :kind', ':kind الجديد', { kind: identifierKindLabel.toLowerCase() })" :error="identifierForm.first('new_identifier') || identifierForm.first('type')">
              <template #default="{ field }">
                <IdentifierInput v-model="identifierFields.new_identifier" :kind="identifierKind" :disabled="otpSent" v-bind="field" required />
              </template>
            </FormField>

            <template v-if="otpSent">
              <div class="grid gap-2 border-t pt-4">
                <Label for="identifier_otp">{{ t('otp', 'Verification code', 'رمز التحقق') }}</Label>
                <AuthOtpInput id="identifier_otp" v-model="identifierFields.otp" :disabled="identifierVerifying" />
                <p v-if="identifierForm.first('otp')" role="alert" class="text-center text-xs text-destructive">{{ identifierForm.first('otp') }}</p>
              </div>
            </template>

            <FormAlert :message="identifierForm.message.value" />

            <div class="flex flex-wrap items-center gap-3">
              <Button type="submit" :disabled="identifierLoading || identifierVerifying || (otpSent && identifierFields.otp.length < 6)">
                <LucideLoaderCircle v-if="identifierLoading || identifierVerifying" class="size-4 animate-spin" />
                {{ otpSent
                  ? (identifierVerifying ? t('verifying', 'Verifying...', 'جارٍ التحقق...') : t('verify_and_save', 'Verify & save', 'تحقق واحفظ'))
                  : (identifierLoading ? t('sending', 'Sending...', 'جارٍ الإرسال...') : t('send_code', 'Send code', 'إرسال الرمز')) }}
              </Button>
              <template v-if="otpSent">
                <ResendCodeButton class="text-sm" :cooldown="identifierCooldown" :busy="identifierLoading || identifierVerifying" @resend="onRequestIdentifierChange" />
                <button type="button" class="text-sm text-muted-foreground underline-offset-4 hover:underline" @click="cancelIdentifierChange">{{ t('cancel', 'Cancel', 'إلغاء') }}</button>
              </template>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card v-if="socialAuthAvailable && socialProviders.length">
        <CardHeader>
          <CardTitle as="h2">{{ t('social_accounts', 'Social accounts', 'الحسابات الاجتماعية') }}</CardTitle>
          <CardDescription>{{ t('manage_social_providers', 'Connect or disconnect providers linked to your account.', 'اربط أو افصل المزودين المرتبطين بحسابك.') }}</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-3">
          <FormAlert v-if="!hasPassword" variant="warning" :message="t('set_password_cta', 'Set a password to sign in without a provider and to be able to disconnect your last one.', 'عيّن كلمة مرور لتسجيل الدخول بدون مزوّد ولتتمكن من فك ربط آخر مزوّد.')" />
          <ul v-if="socialLoading" class="grid gap-2" aria-busy="true">
            <li v-for="i in socialProviders.length" :key="i" class="flex items-center justify-between rounded-md border p-3">
              <AppSkeleton class="h-4 w-28" /><AppSkeleton class="h-8 w-20" />
            </li>
          </ul>
          <ul v-else class="grid gap-2">
            <li v-for="p in socialProviders" :key="p" class="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
              <div class="min-w-0">
                <p class="font-medium">{{ providerLabel(p, code) }}</p>
                <p v-if="findLinked(p)" class="truncate text-xs text-muted-foreground">{{ findLinked(p).email ?? findLinked(p).name }}</p>
              </div>
              <Button
                v-if="findLinked(p)"
                variant="outline"
                size="sm"
                :disabled="unlinking === p || (linkedProviders.length === 1 && !hasPassword)"
                @click="onUnlinkSocial(p)"
              >
                <LucideLoaderCircle v-if="unlinking === p" class="size-4 animate-spin" />
                {{ t('disconnect', 'Disconnect', 'فك الربط') }}
              </Button>
              <Button v-else size="sm" :disabled="!canLinkMore || connecting === p" @click="onConnectProvider(p)">
                <LucideLoaderCircle v-if="connecting === p" class="size-4 animate-spin" />
                {{ t('connect', 'Connect', 'ربط') }}
              </Button>
            </li>
          </ul>
          <p v-if="!canLinkMore && maxSocialAccounts > 0" class="text-xs text-muted-foreground">
            {{ t('linked_accounts_limit_reached', 'Linked accounts limit reached (:max).', 'تم بلوغ الحد الأقصى للحسابات المربوطة (:max).', { max: maxSocialAccounts }) }}
          </p>
          <FormAlert :message="socialError" />
        </CardContent>
      </Card>

      <Card class="border-destructive/40">
        <CardHeader>
          <CardTitle as="h2" class="text-destructive">{{ t('danger_zone', 'Danger zone', 'منطقة الخطر') }}</CardTitle>
          <CardDescription>{{ t('delete_account_description', 'Delete your account and all of its data.', 'احذف حسابك وجميع بياناته.') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" :disabled="deleting" @click="deleteDialogOpen = true">
            {{ t('delete_account', 'Delete account', 'حذف الحساب') }}
          </Button>
        </CardContent>
      </Card>
    </div>

    <ConfirmDialog
      v-model:open="deleteDialogOpen"
      destructive
      :title="t('delete_account', 'Delete account', 'حذف الحساب')"
      :description="t('delete_account_confirm', 'Your account will be scheduled for deletion. Signing in again before then restores it.', 'سيتم جدولة حسابك للحذف. تسجيل الدخول مجددًا قبل ذلك يستعيده.')"
      :confirm-label="t('delete_account', 'Delete account', 'حذف الحساب')"
      :loading="deleting"
      @confirm="confirmDeleteAccount"
    >
      <FormAlert :message="deleteError" />
    </ConfirmDialog>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth-mode', 'require-registered', 'verified'],
  name: 'profile',
})

const { t, code } = useLang('web', 'profile')
useHead({ title: t('profile', 'Profile', 'الملف الشخصي') })

const client = useApi()
const {
  identifiers, hasUsername, hasEmail, hasPhone, isExtraRequired, labelFor, placeholderFor,
  socialAuthAvailable, socialProviders, maxSocialAccounts, multiSession, isOtpMode, allowedPhoneCountries,
} = useAuthConfig()
const { profile, isVerified, refreshIdentity, signOut } = useAuthSession()
const { formatDateOnly } = useDateFormat()
const { signInWithProvider } = useFirebaseAuth()
const { toast } = useToast()

const initials = computed(() => (profile.value?.name ?? '')
  .split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?')
const primaryIdentifier = computed(() => identifiers.value.map((kind) => profile.value?.[kind]).find(Boolean) ?? profile.value?.username ?? '')
const hasPassword = computed(() => !!profile.value?.has_password)

// ---- profile details ----
const profileFields = reactive({ name: '', username: '', email: '', phone: '' })
const profileForm = useFormErrors(['name', 'username', 'email', 'phone'])
const profileLoading = ref(false)

const fillProfileForm = () => {
  const p = profile.value
  if (!p) return
  Object.assign(profileFields, { name: p.name ?? '', username: p.username ?? '', email: p.email ?? '', phone: p.phone ?? '' })
}
// Filled once, then only after a save — an identity refresh mid-edit must not wipe typing.
fillProfileForm()

const onUpdateProfile = async () => {
  profileForm.clear()
  profileLoading.value = true
  try {
    const body = { name: profileFields.name }
    const include = (kind, has) => has && (isExtraRequired(kind) || !!profileFields[kind])
    if (include('username', hasUsername.value)) body.username = profileFields.username
    if (include('email', hasEmail.value)) body.email = profileFields.email
    if (include('phone', hasPhone.value)) body.phone = profileFields.phone
    await client('/api/update-profile', { method: 'PUT', body })
    await refreshIdentity()
    fillProfileForm()
    toast({ title: t('saved', 'Changes saved.', 'تم حفظ التغييرات.'), variant: 'success' })
  } catch (error) {
    profileForm.set(error)
  } finally {
    profileLoading.value = false
  }
}

// ---- password ----
const passwordFields = reactive({ old_password: '', password: '', password_confirmation: '' })
const passwordForm = useFormErrors(['old_password', 'password', 'password_confirmation'])
const passwordLoading = ref(false)

const onChangePassword = async () => {
  passwordForm.clear()
  if (passwordFields.password !== passwordFields.password_confirmation) {
    passwordForm.errors.value = { password_confirmation: [t('password_mismatch', 'Passwords do not match.', 'كلمتا المرور غير متطابقتين.')] }
    return
  }
  passwordLoading.value = true
  try {
    const body = {
      password: passwordFields.password,
      password_confirmation: passwordFields.password_confirmation,
      ...(hasPassword.value ? { old_password: passwordFields.old_password } : {}),
    }
    await client('/api/change-password', { method: 'POST', body })
    Object.assign(passwordFields, { old_password: '', password: '', password_confirmation: '' })
    await refreshIdentity()
    toast({ title: t('password_updated', 'Password updated.', 'تم تحديث كلمة المرور.'), variant: 'success' })
  } catch (error) {
    passwordForm.set(error)
  } finally {
    passwordLoading.value = false
  }
}

// ---- identifier change ----
const identifierKind = ref(identifiers.value[0] ?? 'email')
watch(identifiers, (list) => {
  if (list.length && !list.includes(identifierKind.value)) identifierKind.value = list[0]
}, { immediate: true })
const identifierKindLabel = computed(() => labelFor(identifierKind.value))

const identifierFields = reactive({ new_identifier: '', otp: '' })
const identifierForm = useFormErrors(['new_identifier', 'type', 'otp'])
const identifierLoading = ref(false)
const identifierVerifying = ref(false)
const otpSent = ref(false)
const identifierCooldown = useCooldown(120)

const onRequestIdentifierChange = async () => {
  identifierForm.clear()
  identifierLoading.value = true
  try {
    await client('/api/request-identifier-change', {
      method: 'POST',
      // The picker declares the kind; the API validates against it instead of guessing,
      // so a phone must carry its country code.
      body: { new_identifier: identifierFields.new_identifier, type: identifierKind.value },
    })
    otpSent.value = true
    identifierCooldown.start()
  } catch (error) {
    identifierForm.set(error)
  } finally {
    identifierLoading.value = false
  }
}

const onVerifyIdentifierChange = async () => {
  identifierForm.clear()
  identifierVerifying.value = true
  try {
    await client('/api/verify-identifier-change', {
      method: 'POST',
      body: { ...identifierFields, type: identifierKind.value },
    })
    await refreshIdentity()
    fillProfileForm()
    toast({ title: t('kind_updated', ':kind updated.', 'تم تحديث :kind.', { kind: identifierKindLabel.value }), variant: 'success' })
    cancelIdentifierChange()
  } catch (error) {
    identifierForm.set(error)
  } finally {
    identifierVerifying.value = false
  }
}

const cancelIdentifierChange = () => {
  otpSent.value = false
  Object.assign(identifierFields, { new_identifier: '', otp: '' })
}

// ---- social ----
const socialError = ref('')
const connecting = ref(null)
const unlinking = ref(null)

const { data: socialData, pending: socialLoading, refresh: loadSocialAccounts } = useApiFetch('/api/social-accounts', {
  key: 'social-accounts',
  immediate: socialAuthAvailable.value,
  default: () => null,
})
const socialAccounts = computed(() => socialData.value?.data?.social_accounts ?? [])
const linkedProviders = computed(() => socialAccounts.value.map((a) => a.provider))
const findLinked = (p) => socialAccounts.value.find((a) => a.provider === p)
const canLinkMore = computed(() => {
  const remote = socialData.value?.data?.can_link_more
  if (typeof remote === 'boolean') return remote
  return !maxSocialAccounts.value || socialAccounts.value.length < maxSocialAccounts.value
})

const onConnectProvider = async (p) => {
  socialError.value = ''
  connecting.value = p
  try {
    const { idToken } = await signInWithProvider(p)
    await client('/api/link-social-account', { method: 'POST', body: { token: idToken } })
    await loadSocialAccounts()
    await refreshIdentity()
  } catch (error) {
    socialError.value = socialErrorMessage(error, t)
  } finally {
    connecting.value = null
  }
}

const onUnlinkSocial = async (provider) => {
  socialError.value = ''
  unlinking.value = provider
  try {
    await client('/api/unlink-social-account', { method: 'DELETE', body: { provider } })
    await loadSocialAccounts()
    await refreshIdentity()
  } catch (error) {
    socialError.value = socialErrorMessage(error, t)
  } finally {
    unlinking.value = null
  }
}

// ---- delete ----
const deleting = ref(false)
const deleteDialogOpen = ref(false)
const deleteError = ref('')
const confirmDeleteAccount = async () => {
  deleting.value = true
  deleteError.value = ''
  try {
    await client('/api/delete-account', { method: 'DELETE' })
    await signOut()
    deleteDialogOpen.value = false
    toast({ title: t('account_deleted', 'Your account has been scheduled for deletion.', 'تمت جدولة حسابك للحذف.') })
    await navigateTo({ name: 'login' })
  } catch (error) {
    deleteError.value = error?.data?.message ?? t('error_generic', 'Something went wrong. Please try again.', 'حدث خطأ ما. حاول مجددًا.')
  } finally {
    deleting.value = false
  }
}
</script>
