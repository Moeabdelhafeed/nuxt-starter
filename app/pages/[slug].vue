<template>
  <article class="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
    <div v-if="pending" class="grid gap-4" aria-busy="true">
      <AppSkeleton class="h-8 w-2/3" />
      <AppSkeleton class="aspect-video w-full" />
      <AppSkeleton class="h-4 w-full" />
      <AppSkeleton class="h-4 w-5/6" />
    </div>
    <template v-else-if="page">
      <h1 class="text-3xl font-bold tracking-tight">{{ page.name }}</h1>
      <AppImage
        v-if="page.image?.image_api"
        :src="page.image"
        :alt="page.name"
        class="mt-6 aspect-video w-full rounded-lg object-cover"
      />
      <div
        class="prose prose-neutral mt-6 max-w-none [&_a]:text-primary [&_a]:underline [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:my-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:ps-6"
        v-html="page.content"
      />
    </template>
  </article>
</template>

<script setup>
definePageMeta({ name: 'page' })

const route = useRoute()
const { page, pending, error } = await usePage(() => route.params.slug)

// A slug the CMS does not know is a real 404, status code and all — not a 200 that says
// "not found" in the body. Anything else that failed upstream is the API's problem, not
// a missing page.
if (!page.value) {
  const status = error.value?.statusCode ?? error.value?.status
  throw createError({ statusCode: !status || status === 404 ? 404 : 502 })
}

const description = computed(() => String(page.value?.content ?? '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 160))

useSeoMeta({
  title: () => page.value?.name ?? '',
  description,
  ogTitle: () => page.value?.name ?? '',
  ogDescription: description,
  ogImage: () => page.value?.image?.image_api ?? undefined,
})
</script>
