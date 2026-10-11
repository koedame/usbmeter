import type { Reading } from "./protocol.ts";

export interface Sample {
  /** milliseconds since the first sample */
  t: number;
  /** wall-clock time, for the CSV */
  at: Date;
  reading: Reading;
}

export type Metric = "power" | "voltage" | "current";

/** The last `limit` samples of a connection. Older ones are dropped, so memory stays bounded. */
export class History {
  private samples: Sample[] = [];
  private origin: number | undefined;

  private readonly limit: number;

  constructor(limit = 100_000) {
    this.limit = limit;
  }

  add(reading: Reading, now = new Date()): void {
    this.origin ??= now.getTime();
    this.samples.push({ t: now.getTime() - this.origin, at: now, reading });
    if (this.samples.length > this.limit) this.samples.shift();
  }

  clear(): void {
    this.samples = [];
    this.origin = undefined;
  }

  get length(): number {
    return this.samples.length;
  }

  /** Samples from the last `windowMs` milliseconds, or all of them when windowMs is undefined */
  window(windowMs: number | undefined): Sample[] {
    const last = this.samples.at(-1);
    if (windowMs === undefined || !last) return this.samples;
    const from = last.t - windowMs;
    return this.samples.filter((s) => s.t >= from);
  }

  toCsv(): string {
    const rows = this.samples.map(({ t, at, reading: r }) =>
      [
        at.toISOString(),
        (t / 1000).toFixed(2),
        r.voltage,
        r.current,
        r.power,
        r.energyWh ?? "",
        r.capacityAh ?? "",
        r.temperatureC,
        r.dPlus ?? "",
        r.dMinus ?? "",
        r.frequencyHz ?? "",
        r.powerFactor ?? "",
      ].join(","),
    );
    return `${[CSV_HEADER, ...rows].join("\n")}\n`;
  }
}

const CSV_HEADER =
  "time,elapsed_s,voltage_v,current_a,power_w,energy_wh,capacity_ah,temperature_c,d_plus_v,d_minus_v,frequency_hz,power_factor";
