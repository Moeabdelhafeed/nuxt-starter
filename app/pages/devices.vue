<template>
  <div class="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">{{ t('active_devices', 'Active devices', 'الأجهزة النشطة') }}</h1>
        <p class="text-sm text-muted-foreground">{{ t('active_devices_description', 'Devices currently signed in to your account.', 'الأجهزة المسجّلة الدخول حاليًا.') }}</p>
      </div>
      <Button variant="outline" size="sm" as-child>
        <NuxtLink to="/profile">{{ t('back_to_profile', 'Back to profile', 'عودة للملف') }}</NuxtLink>
      </Button>
    </div>

    <Card class="mt-6">
      <CardContent class="pt-6">
        <ul v-if="pending" class="grid gap-2" aria-busy="true">
          <li v-for="i in 3" :key="i" class="flex items-center justify-between rounded-md border p-3">
            <div class="grid gap-2"><AppSkeleton class="h-4 w-40" /><AppSkeleton class="h-3 w-24" /></div>
            <AppSkeleton class="h-8 w-20" />
          </li>
        </ul>
        <div v-else-if="!devices.length" class="py-10 text-center">
          <LucideMonitorSmartphone class="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p class="mt-3 text-sm text-muted-foreground">{{ t('no_devices', 'No devices found.', 'لا توجد أجهزة.') }}</p>
        </div>
        <ul v-else class="grid gap-2">
          <li v-for="d in devices" :key="d.id" class="flex items-center justify-between gap-4 rounded-md border p-3 text-sm">
            <div class="flex min-w-0 items-start gap-3">
              <LucideSmartphone v-if="d.platform === 'ios' || d.platform === 'android'" class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <LucideMonitor v-else class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div class="min-w-0">
                <p class="flex flex-wrap items-center gap-2 font-medium">
                  <span class="truncate">{{ d.device_name || t('unknown_device', 'Unknown device', 'جهاز غير معروف') }}</span>
                  <span v-if="d.is_current" class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{{ t('this_device', 'This device', 'هذا الجهاز') }}</span>
                </p>
                <p class="text-xs text-muted-foreground">{{ [d.platform, d.ip].filter(Boolean).join(' · ') }}</p>
                <p v-if="d.last_seen_at" class="text-xs text-muted-foreground">{{ t('last_seen', 'Last seen :time', 'آخر ظهور :time', { time: formatDate(d.last_seen_at) }) }}</p>
              </div>
            </div>
            <Button
              v-if="!d.is_current"
              size="sm"
              variant="outline"
              :disabled="revoking === d.id"
              :aria-label="t('revoke_device', 'Sign out :device', 'تسجيل خروج :device', { device: d.device_name || '' })"
              @click="onRevoke(d.id)"
            >
              <LucideLoaderCircle v-if="revoking === d.id" class="size-4 animate-spin" />
              {{ t('revoke', 'Sign out', 'تسجيل الخروج') }}
            </Button>
          </li>
        </ul>
        <FormAlert class="mt-4" :message="error" />
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth-mode', 'require-registered', 'verified', 'multi-session-only'],
  name: 'devices',
})

const { t } = useLang('web', 'profile')
useHead({ title: t('active_devices', 'Active devices', 'الأجهزة النشطة') })

const client = useApi()
const { formatDate } = useDateFormat()
const { toast } = useToast()

const { data, pending, refresh } = useApiFetch('/api/devices', { key: 'devices' })
const devices = computed(() => data.value?.data?.devices ?? [])

const revoking = ref(null)
const error = ref('')

const onRevoke = async (id) => {
  error.value = ''
  revoking.value = id
  try {
    await client(`/api/devices/${id}`, { method: 'DELETE' })
    await refresh()
    toast({ title: t('device_signed_out', 'Device signed out.', 'تم تسجيل خروج الجهاز.'), variant: 'success' })
  } catch (err) {
    error.value = err?.data?.message ?? t('error_generic', 'Something went wrong. Please try again.', 'حدث خطأ ما. حاول مجددًا.')
  } finally {
    revoking.value = null
  }
}
</script>
