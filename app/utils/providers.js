const LABELS = {
  'google.com': { en: 'Google', ar: 'جوجل' },
  'apple.com': { en: 'Apple', ar: 'آبل' },
  'facebook.com': { en: 'Facebook', ar: 'فيسبوك' },
  'twitter.com': { en: 'Twitter', ar: 'تويتر' },
  'github.com': { en: 'GitHub', ar: 'جيت هاب' },
  'microsoft.com': { en: 'Microsoft', ar: 'مايكروسوفت' },
  'yahoo.com': { en: 'Yahoo', ar: 'ياهو' },
}

/** Human name for a Firebase provider id, in the given locale. */
export const providerLabel = (providerId, locale = 'en') =>
  LABELS[providerId]?.[locale] ?? LABELS[providerId]?.en ?? providerId
