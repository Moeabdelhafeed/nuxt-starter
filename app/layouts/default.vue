<template>
  <Html :lang="code" :dir="dir" class="light">
    <Body>
      <NuxtPage />
      <LanguageSwitcher />
    </Body>
  </Html>
</template>

<script setup>
const { code, dir } = useLang()
</script>

<style  scoped>
</style>