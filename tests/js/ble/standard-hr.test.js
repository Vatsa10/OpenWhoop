import { describe, it, expect } from 'vitest';
import { parseHeartRateMeasurement } from '../../../web/js/ble/standard-hr.js';

// Helper: build a Heart Rate Measurement value from bytes.
const dv = (...bytes) => new DataView(new Uint8Array(bytes).buffer);

describe('parseHeartRateMeasurement', () => {
  it('uint8 HR, no flags', () => {
    // flags=0x00, hr=72
    const out = parseHeartRateMeasurement(dv(0x00, 72));
    expect(out.heartRateBpm).toBe(72);
    expect(out.rrIntervalsMs).toEqual([]);
    expect(out.contactSupported).toBe(false);
    expect(out.contact).toBeNull();
  });

  it('uint16 HR (flag bit0)', () => {
    // flags=0x01 → HR is uint16 LE; 300 = 0x012C
    const out = parseHeartRateMeasurement(dv(0x01, 0x2c, 0x01));
    // 300 is out of the 1..250 plausible band → null
    expect(out.heartRateBpm).toBeNull();
    const ok = parseHeartRateMeasurement(dv(0x01, 200, 0x00));
    expect(ok.heartRateBpm).toBe(200);
  });

  it('sensor contact bits', () => {
    // bit2 supported + bit1 contact = 0x06
    const c = parseHeartRateMeasurement(dv(0x06, 60));
    expect(c.contactSupported).toBe(true);
    expect(c.contact).toBe(true);
    // supported but no contact = 0x04
    const nc = parseHeartRateMeasurement(dv(0x04, 60));
    expect(nc.contactSupported).toBe(true);
    expect(nc.contact).toBe(false);
  });

  it('RR intervals present (1/1024 s → ms)', () => {
    // flags=0x10 (RR present), hr=60, RR raw=1024 → 1000 ms, raw=512 → 500 ms
    const out = parseHeartRateMeasurement(dv(0x10, 60, 0x00, 0x04, 0x00, 0x02));
    expect(out.heartRateBpm).toBe(60);
    expect(out.rrIntervalsMs).toEqual([1000, 500]);
  });

  it('energy expended present then RR', () => {
    // flags=0x18 (energy bit3 + RR bit4), hr=55, energy=0x00C8(200), RR raw=1024
    const out = parseHeartRateMeasurement(dv(0x18, 55, 0xc8, 0x00, 0x00, 0x04));
    expect(out.heartRateBpm).toBe(55);
    expect(out.energyKj).toBe(200);
    expect(out.rrIntervalsMs).toEqual([1000]);
  });

  it('filters implausible RR out of 200..2500ms band', () => {
    // RR raw=100 → ~98ms (drop), raw=1024 → 1000ms (keep), raw=3072 → 3000ms (drop)
    const out = parseHeartRateMeasurement(dv(0x10, 60, 100, 0, 0x00, 0x04, 0x00, 0x0c));
    expect(out.rrIntervalsMs).toEqual([1000]);
  });

  it('0 bpm reads as null (no contact / not measuring)', () => {
    expect(parseHeartRateMeasurement(dv(0x00, 0)).heartRateBpm).toBeNull();
  });

  it('handles empty/short input safely', () => {
    expect(parseHeartRateMeasurement(dv(0x00)).heartRateBpm).toBeNull();
    expect(parseHeartRateMeasurement(null).heartRateBpm).toBeNull();
  });

  it('accepts Uint8Array and ArrayBuffer too', () => {
    expect(parseHeartRateMeasurement(new Uint8Array([0x00, 65])).heartRateBpm).toBe(65);
    expect(parseHeartRateMeasurement(new Uint8Array([0x00, 65]).buffer).heartRateBpm).toBe(65);
  });
});
