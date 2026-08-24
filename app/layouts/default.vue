<template>
  <Html :lang="code" :dir="dir" class="light">
    <Body>
      <div class="flex min-h-svh flex-col">
        <NuxtPage />
        <AppFooter />
      </div>
      <LanguageSwitcher />
    </Body>
  </Html>
</template>

<script setup>
const { code, dir } = useLang()
</script>

<style  scoped>
</style>