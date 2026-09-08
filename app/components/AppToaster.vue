<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4"
    role="status"
    aria-live="polite"
  >
    <TransitionGroup
      enter-active-class="transition duration-200"
      enter-from-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-for="item in toasts"
        :key="item.id"
        :class="['pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg', tone[item.variant] ?? tone.default]"
      >
        <LucideCircleCheck v-if="item.variant === 'success'" class="mt-0.5 size-4 shrink-0" />
        <LucideCircleAlert v-else-if="item.variant === 'destructive'" class="mt-0.5 size-4 shrink-0" />
        <LucideInfo v-else class="mt-0.5 size-4 shrink-0" />
        <div class="min-w-0 flex-1">
          <p class="font-medium">{{ item.title }}</p>
          <p v-if="item.description" class="mt-0.5 text-xs opacity-80">{{ item.description }}</p>
        </div>
        <button
          type="button"
          class="-me-1 rounded p-1 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-ring"
          :aria-label="t('dismiss', 'Dismiss', 'إغلاق')"
          @click="dismiss(item.id)"
        >
          <LucideX class="size-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
const { toasts, dismiss } = useToast()
const { t } = useLang('web', 'general')

const tone = {
  default: 'border-border bg-background text-foreground',
  success: 'border-success/40 bg-background text-success',
  destructive: 'border-destructive/40 bg-background text-destructive',
}
</script>
