<template>
  <ConfigProvider :dir="dir">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </ConfigProvider>
</template>

<script setup>
import { ConfigProvider } from 'reka-ui'

const { dir, code } = useLang()
const { name } = useSiteConfig()

// Site-wide head: what every page inherits and overrides where it has something better.
useHead({
  titleTemplate: (title) => (title ? `${title} · ${name}` : name),
  meta: [{ name: 'format-detection', content: 'telephone=no' }],
})

useSeoMeta({
  ogSiteName: name,
  ogType: 'website',
  ogLocale: () => (code.value === 'ar' ? 'ar_SA' : 'en_US'),
})
</script>
