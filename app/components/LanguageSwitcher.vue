<template>
  <div class="fixed end-4 bottom-4 z-50 flex justify-center">
    <div class="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 shadow-sm">
      <img
        v-if="lang?.image?.image_api"
        :src="lang.image.image_api"
        :alt="lang.code"
        class="h-5 w-5 rounded-sm object-cover"
      />
      <Select :model-value="lang?.code ?? ''" @update:model-value="setLanguage">
        <SelectTrigger
          class="h-8 min-w-32 border-0 bg-transparent shadow-none focus-visible:ring-0"
        >
          <SelectValue :placeholder="t('language', 'Language', 'اللغة')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="l in languages" :key="l.code" :value="l.code">
            <span class="flex items-center gap-2">
              <img
                v-if="l.image?.image_api"
                :src="l.image.image_api"
                :alt="l.code"
                class="h-4 w-4 rounded-sm object-cover"
              />
              <span>{{ l.native_name ?? l.name }}</span>
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>

<script setup>
const { lang, languages, setLanguage, t } = useLang()
</script>
