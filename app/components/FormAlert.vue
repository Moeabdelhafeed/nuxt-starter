<template>
  <div
    v-if="message"
    role="alert"
    :class="['flex items-start gap-2 rounded-md border px-3 py-2 text-sm', tone[variant]]"
  >
    <LucideCircleAlert v-if="variant === 'destructive'" class="mt-0.5 size-4 shrink-0" />
    <LucideCircleCheck v-else-if="variant === 'success'" class="mt-0.5 size-4 shrink-0" />
    <LucideInfo v-else class="mt-0.5 size-4 shrink-0" />
    <span>{{ message }}</span>
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, default: '' },
  variant: { type: String, default: 'destructive' },
})

const tone = {
  destructive: 'border-destructive/30 bg-destructive/5 text-destructive',
  success: 'border-success/30 bg-success/5 text-success',
  warning: 'border-warning/30 bg-warning/5 text-warning',
  info: 'border-border bg-muted text-muted-foreground',
}
</script>
