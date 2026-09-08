<template>
  <Html :lang="code" :dir="dir" class="light">
    <Body>
      <main class="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-6 py-16 text-center">
        <p class="text-6xl font-black leading-none tracking-tight text-muted-foreground/40 sm:text-7xl">{{ status }}</p>
        <h1 class="mt-6 max-w-md text-2xl font-semibold sm:text-3xl">{{ copy.title }}</h1>
        <p class="mt-3 max-w-sm text-muted-foreground">{{ copy.body }}</p>
        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" @click="handleError">{{ copy.home }}</Button>
          <Button v-if="!isNotFound" size="lg" variant="outline" @click="reload">{{ copy.retry }}</Button>
        </div>
      </main>
    </Body>
  </Html>
</template>

<script setup>
/**
 * 404s and crashes both land here. Deliberately self-contained — no useLang, no fetch:
 * this renders when something already failed, and one more request would be one more
 * thing to fail. Locale comes off the cookie, copy is inline.
 */
const props = defineProps({
  error: { type: Object, default: () => ({}) },
})

const lang = useCookie('lang')
const code = computed(() => lang.value?.code ?? 'en')
const dir = computed(() => lang.value?.direction ?? 'ltr')

const status = computed(() => props.error?.statusCode ?? 500)
const isNotFound = computed(() => status.value === 404)

const COPY = {
  en: {
    notFound: { title: 'We could not find that page', body: 'The link you opened no longer exists, or it may have changed.' },
    failed: { title: 'Something went wrong', body: 'The page could not be loaded. Try again in a moment.' },
    home: 'Back to home',
    retry: 'Try again',
  },
  ar: {
    notFound: { title: 'لم نجد هذه الصفحة', body: 'الرابط الذي فتحته لم يعد موجودًا، أو ربما تغيّر.' },
    failed: { title: 'حدث خطأ ما', body: 'تعذّر تحميل الصفحة. حاول مرة أخرى بعد قليل.' },
    home: 'العودة للرئيسية',
    retry: 'حاول مرة أخرى',
  },
}

const copy = computed(() => {
  const set = COPY[code.value] ?? COPY.en
  return { ...(isNotFound.value ? set.notFound : set.failed), home: set.home, retry: set.retry }
})

const handleError = () => clearError({ redirect: '/' })
const reload = () => reloadNuxtApp()
</script>
