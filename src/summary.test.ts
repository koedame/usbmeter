import { describe, expect, it } from "vitest";
import type { Sample } from "./history.ts";
import type { Reading } from "./protocol.ts";
import { summarize } from "./summary.ts";

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
