<template>
  <div class="grid gap-2">
    <Label :for="id" class="flex items-center gap-1.5">
      <slot name="label">{{ label }}</slot>
      <span v-if="optional" class="text-xs font-normal text-muted-foreground">{{ t('optional', '(optional)', '(اختياري)') }}</span>
    </Label>
    <slot :field="field" />
    <p v-if="error" :id="`${id}-error`" role="alert" class="text-xs text-destructive">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="text-xs text-muted-foreground">{{ hint }}</p>
  </div>
</template>

<script setup>
/**
 * Label + control + message, wired for assistive tech: the slot gets `field` to spread
 * onto the input (`<Input v-bind="field" />`) so `aria-invalid` and `aria-describedby`
 * always point at the message that is actually rendered.
 */
const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, default: '' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  optional: { type: Boolean, default: false },
})

const { t } = useLang('web', 'general')

const field = computed(() => ({
  id: props.id,
  'aria-invalid': props.error ? true : undefined,
  'aria-describedby': props.error ? `${props.id}-error` : (props.hint ? `${props.id}-hint` : undefined),
}))
</script>
