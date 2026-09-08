<template>
  <Card class="w-full max-w-sm">
    <CardHeader class="gap-3">
      <AppMedia v-if="logo && showLogo" :src="logo" alt="" class="h-10 w-auto self-start object-contain" />
      <div class="grid gap-1.5">
        <CardTitle as="h1" class="text-2xl">{{ title }}</CardTitle>
        <CardDescription v-if="description">{{ description }}</CardDescription>
      </div>
    </CardHeader>
    <CardContent class="grid gap-6">
      <slot />
    </CardContent>
    <CardFooter v-if="$slots.footer" class="flex flex-wrap items-center justify-center gap-1 text-sm">
      <slot name="footer" />
    </CardFooter>
  </Card>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  showLogo: { type: Boolean, default: true },
})

const { mediaAsset } = useMedia('web', 'branding')
const logo = computed(() => mediaAsset('logo', '/logo.png'))
</script>
