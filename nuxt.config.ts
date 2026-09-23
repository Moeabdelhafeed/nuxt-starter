import tailwindcss from "@tailwindcss/vite"

// ── Per-project settings ─────────────────────────────────────────────────────
// Fill these in when starting a project. They resolve at build time, so a deploy
// variable cannot override them — this is the place to change them.
const SITE_URL = ''          // e.g. 'https://example.com'. Empty is fine in development.
const PUSHER_APP_KEY = ''    // public, client-side key — not a secret.
const PUSHER_APP_CLUSTER = ''


// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Everything the project needs to boot lives here, not in a `.env` — Nuxt still lets a
  // deploy override any of it with the matching `NUXT_*` variable. The ONE exception is
  // the API token below: keep secrets in the environment, never in a committed file.
  runtimeConfig: {
    xApiToken: '',        // NUXT_X_API_TOKEN — secret. Never hardcode it; see .env.example.
    apiBaseUrl: 'http://localhost:8000', // NUXT_API_BASE_URL overrides this on a deploy.
    trustProxy: false,    // NUXT_TRUST_PROXY — true only behind a reverse proxy that appends the real client IP to X-Forwarded-For.
    public: {
      baseUrl: '',        // own origin (relative). Client fetches hit Nitro proxy, not Laravel directly.
      translationsMode: 'remote', // 'remote' | 'local'
      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        appId: '',
      },
    },
  },

  echo: {
    key: PUSHER_APP_KEY,
    cluster: PUSHER_APP_CLUSTER,
    broadcaster: 'pusher', // available: reverb, pusher
    authentication: {
      mode: 'token',
      baseUrl: '', // own origin → /api/broadcasting/auth proxied to Laravel
      authEndpoint: '/api/broadcasting/auth',
    },
  },

  // The bearer token lives in a JS-readable cookie (token mode), so XSS containment is the
  // second layer: no framing, no plugins, no base hijack, no sniffing, tight referrers.
  routeRules: {
    '/**': {
      headers: {
        'Content-Security-Policy': "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
    },
  },

  css: [
    "~/assets/css/main.css",
  ],
  sanctum: {
    baseUrl: '', // own origin → /api/* proxied to Laravel by server/api/[...].js
    mode: 'token',
    // app/plugins/00.bootstrap-config.js already loads /api/user (alongside
    // /api/config); leaving this on makes every render fetch the user twice.
    client: {
      initialRequest: false,
    },
    endpoints: {
      login: '/api/login',
      logout: '/api/logout',
      user: '/api/user',
    },
    redirect: {
      keepRequestedRoute: false,
      onLogin: '/',
      onLogout: false, // useAuthSession().signOut() decides where to go
      onAuthOnly: '/login',
      onGuestOnly: '/',
    },
  },

  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'class-variance-authority',
        'reka-ui',
        'clsx',
        'tailwind-merge',
        'nuxt-laravel-echo > pusher-js'
      ]
    },
    plugins: [
      tailwindcss(),
    ]
  },

  // Public origin + name, for canonical/og URLs, sitemap, robots and the <title> template.
  // Not pinned here on purpose: nuxt-site-config reads NUXT_PUBLIC_SITE_URL / NUXT_PUBLIC_SITE_NAME
  // at runtime, so one build serves any host. Only the fallback name is fixed.
  site: {
    name: 'Starter',
  },

  // Account and auth screens are never search results.
  robots: {
    disallow: ['/login', '/register', '/verify', '/verify-login', '/forgot-password', '/profile', '/devices'],
  },

  i18n: {
    // Only when known: a localhost fallback here would be picked up by nuxt-site-config
    // as the canonical origin and win over the real one.
    ...(SITE_URL ? { baseUrl: SITE_URL } : {}),
    locales: [
      { code: 'en', language: 'en-US', file: 'en.json', name: 'English', dir: 'ltr' },
      { code: 'ar', language: 'ar-SA', file: 'ar.json', name: 'العربية', dir: 'rtl' }
    ],
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root', // recommended
      fallbackLocale: 'en',
    },
    compilation: {
      strictMessage: false,
    },
  },

  shadcn: {
    /**
     * Prefix for all the imported component.
     * @default "Ui"
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * Will respect the Nuxt aliases.
     * @link https://nuxt.com/docs/api/nuxt-config#alias
     * @default "@/components/ui"
     */
    componentDir: '@/components/ui'
  },

  seo: {
    automaticDefaults: false
  },

  modules: [
    "@nuxtjs/i18n",
    'shadcn-nuxt',
    '@vueuse/nuxt',
    'nuxt-lucide-icons',
    '@nuxtjs/seo',
    'nuxt-auth-sanctum',
    'nuxt-laravel-echo',
  ],
})