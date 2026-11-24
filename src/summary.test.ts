import { describe, expect, it } from "vitest";
import type { Sample } from "./history.ts";
import type { Reading } from "./protocol.ts";
import { median, summarize } from "./summary.ts";

const usb = (fields: Partial<Reading>): Reading => ({
  kind: "usb",
  voltage: 5,
  current: 1,
  power: 5,
  energyWh: 0,
  capacityAh: 0,
  dPlus: 0.6,
  dMinus: 0.6,
  temperatureC: 30,
  durationSec: 0,
  backlightSec: 60,
  checksumOk: true,
  ...fields,
});

/** One sample per entry: [seconds since the start, reading] */
function recording(rows: [number, Reading][]): Sample[] {
  return rows.map(([second, reading]) => ({
    t: second * 1000,
    at: new Date(Date.UTC(2026, 0, 1, 0, 0, second)),
    reading,
  }));
}

describe("summarize", () => {
  it("when nothing was recorded, there is no summary", () => {
    expect(summarize([])).toBeUndefined();
  });

  it("when a recording has rows, gives when it started and ended and how often rows come", () => {
    const summary = summarize(recording([0, 1, 2, 3].map((second) => [second, usb({})])));
    expect(summary).toMatchObject({ rows: 4, intervalS: 1 });
    expect(summary?.start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(summary?.end.toISOString()).toBe("2026-01-01T00:00:03.000Z");
  });

  it("when readings vary, gives the lowest, mean, highest, first and last of each column", () => {
    const summary = summarize(
      recording([
        [0, usb({ voltage: 5.1, temperatureC: 28 })],
        [1, usb({ voltage: 4.9, temperatureC: 29 })],
        [2, usb({ voltage: 5.3, temperatureC: 33 })],
      ]),
    );
    expect(summary?.ranges.voltage_v).toEqual({
      min: 4.9,
      mean: expect.closeTo(5.1),
      max: 5.3,
      first: 5.1,
      last: 5.3,
    });
    expect(summary?.ranges.temperature_c).toEqual({
      min: 28,
      mean: 30,
      max: 33,
      first: 28,
      last: 33,
    });
  });

  it("when the meter does not report a column, the summary leaves it out", () => {
    const { dPlus: _, dMinus: __, ...withoutDataLines } = usb({});
    const summary = summarize(recording([[0, { ...withoutDataLines, kind: "dc" }]]));
    expect(Object.keys(summary?.ranges ?? {})).toEqual([
      "voltage_v",
      "current_a",
      "power_w",
      "temperature_c",
    ]);
  });

  it("when power is steady at 6 W for an hour, the energy added up from the rows is 6 Wh and the charge follows the current", () => {
    const rows: [number, Reading][] = [];
    for (let second = 0; second <= 3600; second += 10)
      rows.push([second, usb({ voltage: 5, current: 1.2, power: 6 })]);
    const summary = summarize(recording(rows));
    expect(summary?.energyWh.integrated).toBeCloseTo(6, 6);
    expect(summary?.chargeAh.integrated).toBeCloseTo(1.2, 6);
  });

  it("when power ramps between two rows, the energy is the area under the straight line between them", () => {
    const summary = summarize(
      recording([
        [0, usb({ power: 0, current: 0 })],
        [3600, usb({ power: 10, current: 2 })],
        [7200, usb({ power: 10, current: 2 })],
      ]),
    );
    // 5 Wh under the ramp, 10 Wh under the flat hour (two equal steps, so neither is a pause)
    expect(summary?.energyWh.integrated).toBeCloseTo(15, 6);
  });

  it("when rows stop for much longer than usual, that stretch is a pause and adds no energy", () => {
    const rows: [number, Reading][] = [0, 1, 2, 3, 63, 64, 65].map((second) => [
      second,
      usb({ power: 3600, current: 3600 }),
    ]);
    const summary = summarize(recording(rows));
    expect(summary?.pauses).toEqual({ count: 1, totalS: 60, longestS: 60 });
    expect(summary?.energyWh.integrated).toBeCloseTo(5, 6); // 5 one-second steps at 3600 W
  });

  it("when the meter's counters only rise, the summary says how far they moved", () => {
    const summary = summarize(
      recording([
        [0, usb({ energyWh: 100.5, capacityAh: 20.1 })],
        [1, usb({ energyWh: 100.5, capacityAh: 20.101 })],
        [2, usb({ energyWh: 101.75, capacityAh: 20.35 })],
      ]),
    );
    expect(summary?.energyWh.counted).toBeCloseTo(1.25);
    expect(summary?.chargeAh.counted).toBeCloseTo(0.25);
  });

  it("when a counter of the meter goes back, it was reset, and the summary says so instead of a counted total", () => {
    const summary = summarize(
      recording([
        [0, usb({ energyWh: 100, capacityAh: 20 })],
        [1, usb({ energyWh: 0, capacityAh: 0 })],
        [2, usb({ energyWh: 0.01, capacityAh: 0.002 })],
      ]),
    );
    expect(summary?.energyWh.counted).toBe("reset");
    expect(summary?.chargeAh.counted).toBe("reset");
  });

  it("when the meter has no counters, as DC meters here, only the totals added up from the rows are given", () => {
    const { energyWh: _, capacityAh: __, ...withoutCounters } = usb({ power: 3600, current: 2 });
    const summary = summarize(
      recording([
        [0, { ...withoutCounters, kind: "dc" }],
        [1, { ...withoutCounters, kind: "dc" }],
      ]),
    );
    expect(summary?.energyWh).toEqual({ integrated: expect.closeTo(1), counted: undefined });
    expect(summary?.chargeAh.counted).toBeUndefined();
  });

  it("when only one of the two counters was reset, the other still gives its counted total", () => {
    const summary = summarize(
      recording([
        [0, usb({ energyWh: 100, capacityAh: 20 })],
        [1, usb({ energyWh: 0, capacityAh: 20.5 })],
      ]),
    );
    expect(summary?.energyWh.counted).toBe("reset");
    expect(summary?.chargeAh.counted).toBeCloseTo(0.5);
  });

  it("when some rows lack a counter, as after switching to a meter without one, there is no counted total", () => {
    const { energyWh: _, capacityAh: __, ...withoutCounters } = usb({});
    const summary = summarize(
      recording([
        [0, usb({ energyWh: 1, capacityAh: 1 })],
        [1, { ...withoutCounters, kind: "dc" }],
      ]),
    );
    expect(summary?.energyWh.counted).toBeUndefined();
    expect(summary?.chargeAh.counted).toBeUndefined();
  });

  it("when there is a single row, there is no usual interval, no pause and nothing added up", () => {
    const summary = summarize(recording([[0, usb({ power: 5 })]]));
    expect(summary).toMatchObject({
      rows: 1,
      intervalS: undefined,
      pauses: { count: 0, totalS: 0, longestS: 0 },
      energyWh: { integrated: 0, counted: 0 },
    });
  });

  it("when there are two rows, their distance is the usual interval and the energy between them is added up", () => {
    const summary = summarize(
      recording([
        [0, usb({ power: 3600 })],
        [2, usb({ power: 3600 })],
      ]),
    );
    expect(summary).toMatchObject({ rows: 2, intervalS: 2, pauses: { count: 0 } });
    expect(summary?.energyWh.integrated).toBeCloseTo(2);
  });

  it("when the clock was set back between two rows, that step adds nothing instead of taking energy away", () => {
    const summary = summarize(
      recording([
        [3600, usb({ power: 3600, current: 3600 })],
        [3601, usb({ power: 3600, current: 3600 })],
        [0, usb({ power: 3600, current: 3600 })],
        [1, usb({ power: 3600, current: 3600 })],
      ]),
    );
    expect(summary?.energyWh.integrated).toBeCloseTo(2);
    expect(summary?.chargeAh.integrated).toBeCloseTo(2);
  });

  it("when the recording is at the sample limit, it is summarized with the same totals as a short one", () => {
    const rows: [number, Reading][] = [];
    for (let second = 0; second < 100_000; second++)
      rows.push([second, usb({ voltage: 5, power: 3.6, energyWh: second / 1000 })]);
    const summary = summarize(recording(rows));
    expect(summary?.ranges.voltage_v).toEqual({ min: 5, mean: 5, max: 5, first: 5, last: 5 });
    expect(summary?.energyWh.integrated).toBeCloseTo(99.999, 3); // 3.6 W for 99,999 s
    expect(summary?.energyWh.counted).toBeCloseTo(99.999, 3);
    expect(summary?.intervalS).toBe(1);
  });
});

describe("median", () => {
  it("when there is an odd number of values, gives the one in the middle of their order", () => {
    expect(median(Float64Array.of(5.02, 4.71, 4.98))).toBe(4.98);
  });

  it("when there is an even number of values, gives the mean of the two in the middle", () => {
    expect(median(Float64Array.of(10, 2, 1, 3))).toBe(2.5);
  });

  it("when most of the values are the same, gives that value", () => {
    expect(median(Float64Array.of(0, 0, 0, 0, 0, 3.2, 0))).toBe(0);
    expect(median(Float64Array.of(1, 5, 5, 5, 5, 9))).toBe(5);
  });

  it("when there are no values, gives no number", () => {
    expect(median(new Float64Array(0))).toBeNaN();
  });

  it("when there are thousands of values, agrees with sorting them", () => {
    let seed = 7;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (const count of [1, 2, 999, 1000]) {
      const values = Array.from({ length: count }, () => Math.round(random() * 500) / 100);
      const sorted = [...values].sort((a, b) => a - b);
      const middle = count >> 1;
      const wanted =
        count % 2 === 1 ? sorted[middle] : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
      expect(median(Float64Array.from(values))).toBe(wanted);
    }
  });
});

/**
 * Values in the order that makes a selection with the middle value as its pivot split them as
 * unevenly as it can: every value starts unknown, and a value is fixed, below all the unknown
 * ones, when it is first compared as the pivot (McIlroy's adversary for quicksort).
 */
function unevenOrder(count: number): Float64Array {
  const value = new Float64Array(count).fill(Number.POSITIVE_INFINITY);
  let fixed = 0;
  const fix = (item: number) => {
    if (value[item] === Number.POSITIVE_INFINITY) value[item] = fixed++;
  };
  const items = Array.from({ length: count }, (_, i) => i);
  const at = (i: number) => items[i] ?? 0;
  const k = count >> 1;
  let left = 0;
  let right = count - 1;
  while (left < right) {
    const pivot = at((left + right) >> 1);
    let i = left;
    let j = right;
    while (i <= j) {
      for (;;) {
        if (value[at(i)] === Number.POSITIVE_INFINITY) fix(pivot);
        if (!((value[at(i)] ?? 0) < (value[pivot] ?? 0))) break;
        i++;
      }
      for (;;) {
        if (value[at(j)] === Number.POSITIVE_INFINITY) fix(pivot);
        if (!((value[at(j)] ?? 0) > (value[pivot] ?? 0))) break;
        j--;
      }
      if (i <= j) {
        [items[i], items[j]] = [at(j), at(i)];
        i++;
        j--;
      }
    }
    if (k <= j) right = j;
    else if (k >= i) left = i;
    else break;
  }
  for (let i = 0; i < count; i++) fix(i);
  return value;
}

describe("median of values in an unfavourable order", () => {
  it("when the values come in the order that splits them most unevenly, still finds the median of 20,000 in a few milliseconds", () => {
    // in this order a selection that only splits takes about 0.2 s here, and the time grows with the square of the count
    const values = unevenOrder(20_000).map((v) => v / 100);
    const started = performance.now();
    const found = median(values);
    expect(performance.now() - started).toBeLessThan(50);
    expect(found).toBe((9_999 + 10_000) / 2 / 100);
  });
});
