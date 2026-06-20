# OpenWhoop

Open-source dashboard for the **WHOOP 4.0 and 5.0** straps. Connects directly
over Bluetooth, computes recovery / strain / sleep / HRV in your browser, and
stores everything locally. No subscription, no cloud, no lock-in.

> Unofficial and independent. Not affiliated with, endorsed by, or connected to
> WHOOP, Inc. "WHOOP" is a trademark of its respective owner. See
> [DISCLAIMER.md](DISCLAIMER.md).

## What's here

```
webapp/        Next.js (App Router, TypeScript) PWA — the whole app
  app/         /         landing page (features, compatibility, setup guide)
               /app      dashboard (connect, live HR, recovery/strain/sleep)
  lib/         framework-free engine: BLE protocol, IndexedDB, metrics, sync
  public/      manifest, service worker, icons
functions/     Cloudflare-era backend (E2E sync, AI coach) — to port to Vercel /api
docs/          BLE protocol reference + capture notes
```

The dashboard UI is React; the BLE/storage/metrics **engine** under
`webapp/lib/` is plain ES modules, reused as-is.

## Run it

```bash
cd webapp
npm install
npm run dev        # http://localhost:3000
```

Open `/`, hit **Use it**, then **Connect strap**.

## Compatibility

Web Bluetooth is required.

| Platform | Support |
|---|---|
| Android / Windows / Mac / Linux — **Chrome or Edge** | Works |
| iPhone / iPad — via **[Bluefy](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055)** | Works (Safari blocks Web Bluetooth) |

## Deploy (Vercel)

Import the repo, set **Root Directory** to `webapp/`. Next.js auto-detects.
The landing and dashboard ship as one PWA.

Optional backend (`functions/`) — E2E-encrypted sync and the AI coach — still
target Cloudflare bindings (R2, Workers AI). Port them to `webapp/app/api/*`
route handlers to run them on Vercel.

## License

MIT — see [LICENSE](LICENSE). GitHub: <https://github.com/Vatsa10/OpenWhoop>
