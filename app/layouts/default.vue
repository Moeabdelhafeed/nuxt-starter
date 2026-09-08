<template>
  <Html :lang="code" :dir="dir" class="light">
    <Body>
      <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow">
        {{ t('skip_to_content', 'Skip to content', 'تخطّي إلى المحتوى') }}
      </a>
      <div class="flex min-h-svh flex-col bg-muted/40">
        <AppHeader />
        <main id="main" class="flex flex-1 flex-col">
          <slot />
        </main>
        <AppFooter />
      </div>
      <AppToaster />
    </Body>
  </Html>
</template>

<script setup>
const { code, dir, t } = useLang('web', 'general')
</script>
