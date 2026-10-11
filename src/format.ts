import type { Reading } from "./protocol.ts";

export function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor(totalSec / 60) % 60;
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatEnergy(reading: Reading): { value: string; unit: string } {
  const energyWh = reading.energyWh ?? 0;
  if (reading.kind === "ac") return { value: (energyWh / 1000).toFixed(2), unit: "kWh" };
  return { value: energyWh.toFixed(2), unit: "Wh" };
}

/**
 * Capacity in mAh. Written without a thousands separator: "1,234" is a thousand in one
 * language of the page and a little over one in the next.
 */
export function formatCapacity(capacityAh: number): string {
  return String(Math.round(capacityAh * 1000));
}
