<template>
  <AuthPhoneInput
    v-if="kind === 'phone'"
    :id="id"
    v-model="modelValue"
    :allowed="allowedPhoneCountries"
    autocomplete="tel"
    v-bind="$attrs"
  />
  <Input
    v-else
    :id="id"
    v-model="modelValue"
    :type="kind === 'email' ? 'email' : 'text'"
    :inputmode="kind === 'email' ? 'email' : undefined"
    :autocomplete="kind === 'email' ? 'email' : 'username'"
    :placeholder="placeholderFor(kind)"
    v-bind="$attrs"
  />
</template>

<script setup>
/** The one input for "your email / phone / username", shaped by the declared kind. */
defineOptions({ inheritAttrs: false })
defineProps({
  id: { type: String, required: true },
  kind: { type: String, default: 'email' },
})
const modelValue = defineModel({ type: String, default: '' })
const { allowedPhoneCountries, placeholderFor } = useAuthConfig()
</script>
