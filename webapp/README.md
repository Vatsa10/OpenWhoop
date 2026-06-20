# OpenWhoop — Landing

Next.js (App Router, TypeScript) marketing + setup page. One page: features,
compatibility, and the Android / iOS-via-Bluefy setup guide. The **Use it**
button sends visitors to the dashboard PWA.

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
```

## Configure the dashboard link

The "Use it" CTA points at `NEXT_PUBLIC_APP_URL` (falls back to the live hosted
dashboard). Set it for your deploy:

```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://your-dashboard-url
```

## Deploy to Vercel

Import the repo, set **Root Directory** to `landing/`. Framework auto-detects as
Next.js — no extra config. Add `NEXT_PUBLIC_APP_URL` in project env vars.

The dashboard PWA (`/web`) is a separate static deploy (its own Vercel project,
or any static host). Keep the two URLs in sync via `NEXT_PUBLIC_APP_URL`.
