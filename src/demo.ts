import { encodeReport, type Reading } from "./protocol.ts";

/** A pretend USB meter: a phone charging at 5 V, with the load rising and falling. */
export function startDemo(onData: (chunk: Uint8Array) => void, intervalMs = 500): () => void {
  let second = 0;
  let energyWh = 0;
  let capacityAh = 0;
  const hours = intervalMs / 3_600_000;

  const timer = setInterval(() => {
    second += intervalMs / 1000;
    const load = 1.2 + 0.9 * Math.sin(second / 7) + 0.15 * Math.sin(second * 2.3);
    const current = Math.max(0.05, Math.round(load * 100) / 100);
    const voltage = Math.round((5.08 - 0.06 * current) * 100) / 100;
    energyWh += voltage * current * hours;
    capacityAh += current * hours;
    const reading: Reading = {
      kind: "usb",
      voltage,
      current,
      power: voltage * current,
      energyWh: Math.round(energyWh * 100) / 100,
      capacityAh: Math.round(capacityAh * 1000) / 1000,
      dPlus: 0.6,
      dMinus: 0.6,
      temperatureC: 27 + Math.min(8, Math.floor(second / 30)),
      durationSec: Math.floor(second),
      backlightSec: 60,
      checksumOk: true,
    };
    // Split like a real connection would, so the demo exercises the same reassembly code.
    const frame = encodeReport(reading);
    onData(frame.slice(0, 20));
    onData(frame.slice(20));
  }, intervalMs);

  return () => clearInterval(timer);
}
