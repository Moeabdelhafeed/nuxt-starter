<template>
  <header class="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
      <NuxtLink to="/" class="flex items-center gap-2.5 rounded-md font-semibold focus-visible:outline-2 focus-visible:outline-ring" :aria-label="siteName">
        <AppMedia v-if="logo" :src="logo" alt="" class="h-8 w-auto object-contain" />
        <span>{{ siteName }}</span>
      </NuxtLink>

      <nav v-if="pages.length" class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" :aria-label="t('site_pages', 'Pages', 'الصفحات')">
        <NuxtLink
          v-for="p in pages"
          :key="p.id"
          :to="`/${p.slug}`"
          class="rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          active-class="text-foreground"
        >{{ p.name }}</NuxtLink>
      </nav>

      <div class="ms-auto flex items-center gap-2">
        <LanguageSwitcher />

        <template v-if="hasAuthSystem">
          <template v-if="isMember">
            <Button variant="ghost" size="sm" as-child>
              <NuxtLink to="/profile">
                <LucideUser class="size-4" />
                <span class="hidden sm:inline">{{ profile?.name || t('profile', 'Profile', 'الملف الشخصي') }}</span>
              </NuxtLink>
            </Button>
            <Button variant="outline" size="sm" :disabled="signingOut" @click="onSignOut">
              <LucideLoaderCircle v-if="signingOut" class="size-4 animate-spin" />
              <LucideLogOut v-else class="size-4" />
              <span class="hidden sm:inline">{{ t('sign_out', 'Sign out', 'تسجيل الخروج') }}</span>
            </Button>
          </template>
          <template v-else-if="appUsers">
            <Button size="sm" as-child>
              <NuxtLink to="/login">{{ t('sign_in', 'Sign in', 'تسجيل الدخول') }}</NuxtLink>
            </Button>
            <Button v-if="!isOtpMode" variant="outline" size="sm" class="hidden sm:inline-flex" as-child>
              <NuxtLink to="/register">{{ t('register', 'Register', 'إنشاء حساب') }}</NuxtLink>
            </Button>
          </template>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
const { t } = useLang('web', 'general')
const { name: siteName } = useSiteConfig()
const { pages } = usePages()
const { appUsers, hasAuthSystem, isOtpMode } = useAuthConfig()
const { profile, isMember, signOut } = useAuthSession()
const { mediaAsset } = useMedia('web', 'branding')
const { toast } = useToast()

const logo = computed(() => mediaAsset('logo', '/logo.png'))

const signingOut = ref(false)
const onSignOut = async () => {
  signingOut.value = true
  try {
    await signOut()
    toast({ title: t('signed_out', 'Signed out.', 'تم تسجيل الخروج.'), variant: 'success' })
    await navigateTo('/login')
  } finally {
    signingOut.value = false
  }
}
</script>
