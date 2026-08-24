import tailwindcss from "@tailwindcss/vite"

// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    xApiToken: '',        // NUXT_X_API_TOKEN — private, server-only. Injected by server/api/[...].js proxy.
    apiBaseUrl: '',       // NUXT_API_BASE_URL — private. Real Laravel URL the proxy forwards to.
    public: {
      baseUrl: '',        // own origin (relative). Client fetches hit Nitro proxy, not Laravel directly.
      translationsMode: process.env.NUXT_PUBLIC_TRANSLATIONS_MODE, // 'remote' | 'local'
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

  css: [
    "~/assets/css/main.css",
  ],
  sanctum: {
    baseUrl: '', // own origin → /api/* proxied to Laravel by server/api/[...].js
    mode: 'token',
    endpoints: {
      login: '/api/login',
      logout: '/api/logout',
      user: '/api/user',
    },
    redirect: {
      keepRequestedRoute: false,
      onLogin: '/',
      onLogout: '/',
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

  i18n: {
    baseUrl: 'https://localhost:3000',
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
    'motion-v/nuxt',
    '@nuxtjs/seo',
    'v-gsap-nuxt',
    'nuxt-auth-sanctum',
    'nuxt-laravel-echo',
  ],
})