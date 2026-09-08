<template>
  <button
    type="button"
    class="rounded-md font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
    :disabled="cooldown.active.value || busy"
    @click="emit('resend')"
  >
    {{ cooldown.active.value
      ? t('resend_in_seconds', 'Resend in :seconds seconds', 'إعادة الإرسال خلال :seconds ثانية', { seconds: cooldown.remaining.value })
      : t('resend_otp', 'Resend code', 'إعادة إرسال الرمز') }}
  </button>
</template>

<script setup>
/** `cooldown` is the object returned by `useCooldown()`. */
defineProps({
  cooldown: { type: Object, required: true },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['resend'])
const { t } = useLang('web', 'auth')
</script>
