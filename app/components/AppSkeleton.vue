<template>
  <div class="skeleton" :class="rounded ? 'rounded-full' : 'rounded-md'" aria-hidden="true" />
</template>

<script setup>
/** One placeholder block; size it from the caller (`class="h-4 w-24"`). The list it stands in carries `aria-busy`. */
defineProps({
  rounded: { type: Boolean, default: false },
})
</script>
