// Standard Bluetooth SIG Heart Rate Measurement parser (characteristic 0x2A37).
//
// This is the PUBLIC BLE Heart Rate Profile, not Whoop's proprietary protocol.
// WHOOP 5.0 ("Puffin") exposes a standard HR service (0x180D) that streams live
// heart rate AND RR intervals the same way a chest strap does — which is the one
// reliably-working live data path on 5.0 (the proprietary 5.0 sensor packets are
// not yet decoded). RR intervals feed HRV; HR feeds strain/zones. WHOOP 4.0 can
// also turn this service on via the Generic HR Profile toggle.
//
// Spec: Heart Rate Measurement, org.bluetooth.characteristic.heart_rate_measurement
//   byte 0 = flags:
//     bit0  HR value format: 0 = uint8, 1 = uint16 LE
//     bit1-2 sensor contact status (bit2 = supported, bit1 = contact)
//     bit3  energy expended present (uint16 LE, kJ)
//     bit4  RR intervals present (one or more uint16 LE, units 1/1024 s)
//   then HR value, [energy], [RR...]
//
// RR is in 1/1024-second units per spec; convert to milliseconds.

const RR_UNIT_MS = 1000 / 1024;

/**
 * Parse a Heart Rate Measurement value.
 * @param {DataView|ArrayBuffer|Uint8Array} input - the characteristic value
 * @returns {{ heartRateBpm: number|null, rrIntervalsMs: number[],
 *             contactSupported: boolean, contact: boolean|null,
 *             energyKj: number|null }}
 */
export function parseHeartRateMeasurement(input) {
  const view = toDataView(input);
  if (!view || view.byteLength < 2) {
    return { heartRateBpm: null, rrIntervalsMs: [], contactSupported: false, contact: null, energyKj: null };
  }

  const flags = view.getUint8(0);
  const hr16 = (flags & 0x01) !== 0;
  const contactSupported = (flags & 0x04) !== 0;
  const contact = contactSupported ? (flags & 0x02) !== 0 : null;
  const energyPresent = (flags & 0x08) !== 0;
  const rrPresent = (flags & 0x10) !== 0;

  let offset = 1;
  let heartRateBpm;
  if (hr16) {
    heartRateBpm = view.getUint16(offset, true);
    offset += 2;
  } else {
    heartRateBpm = view.getUint8(offset);
    offset += 1;
  }
  // 0 bpm = sensor reporting no contact / not measuring.
  if (!(heartRateBpm >= 1 && heartRateBpm <= 250)) heartRateBpm = null;

  let energyKj = null;
  if (energyPresent && offset + 2 <= view.byteLength) {
    energyKj = view.getUint16(offset, true);
    offset += 2;
  }

  const rrIntervalsMs = [];
  if (rrPresent) {
    for (; offset + 2 <= view.byteLength; offset += 2) {
      const raw = view.getUint16(offset, true);
      const ms = Math.round(raw * RR_UNIT_MS);
      // Physiologically plausible band (matches OpenWhoop's RR gate elsewhere).
      if (ms >= 200 && ms <= 2500) rrIntervalsMs.push(ms);
    }
  }

  return { heartRateBpm, rrIntervalsMs, contactSupported, contact, energyKj };
}

function toDataView(input) {
  if (input == null) return null;
  if (input instanceof DataView) return input;
  if (input instanceof ArrayBuffer) return new DataView(input);
  if (ArrayBuffer.isView(input)) return new DataView(input.buffer, input.byteOffset, input.byteLength);
  return null;
}
