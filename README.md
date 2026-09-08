# Starter (Nuxt 4)

Web frontend for the Laravel starter API (`../starter`). Plain JavaScript, Tailwind v4, shadcn-vue, `nuxt-auth-sanctum` (token mode) behind a Nitro proxy that keeps the API token server-side.

Read [CLAUDE.md](CLAUDE.md) for the architecture and conventions — it is the project's living documentation.

## Setup

```bash
cp .env.example .env   # fill NUXT_API_BASE_URL and NUXT_X_API_TOKEN from the Laravel .env (APP_X_API_TOKEN)
npm install
npm run dev            # http://localhost:3000
```

The Laravel API must be running (`php artisan serve` in `../starter`) with `FRONTEND_URL` pointing at this app's origin. Feature flags on the API (`HAS_TRANSLATIONS`, `HAS_PAGES`, `HAS_DYNAMIC_STORAGE`, `APP_USERS`, `APP_GUESTS`, `AUTH_MODE`) shape what the frontend renders; nothing here needs to change when they do.

## Checks

```bash
npm test               # vitest: middleware, composables, components
npm run build          # production build (.output/)
node .output/server/index.mjs
```

Production: set `NUXT_PUBLIC_SITE_URL`, `NUXT_PUBLIC_SITE_NAME`, and `NUXT_TRUST_PROXY=true` only behind a reverse proxy that appends the real client IP to `X-Forwarded-For`.
