import { describe, expect, it } from "vitest";
import { History } from "./history.ts";
import type { Reading } from "./protocol.ts";

const reading = (power: number): Reading => ({
  kind: "usb",
  voltage: 5,
  current: power / 5,
  power,
  energyWh: 1.5,
  capacityAh: 0.3,
  dPlus: 0.6,
  dMinus: 0.6,
  temperatureC: 30,
  durationSec: 10,
  backlightSec: 60,
  checksumOk: true,
});

const at = (seconds: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, seconds));

describe("History", () => {
  it("when more samples than the limit are added, keeps the newest ones", () => {
    const history = new History(3);
    for (let i = 0; i < 5; i++) history.add(reading(i), at(i));
    expect(history.window(undefined).map((s) => s.reading.power)).toEqual([2, 3, 4]);
  });

  it("when a time window is asked for, returns only the samples inside it", () => {
    const history = new History();
    for (let i = 0; i <= 100; i++) history.add(reading(i), at(i));
    expect(history.window(10_000).map((s) => s.t / 1000)).toEqual([
      90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100,
    ]);
  });

  it("when cleared, starts counting time again from the next sample", () => {
    const history = new History();
    history.add(reading(1), at(0));
    history.clear();
    history.add(reading(2), at(50));
    expect(history.window(undefined).map((s) => s.t)).toEqual([0]);
  });

  it("when exported as CSV, writes a header and one row per sample, leaving unused columns empty", () => {
    const history = new History();
    history.add(
      {
        kind: "ac",
        voltage: 5,
        current: 1,
        power: 5,
        energyWh: 1.5,
        temperatureC: 30,
        durationSec: 10,
        backlightSec: 60,
        checksumOk: true,
      },
      at(0),
    );
    const [header, row, ...rest] = history.toCsv().split("\n");
    expect(header).toBe(
      "time,elapsed_s,voltage_v,current_a,power_w,energy_wh,capacity_ah,temperature_c,d_plus_v,d_minus_v,frequency_hz,power_factor",
    );
    expect(row).toBe("2026-01-01T00:00:00.000Z,0.00,5,1,5,1.5,,30,,,,");
    expect(rest).toEqual([""]);
  });
});
