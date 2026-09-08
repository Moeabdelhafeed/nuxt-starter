<template>
  <div ref="root" class="relative flex gap-2" dir="ltr">
    <span
      v-if="locked"
      class="flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
    >
      <span class="text-base leading-none">{{ flag(country.iso2) }}</span>
      <span class="text-muted-foreground">+{{ country.dial }}</span>
    </span>
    <button
      v-else
      type="button"
      class="group flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-label="t('select_country', 'Select country', 'اختر الدولة')"
      @click="open = !open"
      @keydown.escape="open = false"
    >
      <span class="text-base leading-none">{{ flag(country.iso2) }}</span>
      <span class="text-muted-foreground group-hover:text-accent-foreground">+{{ country.dial }}</span>
      <LucideChevronDown class="size-3.5 text-muted-foreground group-hover:text-accent-foreground" />
    </button>

    <input
      :id="id"
      v-model="digits"
      type="tel"
      inputmode="tel"
      :placeholder="placeholder"
      class="h-9 min-w-0 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 md:text-sm"
      v-bind="$attrs"
      @input="digits = $event.target.value.replace(/\D/g, '')"
    >

    <div
      v-if="open"
      class="absolute start-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg"
      @keydown.escape="open = false"
    >
      <input
        v-model="search"
        type="text"
        :placeholder="t('search_country', 'Search country', 'ابحث عن دولة')"
        class="w-full border-b bg-transparent px-3 py-2 text-sm outline-none"
        @keydown.stop
      >
      <ul role="listbox" class="max-h-64 overflow-y-auto py-1">
        <li
          v-for="c in filtered"
          :key="c.iso2"
          role="option"
          :aria-selected="c.iso2 === country.iso2"
        >
          <button
            type="button"
            class="group flex w-full items-center gap-2.5 px-3 py-2 text-start text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            @click="select(c)"
          >
            <span class="text-base leading-none">{{ flag(c.iso2) }}</span>
            <span class="min-w-0 flex-1 truncate">{{ code === 'ar' ? c.ar : c.en }}</span>
            <span class="text-muted-foreground group-hover:text-accent-foreground">+{{ c.dial }}</span>
          </button>
        </li>
        <li v-if="!filtered.length" class="px-3 py-4 text-center text-sm text-muted-foreground">
          {{ t('no_results', 'No matches', 'لا نتائج') }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
defineOptions({ inheritAttrs: false })

const props = defineProps({
  id: { type: String, required: true },
  placeholder: { type: String, default: '5XXXXXXXX' },
  allowed: { type: [String, Array], default: 'all' },
})

const modelValue = defineModel({ type: String, default: '' })
const { t, code } = useLang('web', 'general')

const root = ref(null)
const open = ref(false)
const search = ref('')

const options = computed(() => {
  if (!Array.isArray(props.allowed) || !props.allowed.length) return COUNTRIES
  const allow = props.allowed.map((c) => String(c).toUpperCase())
  return COUNTRIES.filter((c) => allow.includes(c.iso2))
})
const locked = computed(() => options.value.length === 1)

// Regional-indicator pair: a flag emoji from two letters, no image asset.
const flag = (iso2) => String.fromCodePoint(...[...iso2.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)))

// Same default on server and client — hydration compares text nodes, so the visitor's
// country is detected after mount, once there's no SSR output left to disagree with.
const country = ref(options.value[0])
const digits = ref('')

onMounted(() => {
  if (digits.value || locked.value) return
  // Timezone reflects where the device is; navigator.language only reflects UI language.
  try {
    const region = TIMEZONE_COUNTRIES[Intl.DateTimeFormat().resolvedOptions().timeZone]
    const match = region && options.value.find((c) => c.iso2 === region)
    if (match) { country.value = match; return }
  } catch {}
  try {
    const region = new Intl.Locale(navigator.language).maximize().region
    const match = options.value.find((c) => c.iso2 === region)
    if (match) country.value = match
  } catch {}
})

const applyModelValue = (value) => {
  const trimmed = String(value ?? '').replace(/^\+/, '')
  if (!trimmed) return
  const match = options.value
    .filter((c) => trimmed.startsWith(c.dial))
    .sort((a, b) => b.dial.length - a.dial.length)[0]
  if (match) {
    country.value = match
    digits.value = trimmed.slice(match.dial.length)
  }
}
applyModelValue(modelValue.value)

watch([country, digits], () => {
  modelValue.value = digits.value ? `+${country.value.dial}${digits.value}` : ''
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return options.value
  return options.value.filter((c) =>
    c.en.toLowerCase().includes(q) || c.ar.includes(q) || c.dial.includes(q))
})

const select = (c) => {
  country.value = c
  open.value = false
  search.value = ''
}

onClickOutside(root, () => { open.value = false })
</script>
