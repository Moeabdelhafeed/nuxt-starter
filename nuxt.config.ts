import tailwindcss from "@tailwindcss/vite"

// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    xApiToken: '',        // NUXT_X_API_TOKEN — private, server-only. Injected by server/api/[...].js proxy.
    apiBaseUrl: '',       // NUXT_API_BASE_URL — private. Real Laravel URL the proxy forwards to.
    trustProxy: false,    // NUXT_TRUST_PROXY — true only behind a reverse proxy that appends the real client IP to X-Forwarded-For.
    public: {
      baseUrl: '',        // own origin (relative). Client fetches hit Nitro proxy, not Laravel directly.
      translationsMode: process.env.NUXT_PUBLIC_TRANSLATIONS_MODE || 'remote', // 'remote' | 'local'
      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        appId: '',
      },
    },
  },

  echo: {
    key: process.env.NUXT_PUBLIC_PUSHER_APP_KEY,
    cluster: process.env.NUXT_PUBLIC_PUSHER_APP_CLUSTER,
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
    // Only when known at build time: a localhost fallback here would be picked up by
    // nuxt-site-config as the canonical origin and win over the runtime env.
    ...(process.env.NUXT_PUBLIC_SITE_URL ? { baseUrl: process.env.NUXT_PUBLIC_SITE_URL } : {}),
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