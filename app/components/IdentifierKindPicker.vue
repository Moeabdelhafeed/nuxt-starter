<template>
  <div v-if="kinds.length > 1" role="group" :aria-label="label" class="flex flex-wrap gap-2">
    <Button
      v-for="kind in kinds"
      :key="kind"
      type="button"
      size="sm"
      :variant="modelValue === kind ? 'default' : 'outline'"
      :aria-pressed="modelValue === kind"
      @click="modelValue = kind"
    >{{ labelFor(kind) }}</Button>
  </div>
</template>

<script setup>
defineProps({
  kinds: { type: Array, default: () => [] },
  label: { type: String, default: '' },
})
const modelValue = defineModel({ type: String, default: '' })
const { labelFor } = useAuthConfig()
</script>
