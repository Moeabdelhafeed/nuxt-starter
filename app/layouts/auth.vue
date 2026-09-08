<template>
  <Html :lang="code" :dir="dir" class="light">
    <Body>
      <div class="flex min-h-svh flex-col bg-muted/40">
        <div class="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <NuxtLink to="/" class="text-sm font-medium text-muted-foreground hover:text-foreground">{{ siteName }}</NuxtLink>
          <LanguageSwitcher />
        </div>
        <main id="main" class="flex flex-1 items-center justify-center p-4 sm:p-6">
          <slot />
        </main>
      </div>
      <AppToaster />
    </Body>
  </Html>
</template>

<script setup>
const { code, dir } = useLang()
const { name: siteName } = useSiteConfig()
</script>
