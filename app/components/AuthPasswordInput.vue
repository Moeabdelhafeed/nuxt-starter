<template>
  <div class="relative">
    <Input
      :id="id"
      v-model="modelValue"
      :type="visible ? 'text' : 'password'"
      class="pe-10"
      v-bind="$attrs"
    />
    <button
      type="button"
      class="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
      :aria-label="visible ? t('hide_password', 'Hide password', 'إخفاء كلمة المرور') : t('show_password', 'Show password', 'إظهار كلمة المرور')"
      @click="visible = !visible"
    >
      <LucideEyeOff v-if="visible" class="size-4" />
      <LucideEye v-else class="size-4" />
    </button>
  </div>
</template>

<script setup>
defineOptions({ inheritAttrs: false })

defineProps({
  id: { type: String, required: true },
})

const modelValue = defineModel({ type: String, default: '' })
const { t } = useLang('web', 'general')
const visible = ref(false)
</script>
