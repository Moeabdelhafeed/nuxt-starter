<template>
  <div v-if="providers.length" class="grid gap-2">
    <Button
      v-for="p in providers"
      :key="p"
      type="button"
      variant="outline"
      :disabled="loading || pending === p"
      class="w-full justify-center gap-2"
      @click="onClick(p)"
    >
      <LucideLoaderCircle v-if="pending === p" class="size-4 animate-spin" />
      <span v-else :style="{ backgroundColor: providerColor(p) }" class="size-3 rounded-full" aria-hidden="true" />
      {{ pending === p
        ? t('please_wait', 'Please wait...', 'يرجى الانتظار...')
        : t(`continue_with_${p.replace('.', '_')}`, `Continue with ${providerLabel(p, 'en')}`, `المتابعة عبر ${providerLabel(p, 'ar')}`) }}
    </Button>
  </div>
</template>

<script setup>
defineProps({
  providers: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['select'])

const { t } = useLang('web', 'auth')
const { signInWithProvider } = useFirebaseAuth()
const pending = ref(null)

const providerColor = (p) => ({
  'google.com': '#4285F4',
  'apple.com': '#000000',
  'facebook.com': '#1877F2',
  'twitter.com': '#1DA1F2',
  'github.com': '#181717',
  'microsoft.com': '#00A4EF',
  'yahoo.com': '#6001D2',
}[p] ?? '#888')

const onClick = async (p) => {
  pending.value = p
  try {
    const { idToken } = await signInWithProvider(p)
    emit('select', { provider: p, idToken })
  } catch (err) {
    emit('select', { provider: p, error: err })
  } finally {
    pending.value = null
  }
}
</script>
