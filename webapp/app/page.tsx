import Reveal from "./Reveal";

// Where the "Use it" button sends people — the in-app dashboard route.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "/app";
const REPO = "https://github.com/Vatsa10/OpenWhoop";
const BLUEFY = "https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055";

const features = [
  { ic: "📡", h: "Direct Bluetooth", p: "Talks straight to the strap with Web Bluetooth — live heart rate, battery, haptics and full history sync. No phone-in-the-middle." },
  { ic: "🔒", h: "Local-first", p: "Your data lives in your browser, not on someone's server. Optional end-to-end-encrypted sync if you want it across devices." },
  { ic: "📊", h: "Real metrics", p: "Recovery, day strain, sleep stages and HRV — recomputed locally from raw samples, not gated behind a paywall." },
  { ic: "⏰", h: "Haptic alarms", p: "Buzz the strap on a schedule, on both 4.0 and 5.0 — the same vibration the official app uses, verified against real captures." },
  { ic: "📥", h: "Apple Health import", p: "Pull in sleep and workouts from Apple Health to round out the picture. Everything stays on-device." },
  { ic: "🛠️", h: "Open & hackable", p: "Every byte of the BLE protocol is documented. Fork it, audit it, extend it. MIT licensed." },
];

export default function Home() {
  return (
    <>
      <a href="#setup" className="skip">Skip to setup guide</a>

      {/* nav */}
      <header className="nav">
        <div className="wrap nav-inner">
          <div className="brand"><span className="dot" />OpenWhoop</div>
          <nav className="nav-links">
            <a className="hide-sm" href="#features">Features</a>
            <a className="hide-sm" href="#compat">Compatibility</a>
            <a className="hide-sm" href="#setup">Setup</a>
            <a className="hide-sm" href={REPO}>GitHub</a>
            <a className="btn btn-primary btn-sm" href={APP_URL}>Use it</a>
          </nav>
        </div>
      </header>

      <main id="main">
        {/* hero */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <span className="pill"><span className="live" /> WHOOP 4.0 &amp; 5.0 supported</span>
              <h1 className="display">
                Your WHOOP data,<br />
                <span className="grad">on your terms.</span>
              </h1>
              <p className="lede">
                An open-source dashboard that connects to your strap over Bluetooth and
                computes recovery, strain, sleep and HRV right in your browser. No
                subscription, no cloud, no lock-in.
              </p>
              <div className="hero-cta">
                <a className="btn btn-primary" href={APP_URL}>Use it — open dashboard →</a>
                <a className="btn btn-ghost" href="#setup">Read the setup guide</a>
              </div>
              <p className="hero-note">Free &amp; MIT-licensed · Chrome / Edge on Android, Windows, Mac, Linux · iOS via Bluefy</p>
            </div>

            <Reveal delay={120}>
              <aside className="stat-card" aria-label="Example daily snapshot">
                <div className="stat"><span className="k">Recovery</span><span className="v good">72%</span></div>
                <div className="stat-divider" />
                <div className="stat"><span className="k">Day strain</span><span className="v">14.3</span></div>
                <div className="stat-divider" />
                <div className="stat"><span className="k">HRV (rMSSD)</span><span className="v">86 ms</span></div>
                <div className="stat-divider" />
                <div className="stat"><span className="k">Resting HR</span><span className="v">51 bpm</span></div>
                <div className="stat-divider" />
                <div className="stat"><span className="k">Sleep</span><span className="v">7h 12m</span></div>
              </aside>
            </Reveal>
          </div>
        </section>

        {/* features */}
        <section id="features">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">Why OpenWhoop</span>
              <h2>The whole strap, none of the subscription.</h2>
              <p>You bought the hardware. This gives you the data it collects — without a recurring bill.</p>
            </div>
            <div className="features">
              {features.map((f, i) => (
                <Reveal key={f.h} className="feature" delay={(i % 2) * 90}>
                  <span className="ic" aria-hidden>{f.ic}</span>
                  <h3>{f.h}</h3>
                  <p>{f.p}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* compatibility */}
        <section id="compat">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">Compatibility</span>
              <h2>Where it runs.</h2>
              <p>OpenWhoop needs Web Bluetooth. That covers most platforms — and there's a clean path on iPhone too.</p>
            </div>
            <div className="compat">
              <Reveal className="compat-card" delay={0}>
                <span className="tag ok">WORKS</span>
                <h3>Android — Chrome / Edge</h3>
                <p>Full Bluetooth support. Install it as an app from the browser menu and connect.</p>
              </Reveal>
              <Reveal className="compat-card" delay={90}>
                <span className="tag ok">WORKS</span>
                <h3>Windows · Mac · Linux</h3>
                <p>Desktop Chrome or Edge. Plug in the strap, hit connect, done.</p>
              </Reveal>
              <Reveal className="compat-card" delay={180}>
                <span className="tag note">iOS</span>
                <h3>iPhone / iPad — via Bluefy</h3>
                <p>Apple blocks Bluetooth in Safari. Open the dashboard inside the free <a href={BLUEFY}>Bluefy</a> browser and it works the same.</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* setup */}
        <section id="setup">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">Setup guide</span>
              <h2>Connected in under a minute.</h2>
              <p>Pick your platform. Same dashboard either way — the only difference is which browser opens it.</p>
            </div>
            <div className="tracks">
              <Reveal className="track" delay={0}>
                <div className="track-head">
                  <span className="os">Android &amp; Desktop</span>
                  <span className="badge">Chrome / Edge</span>
                </div>
                <p className="track-sub">Native Web Bluetooth — nothing extra to install.</p>
                <ol className="steps">
                  <li><div><b>Open the dashboard</b><span>Visit OpenWhoop in Chrome or Edge.</span></div></li>
                  <li><div><b>Tap “Use it”</b><span>Then hit <b>Connect</b> on the dashboard.</span></div></li>
                  <li><div><b>Pick your strap</b><span>Choose your WHOOP in the Bluetooth chooser and pair.</span></div></li>
                  <li><div><b>Optional: install it</b><span>Browser menu → <code>Install app</code> for a full-screen, offline-capable PWA.</span></div></li>
                </ol>
              </Reveal>

              <Reveal className="track" delay={120}>
                <div className="track-head">
                  <span className="os">iPhone &amp; iPad</span>
                  <span className="badge">Bluefy</span>
                </div>
                <p className="track-sub">Safari can't do Bluetooth, so use Bluefy — a free WebBLE browser.</p>
                <ol className="steps">
                  <li><div><b>Install Bluefy</b><span>Grab <a href={BLUEFY} style={{ color: "var(--accent)" }}>Bluefy — Web BLE Browser</a> from the App Store (free).</span></div></li>
                  <li><div><b>Open the dashboard in Bluefy</b><span>Paste the OpenWhoop URL into Bluefy's address bar.</span></div></li>
                  <li><div><b>Allow Bluetooth</b><span>Tap <b>Connect</b>; approve the Bluetooth permission prompt.</span></div></li>
                  <li><div><b>Pick your strap</b><span>Select your WHOOP and pair. Live HR, history and haptics all work.</span></div></li>
                </ol>
              </Reveal>
            </div>
          </div>
        </section>

        {/* final cta */}
        <section>
          <div className="wrap">
            <Reveal className="final">
              <h2>Own your recovery data.</h2>
              <p>Free, open-source, and yours. No account, no subscription. Open the dashboard and connect your strap.</p>
              <a className="btn btn-primary" href={APP_URL}>Use it — open dashboard →</a>
            </Reveal>
          </div>
        </section>
      </main>

      <p className="disclaimer">
        OpenWhoop is an independent, unofficial project. Not affiliated with, endorsed by, or
        connected to WHOOP, Inc. “WHOOP” is a trademark of its respective owner.
      </p>

      <footer>
        <div className="wrap foot-inner">
          <span>© 2026 OpenWhoop · MIT License</span>
          <nav className="foot-links">
            <a href={REPO}>GitHub</a>
            <a href={`${REPO}/issues`}>Issues</a>
            <a href={APP_URL}>Dashboard</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
