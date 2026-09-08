let seq = 0

/**
 * App-wide notifications. State lives in `useState` so the layout's <AppToaster> and any
 * caller share one list; toasts are client-only (nothing to announce during SSR).
 */
export const useToast = () => {
  const toasts = useState('toasts', () => [])

  const dismiss = (id) => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  /** @param {{ title: string, description?: string, variant?: 'default'|'success'|'destructive', duration?: number }} options */
  const toast = ({ title, description = '', variant = 'default', duration = 4500 }) => {
    if (!import.meta.client) return
    const id = ++seq
    toasts.value = [...toasts.value, { id, title, description, variant }]
    if (duration > 0) setTimeout(() => dismiss(id), duration)
    return id
  }

  return { toasts, toast, dismiss }
}
