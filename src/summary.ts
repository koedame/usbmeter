import type { Sample } from "./history.ts";
import type { Reading } from "./protocol.ts";

/** The readings a summary gives a range for, by their CSV column name */
export const SUMMARY_COLUMNS = {
  voltage_v: (r: Reading) => r.voltage,
  current_a: (r: Reading) => r.current,
  power_w: (r: Reading) => r.power,
  temperature_c: (r: Reading) => r.temperatureC,
  d_plus_v: (r: Reading) => r.dPlus,
  d_minus_v: (r: Reading) => r.dMinus,
  frequency_hz: (r: Reading) => r.frequencyHz,
  power_factor: (r: Reading) => r.powerFactor,
} satisfies Record<string, (reading: Reading) => number | undefined>;

export type SummaryColumn = keyof typeof SUMMARY_COLUMNS;

export interface Range {
  min: number;
  mean: number;
  max: number;
  first: number;
  last: number;
}

/** A total over the recording, measured two ways that should agree */
export interface Total {
  /** Rate times time, added up over the rows; time inside a pause is left out */
  integrated: number;
  /**
   * How far the meter's own counter moved between the first and the last row. "reset" when
   * it went back on the way, undefined when not every row has the counter.
   */
  counted: number | "reset" | undefined;
}

export interface Summary {
  rows: number;
  start: Date;
  end: Date;
  /** The usual time between two rows, in seconds. Undefined for a single row. */
  intervalS: number | undefined;
  /** Stretches without rows that are much longer than the usual interval */
  pauses: { count: number; totalS: number; longestS: number };
  ranges: Partial<Record<SummaryColumn, Range>>;
  energyWh: Total;
  chargeAh: Total;
}

/** A stretch without rows counts as a pause from this many usual intervals, and never below this many seconds */
const PAUSE_INTERVALS = 5;
const PAUSE_MIN_S = 3;

function median(sorted: number[]): number {
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle] ?? 0;
  return sorted.length % 2 === 1 ? upper : ((sorted[middle - 1] ?? upper) + upper) / 2;
}

function counted(values: (number | undefined)[]): Total["counted"] {
  let previous: number | undefined;
  for (const value of values) {
    if (value === undefined) return undefined;
    if (previous !== undefined && value < previous) return "reset";
    previous = value;
  }
  const first = values[0];
  return first === undefined || previous === undefined ? undefined : previous - first;
}

/** What a recording adds up to. Returns undefined for an empty one. */
export function summarize(samples: Sample[]): Summary | undefined {
  const first = samples[0];
  const last = samples.at(-1);
  if (!first || !last) return undefined;

  const steps = samples.slice(1).map((sample, i) => (sample.t - (samples[i]?.t ?? 0)) / 1000);
  const intervalS = steps.length === 0 ? undefined : median([...steps].sort((a, b) => a - b));
  const pauseFrom = Math.max(PAUSE_MIN_S, PAUSE_INTERVALS * (intervalS ?? 0));
  const pauses = { count: 0, totalS: 0, longestS: 0 };
  let energyWh = 0;
  let chargeAh = 0;
  steps.forEach((step, i) => {
    if (step >= pauseFrom) {
      pauses.count += 1;
      pauses.totalS += step;
      pauses.longestS = Math.max(pauses.longestS, step);
      return;
    }
    const from = samples[i]?.reading;
    const to = samples[i + 1]?.reading;
    // a clock that was set back gives a step that runs backwards; it adds nothing
    if (!from || !to || step <= 0) return;
    energyWh += (((from.power + to.power) / 2) * step) / 3600;
    chargeAh += (((from.current + to.current) / 2) * step) / 3600;
  });

  const ranges: Summary["ranges"] = {};
  for (const [column, read] of Object.entries(SUMMARY_COLUMNS)) {
    let range: Range | undefined;
    let sum = 0;
    let count = 0;
    for (const sample of samples) {
      const value = read(sample.reading);
      if (value === undefined) continue;
      range ??= { min: value, mean: value, max: value, first: value, last: value };
      range.min = Math.min(range.min, value);
      range.max = Math.max(range.max, value);
      range.last = value;
      sum += value;
      count += 1;
    }
    if (!range) continue;
    range.mean = sum / count;
    ranges[column as SummaryColumn] = range;
  }

  return {
    rows: samples.length,
    start: first.at,
    end: last.at,
    intervalS,
    pauses,
    ranges,
    energyWh: { integrated: energyWh, counted: counted(samples.map((s) => s.reading.energyWh)) },
    chargeAh: {
      integrated: chargeAh,
      counted: counted(samples.map((s) => s.reading.capacityAh)),
    },
  };
}
