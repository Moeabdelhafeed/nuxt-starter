const uploadingKeys = new Set()
// Persists across renders so a missing key is only seeded once per (group:subGroup:key).
const seededMedia = new Set()

/**
 * Dynamic storage client — keyed media (image/video/file) by group + sub_group + key.
 * Mirrors `useLang`: one fetch per group returns every asset nested by sub_group; each
 * `useMedia(group, subGroup)` instance slices its own sub-group. Remote-only (files need
 * real storage — there is no local mode).
 *
 * Response shape from GET /api/media:
 *   data: { group, media: { [subGroup]: { [key]: { type, url, blurhash?, name?, size? } } } }
 */
export const useMedia = (group = 'web', subGroup = 'general') => {
  const {
    data: mediaData,
    refresh: refreshMedia,
    pending: mediaPending,
  } = useApiFetch('/api/media', {
    key: `media-${group}`,
    query: { group },
  })

  // Whole group nested by sub_group.
  const groupMedia = computed(() => mediaData.value?.data?.media ?? {})
  // The fetch has resolved (so a missing key is genuinely absent, not still loading).
  const ready = computed(() => mediaData.value !== null && mediaData.value !== undefined)

  // Full asset object { type, url, blurhash?, name?, size? } for a key.
  const mediaMeta = (key, { subGroup: sub } = {}) => {
    const slice = groupMedia.value?.[sub ?? subGroup] ?? {}
    return slice[key] ?? null
  }

  /**
   * Seed a missing key by uploading a local asset from Nuxt's /public folder.
   * Fetches the public path as a Blob, wraps it in a File, and uploads it. Client-only.
   */
  const seedMedia = async (key, defaultPath, effectiveSubGroup) => {
    const guardId = `${group}:${effectiveSubGroup}:${key}`
    if (seededMedia.has(guardId)) return
    seededMedia.add(guardId)
    try {
      const res = await fetch(defaultPath)
      if (!res.ok) throw new Error(`could not load ${defaultPath}`)
      const blob = await res.blob()
      const ext = (defaultPath.split(/[?#]/)[0].split('.').pop() || 'bin').toLowerCase()
      const file = new File([blob], `${key}.${ext}`, { type: blob.type || undefined })
      await uploadMedia(key, file, { subGroup: effectiveSubGroup })
    } catch {
      // Allow a later retry if the seed failed.
      seededMedia.delete(guardId)
    }
  }

  /**
   * Resolve a key's URL. If the backend has it, returns the stored URL. Otherwise, when a
   * `defaultPath` (a file in Nuxt's /public folder) is given, returns that path for immediate
   * render AND — once, client-side — uploads it to the backend so the key is registered
   * (exactly like `useLang().t(key, default)` seeds a missing translation).
   *
   * Signatures:
   *   media(key)
   *   media(key, defaultPath)
   *   media(key, defaultPath, { subGroup })
   *   media(key, { subGroup })            // no default, just an override
   *
   * @param {string} key
   * @param {string|{subGroup?:string}} [defaultPath]
   * @param {{ subGroup?: string }} [opts]
   * @returns {string|null}
   */
  const media = (key, defaultPath, opts = {}) => {
    if (defaultPath && typeof defaultPath === 'object') {
      opts = defaultPath
      defaultPath = undefined
    }
    const effectiveSubGroup = opts.subGroup ?? subGroup
    const url = (groupMedia.value?.[effectiveSubGroup] ?? {})[key]?.url

    if (url) return url

    if (defaultPath && ready.value && import.meta.client) {
      seedMedia(key, defaultPath, effectiveSubGroup)
    }
    return defaultPath ?? null
  }

  /**
   * Upload (create or replace) the asset at (key, group, sub_group). The backend infers the
   * type from the file's mime. Returns the API response, then refreshes the group.
   *
   * @param {string} key
   * @param {File|Blob} file
   * @param {{ subGroup?: string }} [opts]
   */
  const uploadMedia = async (key, file, { subGroup: sub } = {}) => {
    const effectiveSubGroup = sub ?? subGroup
    const guardId = `${group}:${effectiveSubGroup}:${key}`
    if (uploadingKeys.has(guardId)) return null
    uploadingKeys.add(guardId)

    try {
      const form = new FormData()
      form.append('group', group)
      form.append('sub_group', effectiveSubGroup)
      form.append('key', key)
      form.append('file', file)

      const res = await useApi()('/api/media', {
        method: 'POST',
        body: form,
      })
      await refreshMedia()
      return res
    } finally {
      uploadingKeys.delete(guardId)
    }
  }

  return {
    media,
    mediaMeta,
    groupMedia,
    uploadMedia,
    refreshMedia,
    mediaPending,
  }
}
