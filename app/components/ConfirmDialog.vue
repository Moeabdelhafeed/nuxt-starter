<template>
  <Dialog :open="open" @update:open="(value) => !loading && emit('update:open', value)">
    <DialogContent class="sm:max-w-md" :show-close-button="!loading">
      <DialogHeader>
        <DialogTitle :class="destructive ? 'text-destructive' : ''">{{ title }}</DialogTitle>
        <DialogDescription v-if="description">{{ description }}</DialogDescription>
      </DialogHeader>
      <slot />
      <DialogFooter class="gap-2 sm:gap-2">
        <Button variant="outline" :disabled="loading" @click="emit('update:open', false)">
          {{ cancelLabel || t('cancel', 'Cancel', 'إلغاء') }}
        </Button>
        <Button :variant="destructive ? 'destructive' : 'default'" :disabled="loading" @click="emit('confirm')">
          <LucideLoaderCircle v-if="loading" class="size-4 animate-spin" />
          {{ confirmLabel || t('confirm', 'Confirm', 'تأكيد') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
/** Yes/no dialog on shadcn's Dialog: focus trap, Escape, aria wiring come for free. */
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  confirmLabel: { type: String, default: '' },
  cancelLabel: { type: String, default: '' },
  destructive: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:open', 'confirm'])
const { t } = useLang('web', 'general')
</script>
