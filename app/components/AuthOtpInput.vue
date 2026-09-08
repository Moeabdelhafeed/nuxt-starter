<template>
  <div class="flex justify-center gap-2" dir="ltr">
    <input
      v-for="(digit, index) in digits"
      :key="index"
      :id="index === 0 ? id : undefined"
      :ref="(el) => { boxes[index] = el }"
      :value="digit"
      :disabled="disabled"
      :aria-label="t('otp_digit', 'Digit :n of :total', 'الرقم :n من :total', { n: index + 1, total: length })"
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      maxlength="1"
      class="h-10 w-10 rounded-md border border-input bg-transparent text-center text-lg font-semibold text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
      @input="onInput(index, $event)"
      @keydown="onKeydown(index, $event)"
      @paste="onPaste($event)"
    >
  </div>
</template>

<script setup>
const props = defineProps({
  id: { type: String, default: undefined },
  length: { type: Number, default: 6 },
  disabled: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: true },
})

const emit = defineEmits(['complete'])
const modelValue = defineModel({ type: String, default: '' })
const { t } = useLang('web', 'general')

const digits = computed(() => {
  const chars = modelValue.value.split('')
  return Array.from({ length: props.length }, (_, i) => chars[i] ?? '')
})

const boxes = ref([])

const setDigit = (index, value) => {
  const chars = modelValue.value.split('')
  chars[index] = value
  modelValue.value = chars.join('').slice(0, props.length)
}

const onInput = (index, event) => {
  const raw = event.target.value.replace(/\D/g, '')
  event.target.value = digits.value[index] ?? ''

  if (!raw) {
    setDigit(index, '')
    return
  }

  // Autofill/IME can land several digits in one keystroke; keep the last and let
  // focus advance so the remaining boxes' own input events fill in.
  setDigit(index, raw.at(-1))
  boxes.value[index + 1]?.focus()
}

const onKeydown = (index, event) => {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    boxes.value[index - 1]?.focus()
  }
}

const onPaste = (event) => {
  const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '')
  if (!pasted) return
  event.preventDefault()
  modelValue.value = pasted.slice(0, props.length)
  boxes.value[Math.min(pasted.length, props.length - 1)]?.focus()
}

watch(modelValue, (value) => {
  if (value.length === props.length) emit('complete', value)
})

onMounted(() => { if (props.autofocus) boxes.value[0]?.focus() })
</script>
