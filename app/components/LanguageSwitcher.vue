<template>
  <Select v-if="languages.length > 1" :model-value="lang?.code ?? ''" @update:model-value="setLanguage">
    <SelectTrigger size="sm" class="gap-2" :aria-label="t('language', 'Language', 'اللغة')">
      <AppImage
        v-if="lang?.image?.image_api"
        :src="lang.image"
        alt=""
        class="size-4 rounded-sm object-cover"
      />
      <LucideLanguages v-else class="size-4 text-muted-foreground" />
      <SelectValue :placeholder="t('language', 'Language', 'اللغة')" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="l in languages" :key="l.code" :value="l.code">
        <span class="flex items-center gap-2">
          <AppImage v-if="l.image?.image_api" :src="l.image" alt="" class="size-4 rounded-sm object-cover" />
          <span>{{ l.native_name ?? l.name }}</span>
        </span>
      </SelectItem>
    </SelectContent>
  </Select>
</template>

<script setup>
const { lang, languages, setLanguage, t } = useLang()
</script>
