<template>
  <div class="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
    <section class="flex flex-col items-center gap-6 text-center">
      <AppMedia v-if="logo" :src="logo" alt="" class="h-16 w-auto object-contain" />
      <div class="grid gap-3">
        <h1 class="text-4xl font-bold tracking-tight sm:text-5xl">
          {{ isMember && profile?.name
            ? t('welcome_named', 'Welcome, :name', 'مرحبًا، :name', { name: profile.name })
            : t('welcome_to', 'Welcome to :site', 'مرحبًا بك في :site', { site: siteName }) }}
        </h1>
        <p class="mx-auto max-w-md text-muted-foreground">
          {{ isGuest
            ? t('home_guest_note', 'You are browsing as a guest.', 'أنت تتصفح كزائر.')
            : t('home_public_note', 'Everything you need, in one place.', 'كل ما تحتاجه في مكان واحد.') }}
        </p>
      </div>

      <div v-if="hasAuthSystem" class="flex flex-wrap items-center justify-center gap-3">
        <template v-if="isMember">
          <Button as-child><NuxtLink to="/profile">{{ t('profile', 'Profile', 'الملف الشخصي') }}</NuxtLink></Button>
        </template>
        <template v-else>
          <template v-if="appUsers">
            <Button as-child><NuxtLink to="/login">{{ t('sign_in', 'Sign in', 'تسجيل الدخول') }}</NuxtLink></Button>
            <Button v-if="!isOtpMode" variant="outline" as-child><NuxtLink to="/register">{{ t('register', 'Register', 'إنشاء حساب') }}</NuxtLink></Button>
          </template>
          <Button v-if="appGuests && !isGuest" variant="secondary" :disabled="creatingGuest" @click="createGuestAccount">
            <LucideLoaderCircle v-if="creatingGuest" class="size-4 animate-spin" />
            {{ t('continue_as_guest', 'Continue as guest', 'المتابعة كزائر') }}
          </Button>
          <Button v-if="isGuest" variant="ghost" @click="deleteGuestDialogOpen = true">
            {{ t('delete_guest_account', 'End guest session', 'إنهاء جلسة الزائر') }}
          </Button>
        </template>
      </div>
    </section>

    <section v-if="pages.length" class="mt-16" :aria-label="t('site_pages', 'Pages', 'الصفحات')">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="p in pages"
          :key="p.id"
          :to="`/${p.slug}`"
          class="group overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
        >
          <AppImage v-if="p.image?.image_api" :src="p.image" :alt="p.name" class="aspect-video w-full object-cover" loading="lazy" />
          <div v-else class="flex aspect-video items-center justify-center bg-muted text-muted-foreground" aria-hidden="true">
            <LucideFileText class="size-8" />
          </div>
          <div class="flex items-center justify-between gap-2 p-4">
            <h2 class="font-semibold">{{ p.name }}</h2>
            <LucideArrowRight class="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
          </div>
        </NuxtLink>
      </div>
    </section>

    <section v-if="storeBadges.length" class="mt-16 flex flex-col items-center gap-4 text-center">
      <h2 class="text-lg font-semibold">{{ t('get_the_app', 'Get the app', 'حمّل التطبيق') }}</h2>
      <ul class="flex flex-wrap items-center justify-center gap-3">
        <li v-for="item in storeBadges" :key="`${item.block}-${item.id}`">
          <a :href="item.url" target="_blank" rel="noopener noreferrer" :aria-label="item.text">
            <AppImage v-if="item.image?.image_api" :src="item.image" :alt="item.text" class="h-12 rounded-md object-contain" />
            <span v-else class="inline-flex h-12 items-center rounded-md border bg-background px-4 text-sm">{{ item.text }}</span>
          </a>
        </li>
      </ul>
    </section>

    <ConfirmDialog
      v-model:open="deleteGuestDialogOpen"
      destructive
      :title="t('delete_guest_account', 'End guest session', 'إنهاء جلسة الزائر')"
      :description="t('delete_guest_confirm', 'End this guest session? You can start a new one at any time.', 'إنهاء جلسة الزائر؟ يمكنك بدء واحدة جديدة في أي وقت.')"
      :confirm-label="t('end_session', 'End session', 'إنهاء الجلسة')"
      :loading="deletingGuest"
      @confirm="deleteGuestAccount"
    />
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['require-user', 'verified'],
  name: 'home',
})

const { t } = useLang()
const { name: siteName } = useSiteConfig()
useHead({ title: t('home', 'Home', 'الرئيسية') })
useSeoMeta({ description: () => t('home_public_note', 'Everything you need, in one place.', 'كل ما تحتاجه في مكان واحد.') })

const api = useApi()
const { profile, isMember, isGuest, refreshIdentity, clearLocal } = useAuthSession()
const { appUsers, appGuests, hasAuthSystem, isOtpMode } = useAuthConfig()
const { pages } = usePages()
const { appStore, googlePlay, appGallery } = useAppSettings()
const { mediaAsset } = useMedia('web', 'branding')
const { toast } = useToast()

const logo = computed(() => mediaAsset('logo', '/logo.png'))
const storeBadges = computed(() => [
  ...appStore.value.map((i) => ({ ...i, block: 'app_store' })),
  ...googlePlay.value.map((i) => ({ ...i, block: 'google_play' })),
  ...appGallery.value.map((i) => ({ ...i, block: 'app_gallery' })),
])

const creatingGuest = ref(false)
const deletingGuest = ref(false)
const deleteGuestDialogOpen = ref(false)

const createGuestAccount = async () => {
  creatingGuest.value = true
  try {
    await api('/api/guest', { method: 'POST' })
    await refreshIdentity()
  } catch (err) {
    toast({ title: err?.data?.message ?? t('error_generic', 'Something went wrong. Please try again.', 'حدث خطأ ما. حاول مجددًا.'), variant: 'destructive' })
  } finally {
    creatingGuest.value = false
  }
}

const deleteGuestAccount = async () => {
  deletingGuest.value = true
  try {
    await api('/api/delete-account', { method: 'DELETE' })
    await clearLocal()
    deleteGuestDialogOpen.value = false
    await navigateTo(appUsers.value ? { name: 'login' } : { name: 'home' })
  } catch (err) {
    toast({ title: err?.data?.message ?? t('error_generic', 'Something went wrong. Please try again.', 'حدث خطأ ما. حاول مجددًا.'), variant: 'destructive' })
  } finally {
    deletingGuest.value = false
  }
}
</script>
