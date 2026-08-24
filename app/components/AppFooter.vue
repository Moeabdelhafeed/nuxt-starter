<template>
  <footer
    v-if="hasContent"
    class="mt-auto border-t bg-background/60"
  >
    <div class="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-8 text-center">
      <nav v-if="pages.length" class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <NuxtLink
          v-for="p in pages"
          :key="p.id"
          :to="`/${p.slug}`"
          class="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >{{ p.name }}</NuxtLink>
      </nav>

      <ul v-if="social.length" class="flex flex-wrap items-center justify-center gap-3">
        <li v-for="item in social" :key="item.id">
          <a
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            :title="item.text"
            class="flex size-9 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.text"
              class="size-4 object-contain"
            />
            <span v-else class="text-xs font-medium">{{ initial(item.text) }}</span>
          </a>
        </li>
      </ul>

      <ul v-if="contact.length" class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <li v-for="item in contact" :key="item.id">
          <a
            :href="item.url"
            class="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.text"
              class="size-4 object-contain"
            />
            {{ item.text }}
          </a>
        </li>
      </ul>

      <ul v-if="storeBadges.length" class="flex flex-wrap items-center justify-center gap-3">
        <li v-for="item in storeBadges" :key="`${item.block}-${item.id}`">
          <a :href="item.url" target="_blank" rel="noopener noreferrer" :title="item.text">
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.text"
              class="h-10 object-contain"
            />
            <span
              v-else
              class="inline-flex h-10 items-center rounded-md border px-3 text-sm text-muted-foreground"
            >{{ item.text }}</span>
          </a>
        </li>
      </ul>
    </div>
  </footer>
</template>

<script setup>
const { social, contact, appStore, googlePlay, appGallery } = useAppSettings()
const { pages } = usePages()

const storeBadges = computed(() => [
  ...appStore.value.map((i) => ({ ...i, block: 'app_store' })),
  ...googlePlay.value.map((i) => ({ ...i, block: 'google_play' })),
  ...appGallery.value.map((i) => ({ ...i, block: 'app_gallery' })),
])

const hasContent = computed(() =>
  pages.value.length ||
  social.value.length ||
  contact.value.length ||
  storeBadges.value.length,
)

const initial = (text) => (text?.trim()?.[0] ?? '?').toUpperCase()
</script>
