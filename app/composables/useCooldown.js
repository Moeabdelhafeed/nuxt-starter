/** A countdown in whole seconds — resend-code buttons wait on it. */
export const useCooldown = (seconds = 60) => {
  const remaining = ref(0)
  let timer = null

  const stop = () => {
    if (timer) clearInterval(timer)
    timer = null
  }

  const start = () => {
    remaining.value = seconds
    stop()
    timer = setInterval(() => {
      remaining.value -= 1
      if (remaining.value <= 0) {
        remaining.value = 0
        stop()
      }
    }, 1000)
  }

  onUnmounted(stop)

  return { remaining, active: computed(() => remaining.value > 0), start }
}
