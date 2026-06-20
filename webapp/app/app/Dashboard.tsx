"use client";

import Link from "next/link";
import { useWhoop, type DailyMetric } from "@/lib/useWhoop";

const fmt = (v: number | undefined | null, d = 0, unit = "") =>
  v == null || !Number.isFinite(v) ? "—" : `${d ? v.toFixed(d) : Math.round(v)}${unit}`;

const fmtHM = (mins?: number) =>
  mins == null ? "—" : `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;

function recoveryTone(v?: number) {
  if (v == null) return "";
  if (v >= 67) return "good";
  if (v >= 34) return "mid";
  return "bad";
}

export default function Dashboard() {
  const w = useWhoop();
  const latest: DailyMetric | undefined = w.metrics[0];
  const connected = w.state === "connected";
  const busy = w.state === "connecting" || w.state === "reconnecting";

  return (
    <div className="dash">
      <header className="dash-bar">
        <div className="wrap dash-bar-inner">
          <Link href="/" className="brand"><span className="dot" />OpenWhoop</Link>
          <div className="dash-bar-right">
            <span className={`conn conn-${w.state}`}>
              <span className="conn-dot" />
              {w.state}{w.family ? ` · ${w.family}` : ""}
            </span>
            {connected ? (
              <button className="btn btn-ghost btn-sm" onClick={w.disconnect}>Disconnect</button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={w.connect} disabled={busy}>
                {busy ? "Connecting…" : "Connect strap"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="wrap dash-main" id="main">
        {!w.supported && (
          <div className="banner warn">
            No Web Bluetooth in this browser. On iPhone, open OpenWhoop inside the free{" "}
            <a href="https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055">Bluefy</a> browser.
            On desktop/Android, use Chrome or Edge.
          </div>
        )}
        {w.error && <div className="banner err" role="alert">{w.error}</div>}
        {w.syncMsg && <div className="banner info">{w.syncMsg}</div>}

        {/* live row */}
        <section className="live-row">
          <div className="live-hero">
            <div className="live-label">Live heart rate</div>
            <div className="live-hr">
              <span className="hr-num">{w.hr ?? "—"}</span>
              <span className="hr-unit">bpm</span>
            </div>
            <div className="live-sub">
              {connected ? `${w.sampleCount.toLocaleString()} samples this session` : "Connect your strap to stream"}
            </div>
            {connected && (
              <button className="btn btn-ghost btn-sm" onClick={w.buzz} style={{ marginTop: 16 }}>
                Buzz strap (test haptic)
              </button>
            )}
          </div>

          <div className="mini-grid">
            <div className="mini"><span className="mini-k">Battery</span><span className="mini-v">{fmt(w.battery, 0, "%")}</span></div>
            <div className="mini"><span className="mini-k">Strap</span><span className="mini-v">{w.family ?? "—"}</span></div>
            <div className="mini"><span className="mini-k">Status</span><span className="mini-v">{w.state}</span></div>
            <div className="mini"><span className="mini-k">Samples</span><span className="mini-v">{w.sampleCount.toLocaleString()}</span></div>
          </div>
        </section>

        {/* daily metrics */}
        <section>
          <div className="dash-h">
            <h2>Today</h2>
            {latest && <span className="dash-date">{latest.date}</span>}
          </div>

          {latest ? (
            <div className="cards">
              <article className={`card recovery ${recoveryTone(latest.recovery_score)}`}>
                <span className="card-k">Recovery</span>
                <span className="card-v">{fmt(latest.recovery_score, 0, "%")}</span>
              </article>
              <article className="card">
                <span className="card-k">Day strain</span>
                <span className="card-v">{fmt(latest.zone_weighted_strain_score ?? latest.strain_score, 1)}</span>
              </article>
              <article className="card">
                <span className="card-k">HRV (rMSSD)</span>
                <span className="card-v">{fmt(latest.rmssd_ms, 0, " ms")}</span>
              </article>
              <article className="card">
                <span className="card-k">Resting HR</span>
                <span className="card-v">{fmt(latest.resting_hr, 0, " bpm")}</span>
              </article>
              <article className="card">
                <span className="card-k">Sleep</span>
                <span className="card-v">{fmtHM(latest.sleep_minutes)}</span>
              </article>
              <article className="card">
                <span className="card-k">Sleep performance</span>
                <span className="card-v">{fmt(latest.sleep_performance_pct, 0, "%")}</span>
              </article>
            </div>
          ) : (
            <div className="empty">
              <div className="empty-ic">📊</div>
              <h3>No data yet</h3>
              <p>Connect your WHOOP and history will sync automatically. Recovery, strain and sleep fill in once the first backfill completes.</p>
              {!connected && (
                <button className="btn btn-primary" onClick={w.connect} disabled={busy || !w.supported}>
                  {busy ? "Connecting…" : "Connect strap"}
                </button>
              )}
            </div>
          )}
        </section>

        {w.metrics.length > 1 && (
          <section>
            <div className="dash-h"><h2>Recent days</h2></div>
            <div className="trend">
              {w.metrics.slice(0, 14).map((m) => (
                <div className="trend-day" key={m.date} title={`${m.date} · recovery ${fmt(m.recovery_score, 0, "%")}`}>
                  <div className="trend-bar" style={{ height: `${Math.max(4, m.recovery_score ?? 0)}%` }} data-tone={recoveryTone(m.recovery_score)} />
                  <span className="trend-lbl">{m.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
