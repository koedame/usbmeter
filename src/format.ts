import type { Reading } from "./protocol.ts";

export function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor(totalSec / 60) % 60;
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Digits worth showing: the meters resolve 10 mV / 10 mA (USB) or 100 mV / 1 mA (AC, DC). */
export function formatVoltage(reading: Reading): string {
  return reading.voltage.toFixed(reading.kind === "usb" ? 2 : 1);
}

export function formatCurrent(reading: Reading): string {
  return reading.current.toFixed(reading.kind === "usb" ? 2 : 3);
}

export function formatPower(reading: Reading): string {
  return reading.power.toFixed(reading.kind === "ac" ? 1 : 2);
}

export function formatEnergy(reading: Reading): { value: string; unit: string } {
  if (reading.kind === "ac") return { value: (reading.energyWh / 1000).toFixed(2), unit: "kWh" };
  return { value: reading.energyWh.toFixed(2), unit: "Wh" };
}

export function formatCapacity(capacityAh: number): string {
  return Math.round(capacityAh * 1000).toLocaleString("en-US");
}
