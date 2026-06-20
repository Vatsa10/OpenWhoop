# OpenWhoop

An independent, unofficial, educational BLE client for the WHOOP 4.0 strap.
It reads heart rate, RR intervals, SpO2, and skin temperature from the band
over Bluetooth Low Energy, stores everything locally in the browser, and
computes textbook HRV, recovery, and strain estimates on-device. No
subscription, no cloud account, no data leaving your machine.

Built on open research from [`jogolden/whoomp`][whoomp] and
[`bWanShiTong/reverse-engineering-whoop`][bwan].

> **Disclaimer**
>
> This is an unofficial, third-party project provided for educational,
> research, and personal interoperability purposes only. It is not
> affiliated with, endorsed by, or sponsored by WHOOP, Inc. "WHOOP" and
> "WHOOP 4.0" are trademarks of WHOOP, Inc.; references here are nominative
> and describe hardware compatibility only.
>
> The metrics produced by this software are not clinically validated and are
> not medical advice. Do not use for medical, clinical, diagnostic, or
> therapeutic purposes. The software is provided "as is" without warranty of
> any kind (MIT). Read [DISCLAIMER.md](DISCLAIMER.md) before using.

**Live:** <https://openwhoop.vatsa.online>

The site opens on a landing page with the feature overview and setup guide,
then links to the dashboard. Pairing requires a Chromium-family browser on
desktop, or Bluefy on iPhone (see [iOS](#ios-iphone-and-ipad)).

## Table of contents

- [Architecture](#architecture)
- [Quick start](#quick-start)
- [Deployment (Cloudflare Pages)](#deployment-cloudflare-pages)
- [iOS (iPhone and iPad)](#ios-iphone-and-ipad)
- [Features](#features)
- [Computed metrics](#computed-metrics)
- [Data storage](#data-storage)
- [Offline buffer](#offline-buffer)
- [BLE protocol](#ble-protocol)
- [Project layout](#project-layout)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Credits](#credits)
- [License](#license)

## Architecture

OpenWhoop has two independent ways to run. Most users only need the first.

| Component | Runs where | Purpose |
| --- | --- | --- |
| Web app (`web/`) | Any browser, served statically | Pairs the strap via Web Bluetooth, stores data in IndexedDB, renders the dashboard. Fully standalone. |
| Pages Functions (`functions/`) | Cloudflare Workers (serverless) | `/api/coach` (AI coach, Workers AI) and `/api/sync` (optional encrypted cross-device sync, needs R2). |
| Python CLI (`openwhoop/`) | Your own Mac, Linux, or Raspberry Pi | Optional native BLE recorder into SQLite plus a local static server. Alternative to the browser, not required. |

The Python package cannot run on a remote/cloud host: it needs a physical
Bluetooth radio with the strap in range. It is for running locally on a
machine near the strap.

## Quick start

### Option A: static server (recommended, no Python)

The web app is self-contained. Serve the `web/` directory over localhost
(`localhost` is a secure context, which Web Bluetooth requires):

```bash
npx serve web -l 8765
# or
python -m http.server 8765 --directory web
```

Open a Chromium-family browser (Chrome, Edge, Brave, Arc) at
`http://localhost:8765/`. The landing page loads; click **Launch** to open
the dashboard at `/app.html`. In the connection panel:

1. Tap the strap to wake it (it does not advertise while charging).
2. Click **Connect Whoop**; the browser shows a device picker.
3. Select your band.

On every connect, OpenWhoop automatically:

- Fetches the strap identity, serial, and on-wrist state (`GET_HELLO`).
- Compares the strap RTC to your system clock and re-syncs if drifted (`SET_CLOCK`).
- Drains the strap flash buffer: every HR sample and RR interval recorded
  while the host was away (`SEND_HISTORICAL_DATA` to `HISTORICAL_DATA_RESULT`).
- Starts realtime streaming.

The first time the dashboard opens with an empty database, 14 days of
synthetic data are seeded so the charts are not blank. Real data accumulates
alongside it; use **Export** then **Reset** then **Import** for a clean slate.

### Option B: Python CLI

Use this only for a native BLE recorder into SQLite. The helper scripts are
bash; on Windows run them in Git Bash.

```bash
./setup.sh                                    # create .venv, install openwhoop
./run.sh dash --host 0.0.0.0 --port 8765      # serve web/ and bridge BLE
```

Without the scripts:

```bash
python -m venv .venv
.venv/Scripts/pip install -e .                # .venv/bin/pip on macOS/Linux
.venv/Scripts/openwhoop dash --port 8765
```

## Deployment (Cloudflare Pages)

The site is `web/` plus `functions/`, deployed to Cloudflare Pages.

### Git integration (auto-deploy on push)

In the Cloudflare dashboard, create a Pages project connected to the GitHub
repository with these build settings:

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Build command | (empty) |
| Build output directory | `web` |
| Root directory | `/` |

Every push to `main` then builds and deploys automatically. Functions in
`functions/` are detected and deployed without extra configuration.

### Manual deploy

```bash
npx wrangler login
npm run deploy          # wrangler pages deploy web --project-name=openwhoop
```

### Bindings

Two features depend on bindings configured under **Settings > Functions**
after the first deploy. Both degrade gracefully if absent.

- **AI coach** needs a Workers AI binding: variable name `AI`. Free tier, no
  third-party API key. Without it, `/api/coach` returns 503 and the coach
  falls back to built-in rule-based tips. Redeploy after adding the binding.
- **Cross-device sync** needs an R2 bucket (paid plan). It is disabled by
  default in `wrangler.toml`. To enable: run
  `npx wrangler r2 bucket create openwhoop-sync`, uncomment the `[[r2_buckets]]`
  block, add an R2 binding named `SYNC`, and redeploy. Without it, `/api/sync`
  returns 503 and the client disables sync.

### Custom domain on external DNS

To use a domain whose nameservers stay at your registrar (no full Cloudflare
nameserver migration):

1. At your DNS provider, add a CNAME: `openwhoop` to `<project>.pages.dev`.
2. In the Pages project, **Custom domains > Set up a custom domain**, enter
   the full hostname. Cloudflare validates the CNAME and issues the TLS
   certificate. Status moves from Pending to Active in a few minutes.

If the apex zone is half-claimed (Pending) in your Cloudflare account,
external-CNAME validation fails; remove the pending zone first.

## iOS (iPhone and iPad)

Mobile Safari does not implement Web Bluetooth. Use
[Bluefy](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055), a
WebKit browser with Web Bluetooth via CoreBluetooth.

1. Open the deployed site (or a LAN address such as `http://<mac-ip>:8765/`)
   in Bluefy.
2. Go to the dashboard and tap **Connect Whoop**; grant Bluetooth permission.

The strap pairs directly to the iPhone over BLE. A native app shell using
Capacitor is available on the [`ios-app` branch](../../tree/ios-app); see
[docs/native-ios.md](docs/native-ios.md). Phone-only and Mac-hub workflows
are documented in [docs/IPHONE_BLUEFY.md](docs/IPHONE_BLUEFY.md) and
[docs/IPHONE.md](docs/IPHONE.md).

## Features

### Analysis and coaching

- **Activity journal with tag correlation.** Log up to 11 lifestyle tags
  (alcohol, stress, hard workout, caffeine, meditation, cold, nap, and more).
  After 2 or more tagged and untagged days per tag, the app computes a
  Cohen's d effect size and surfaces insights such as "Alcohol strongly
  lowers next-day recovery, -20 pts (-28%) (n=4)".
- **Daily training plan.** Rest, active, train, or push recommendation driven
  by today's recovery score, 7-day strain load, and accumulated sleep debt,
  with the day-specific rationale and target zone.
- **Health insights engine.** 12 generators watching HRV trend, RHR trend,
  sleep debt, sleep consistency, recovery streaks, strain/recovery balance,
  skin temperature deviation, respiratory rate drift, sleep duration trend,
  SpO2 anomalies, sleep performance, and the Acute:Chronic Workload Ratio
  (ACWR), which flags training spikes above 1.5x or detraining below 0.6x.
- **Weekly summary** with week-over-week deltas for recovery, HRV, resting
  HR, and sleep, plus the top tag insights.
- **AI coach.** Ask questions about recovery, strain, sleep, and stress,
  grounded in the day's actual metrics. Runs on Cloudflare Workers AI.
- **Poincare plot** (SD1/SD2) from the previous night's RR intervals.
- **Recovery coach and strain target** shown next to the recovery ring.
- **HRV, RHR, and skin temperature baselines** versus a 14-day rolling
  baseline with color-coded deltas.
- **Calendar heatmap** with a metric picker (recovery, sleep performance,
  strain, HRV); click a day to open it.
- **Historical date navigation** across the Recovery, Sleep, and Strain tabs.
- **Workout labels**, editable inline and included in the CSV export.
- **Personal records** for HRV, lowest RHR, peak recovery, longest sleep,
  peak strain, and best sleep performance.

### Data and export

- **Local IndexedDB persistence** for samples, daily metrics, journal,
  captures, workouts, sleep stages, and profile. No server.
- **CSV export** for raw samples, daily metrics, journal entries, and
  workouts, plus full JSON export and import for backup and restore.
- **Progressive Web App.** Installable, cache-first assets, offline capable.
- **Push notifications** (opt-in) for backfill complete, low recovery, low
  battery, and HR anomalies.

### Hardware and connectivity

- **Generic HR Profile toggle.** Exposes the standard BLE HR service (0x180D)
  so Strava, Zwift, Peloton, or Apple Watch can pair the strap as an HR
  monitor.
- **Smart alarm.** Set a wake time; the strap vibrates to wake you.
- **Bluetooth scale.** Pairs with any standard Weight Scale Service (0x181D)
  scale (Beurer, A&D, some Withings). No app, no cloud.
- **Apple Health weight sync** via iPhone Shortcut or Health Auto Export.
- **Raw packet capture** to NDJSON for protocol research.
- **Diagnostics drawer**: Hello, Battery, Clock, Data Range, Haptic, Raw IMU,
  Extended Battery, HR Profile.
- **Multi-tab guard** to prevent two tabs holding the GATT connection.

## Computed metrics

| Metric | Source | Computation |
| --- | --- | --- |
| Heart rate (BPM) | Live packet bytes 1-2 | Direct decode |
| RR interval (ms) | Live packet bytes 3-4 | Direct decode |
| SpO2 (%) | Live packet byte 5 | Direct decode |
| Skin temperature | Live packet byte 6 | `byte - 25` degrees C offset |
| HRV (RMSSD) | RR intervals during 02:00-06:00 local | Root mean square of successive RR differences, Malik filter |
| Recovery score | Today's RMSSD vs 14-day baseline | z-score mapped to 0-100 |
| Strain score | HR across the day | Borg-style load: `21 * (1 - e^(-load/100))` |
| Resting HR | 5th percentile of daily HR | Order statistic |

WHOOP's own algorithms are closed-source. These reproduce the intent of the
metrics with textbook HRV and training-load formulas.

## Data storage

Everything lives in IndexedDB in the browser. To inspect it:
Chrome DevTools (F12) > Application > Storage > IndexedDB > `openwhoop`.

| Store | Contents |
| --- | --- |
| `samples` | Each ~30-second sensor packet (HR, RR, SpO2, temp, accel) |
| `sessions` | Start and stop of each recording session |
| `device_events` | Connect, disconnect, battery, and error log |
| `daily_metrics` | One row per day (HRV, recovery, strain, sleep) |
| `profile` | Age, sex, weight (used for calorie estimates) |
| `sleep_stages` | Nightly sleep stage breakdown |
| `workouts` | Detected workout windows with zone time and calories |
| `journal` | Daily tag entries for correlation analysis |
| `captures` | Raw NDJSON packet dumps for protocol research |

Use **Export** for a full JSON backup and **Import** to restore on any
machine or after clearing browser storage.

## Offline buffer

The WHOOP 4.0 has internal flash that records 1 Hz HR and RR intervals
continuously, even with no host connected. The official app drains that
buffer over BLE on the next connection, and so does OpenWhoop.

- Wear the strap without the host nearby; the strap records to flash.
- Walk back in range with the page open; the client detects the connection,
  runs the post-connect flow, and backfill begins. Samples arrive on the data
  channel and land in IndexedDB.
- When the buffer is drained the strap sends `HISTORY_COMPLETE` and realtime
  streaming resumes.

If flash fills between connects, the strap emits `HIGH_FREQ_SYNC_PROMPT` and
the client starts another sync automatically.

## BLE protocol

The WHOOP 4.0 advertises a single custom GATT service
`61080000-8d6d-82b8-614a-1c8cb0f8dcc6` with five characteristics:

| UUID suffix | Direction | Purpose |
| --- | --- | --- |
| ...01 | write | Commands to strap |
| ...02 | notify | Command responses |
| ...03 | notify | Async device events |
| ...04 | notify | 96-byte realtime sensor packets |
| ...05 | notify | Diagnostic / memfault reports |

Each command frame is `[0xAA][cmd][len:LE16][payload][CRC32:LE]`. The CRC
uses polynomial `0x04C11DB7`, init `0xFFFFFFFF`, reflect in and out, and
final XOR `0xF43F44AC` (see [`web/js/ble/crc.js`](web/js/ble/crc.js)).

Bytes 0-19 of each 96-byte realtime packet are decoded. Bytes 20-91 are not
yet publicly known (likely PPG waveform, gyroscope, and respiration) and are
stored raw. Full reference: [docs/PROTOCOL.md](docs/PROTOCOL.md).

## Project layout

```
OpenWhoop/
  web/                      Static web app (deploy target)
    index.html              Landing page and setup guide
    app.html                Dashboard UI
    app.js                  Dashboard render (reads from api-shim)
    styles.css              Design system
    vendor/                 Chart.js and idb (vendored)
    js/
      app-mvp.js            BLE connect/disconnect and live HR
      ble/                  uuids, crc, packet, parsers, client
      data/                 schema, db, queries, api-shim, export
      metrics/              hrv, strain, zones, sleep, workouts,
                            recovery, rollup, insights, plan, weekly,
                            correlate
      util/                 events, time, multitab, notify
      dev/                  seed, capture, analyzer
    sw.js                   Service worker
    manifest.json           PWA manifest
  functions/
    api/coach.js            AI coach (Workers AI)
    api/sync.js             Encrypted sync (R2, optional)
  openwhoop/                Python package (optional local recorder)
  tests/                    Vitest (JS) and pytest (Python) suites
  wrangler.toml             Cloudflare Pages config
  run.sh, setup.sh          Python helper scripts
```

## Development

```bash
npm install            # dev dependencies (vitest, wrangler, etc.)
npm test               # run the Vitest suite
npx wrangler pages dev web   # serve web/ and functions/ together (coach works)
```

`npx wrangler pages dev web` is the closest local mirror of production
because it runs the Pages Functions alongside the static assets.

## Troubleshooting

- **"Connect Whoop" does nothing.** Web Bluetooth needs a secure context
  (HTTPS or `localhost`). A raw `file://` URL does not qualify.
- **Device picker shows no strap.** Tap the band to wake it. Confirm the
  browser has OS Bluetooth permission.
- **Scripts (chart.umd.min.js) load as HTML / MIME error after deploy.** The
  vendored libraries were not in the deployment. Ensure `web/vendor/` is
  committed (it is force-included in `.gitignore`).
- **HR drops and reconnects.** BLE on desktop drops occasionally; the client
  auto-reconnects with backoff. Data already written is safe.
- **HRV or recovery shows a dash.** At least one full overnight wearing the
  band is required; metrics compute the next day.
- **AI coach returns an error.** The Workers AI binding (`AI`) is not
  configured, or the deployment predates adding it. Add the binding and
  redeploy.

## Credits

- [jogolden/whoomp][whoomp]: original WHOOP 4.0 reverse engineering and web demo
- [bWanShiTong/reverse-engineering-whoop][bwan]: protocol writeup and CRC parameters
- [christianmeurer/whoop-reader][whoop-reader]: Python BLE driver reference
- [jacc/whoop-re][jacc]: REST API research

[whoop-reader]: https://github.com/christianmeurer/whoop-reader
[whoomp]:       https://github.com/jogolden/whoomp
[bwan]:         https://github.com/bWanShiTong/reverse-engineering-whoop
[jacc]:         https://github.com/jacc/whoop-re

## License

MIT. See [LICENSE](LICENSE) for the warranty disclaimer and
[DISCLAIMER.md](DISCLAIMER.md) for the trademark notice, non-affiliation
statement, and acceptable-use terms. Read it before using or redistributing.

WHOOP and WHOOP 4.0 are trademarks of WHOOP, Inc. This project is not
affiliated with, endorsed by, or sponsored by WHOOP, Inc.
