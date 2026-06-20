"use client";

// React binding over the framework-free engine (BLE client + IndexedDB).
// The protocol/storage/metrics code under lib/ is reused verbatim; this hook
// only adapts its event emitter + async calls to React state.

import { useCallback, useEffect, useRef, useState } from "react";
// Engine: framework-free ES modules (no .d.ts) — imported as `any`.
import { WhoopClient } from "./ble/client.js";
import { openDb } from "./data/db.js";
import { insertSamplesBatch, startSession, endSession, recentDailyMetrics } from "./data/queries.js";
import { isoUtcNow } from "./util/time.js";
import { recomputeRecent } from "./metrics/rollup.js";

export type ConnState = "disconnected" | "connecting" | "connected" | "reconnecting";

export interface DailyMetric {
  date: string;
  recovery_score?: number;
  strain_score?: number;
  zone_weighted_strain_score?: number;
  rmssd_ms?: number;
  resting_hr?: number;
  sleep_minutes?: number;
  sleep_performance_pct?: number;
}

const FLUSH_MS = 1000;

export function useWhoop() {
  const [state, setState] = useState<ConnState>("disconnected");
  const [hr, setHr] = useState<number | null>(null);
  const [battery, setBattery] = useState<number | null>(null);
  const [family, setFamily] = useState<string | null>(null);
  const [sampleCount, setSampleCount] = useState(0);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);

  const clientRef = useRef<any>(null);
  const dbRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);
  const bufferRef = useRef<any[]>([]);
  const countRef = useRef(0);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && !!navigator.bluetooth);
    let timer: ReturnType<typeof setInterval>;
    (async () => {
      try {
        dbRef.current = await openDb();
        await refreshMetrics();
      } catch (e: any) {
        setError(e?.message ?? "Failed to open local database");
      }
    })();
    timer = setInterval(flush, FLUSH_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshMetrics = useCallback(async () => {
    if (!dbRef.current) return;
    try {
      const rows = await recentDailyMetrics(dbRef.current, 30);
      setMetrics(rows as DailyMetric[]);
    } catch {
      /* empty until first sync */
    }
  }, []);

  async function flush() {
    const db = dbRef.current;
    if (!db || bufferRef.current.length === 0) return;
    const batch = bufferRef.current;
    bufferRef.current = [];
    try {
      await insertSamplesBatch(db, batch);
    } catch (e: any) {
      setError(e?.message ?? "Failed to write samples");
    }
  }

  const wire = useCallback((client: any) => {
    client.on("state", (s: ConnState) => setState(s));
    client.on("family", ({ name }: { name: string }) => setFamily(name));
    client.on("battery", (pct: number) => setBattery(pct));
    client.on("error", (e: any) => setError(e?.message ?? String(e)));
    client.on("sample", (pkt: any) => {
      if (pkt?.heartRateBpm != null) setHr(Math.round(pkt.heartRateBpm));
      countRef.current += 1;
      setSampleCount(countRef.current);
      const rr = Array.isArray(pkt?.rrIntervalsMs) ? pkt.rrIntervalsMs : [];
      const ts = isoUtcNow();
      if (!rr.length) bufferRef.current.push({ ts_utc: ts, heart_rate_bpm: pkt?.heartRateBpm ?? null });
      else for (const r of rr) bufferRef.current.push({ ts_utc: ts, heart_rate_bpm: pkt?.heartRateBpm ?? null, rr_interval_ms: r });
    });
    client.on("historyStart", () => setSyncMsg("Syncing history…"));
    client.on("historyProgress", ({ samples }: { samples: number }) =>
      setSyncMsg(`Backfilled ${samples.toLocaleString()} samples…`));
    client.on("historyComplete", async ({ samples }: { samples: number }) => {
      setSyncMsg(`Sync done: ${samples.toLocaleString()} samples — computing…`);
      try {
        if (dbRef.current) await recomputeRecent(dbRef.current);
        await refreshMetrics();
        setSyncMsg(null);
      } catch (e: any) {
        setError(e?.message ?? "Recompute failed");
      }
    });
    client.on("historyError", (e: any) => setSyncMsg(`Sync interrupted: ${e?.message ?? "error"}`));
  }, [refreshMetrics]);

  const connect = useCallback(async () => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.bluetooth) {
      const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
      setError(isIOS
        ? "iOS browsers can't use Bluetooth. Open this page in the Bluefy app (App Store)."
        : "This browser has no Web Bluetooth. Use Chrome or Edge.");
      return;
    }
    try {
      const client = new WhoopClient();
      clientRef.current = client;
      wire(client);
      if (dbRef.current) sessionRef.current = await startSession(dbRef.current);
      await client.requestAndConnect();
    } catch (e: any) {
      // User-cancelled chooser is not an error worth surfacing loudly.
      if (e?.name !== "NotFoundError") setError(e?.message ?? "Connection failed");
      setState("disconnected");
    }
  }, [wire]);

  const disconnect = useCallback(async () => {
    try {
      await flush();
      if (dbRef.current && sessionRef.current) await endSession(dbRef.current, sessionRef.current, countRef.current);
      await clientRef.current?.disconnect();
    } catch (e: any) {
      setError(e?.message ?? "Disconnect failed");
    }
    setHr(null);
  }, []);

  const buzz = useCallback(async () => {
    try { await clientRef.current?.runAlarmNow(); }
    catch (e: any) { setError(e?.message ?? "Haptic failed"); }
  }, []);

  return {
    state, hr, battery, family, sampleCount, syncMsg, error, supported, metrics,
    connect, disconnect, buzz, refreshMetrics,
  };
}
