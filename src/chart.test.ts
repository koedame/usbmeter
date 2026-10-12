import { describe, expect, it } from "vitest";
import {
  axisRange,
  decimate,
  nearestIndex,
  niceStep,
  type Point,
  splitAtGaps,
  stepDecimals,
  stepIndex,
  timeAt,
  timeTicks,
  xAt,
} from "./chart.ts";

describe("niceStep", () => {
  it("when the span is 1.7 A over 4 ticks, steps by 0.5", () => {
    expect(niceStep(1.7, 4)).toBe(0.5);
  });

  it("when the span is 19.8 V over 4 ticks, steps by 5", () => {
    expect(niceStep(19.8, 4)).toBe(5);
  });

  it("when the span is tiny, still returns a positive step", () => {
    expect(niceStep(0.003, 4)).toBeCloseTo(0.001, 6);
  });
});

describe("axisRange", () => {
  it("when an idle meter reads 0 A throughout, the current axis still spans its minimum instead of collapsing", () => {
    expect(axisRange(0, 0, 0.5, true)).toEqual({ bottom: 0, top: 0.6, step: 0.2 });
  });

  it("when power reaches 10.02 W on an axis that starts at 0, the axis tops out at the next round step", () => {
    expect(axisRange(6.5, 10.02, 2, true)).toEqual({ bottom: 0, top: 15, step: 5 });
  });

  it("when a 5 V supply sags between 4.73 and 5.08 V, the voltage axis zooms in on that band instead of starting at 0", () => {
    expect(axisRange(4.73, 5.08, 0.5, false)).toEqual({ bottom: 4.6, top: 5.2, step: 0.2 });
  });

  it("when the values swing more than the minimum span, the axis covers all of them", () => {
    expect(axisRange(5.01, 20.1, 0.5, false)).toEqual({ bottom: 5, top: 25, step: 5 });
  });

  it("when a zoomed axis would dip below zero for a voltage near 0 V, it starts at 0", () => {
    expect(axisRange(0.1, 0.1, 0.5, false)).toEqual({ bottom: 0, top: 0.6, step: 0.2 });
  });
});

describe("timeTicks", () => {
  const at = (h: number, m: number, s: number) => Date.UTC(2026, 0, 1, h, m, s);

  it("when one minute is on screen with room for 6 labels, the labels fall on every 10th second of the clock", () => {
    expect(timeTicks(at(0, 0, 3), at(0, 1, 3), 6, 0)).toEqual({
      stepMs: 10_000,
      ticks: [at(0, 0, 10), at(0, 0, 20), at(0, 0, 30), at(0, 0, 40), at(0, 0, 50), at(0, 1, 0)],
    });
  });

  it("when the local clock is 5 h 30 min ahead of UTC, hourly labels fall on full local hours", () => {
    const { stepMs, ticks } = timeTicks(at(0, 0, 0), at(6, 0, 0), 6, -330 * 60_000);
    expect(stepMs).toBe(3_600_000);
    expect(ticks[0]).toBe(at(0, 30, 0)); // 06:00 local
    expect(ticks).toHaveLength(6);
  });

  it("when there is only room for 2 labels on a 10 minute axis, it steps by 5 minutes", () => {
    expect(timeTicks(at(0, 0, 0), at(0, 10, 0), 2, 0).stepMs).toBe(300_000);
  });
});

describe("decimate", () => {
  const flat = (count: number): Point[] =>
    Array.from({ length: count }, (_, i) => ({ t: i * 1000, v: 1 }));

  it("when there are no more points than the plot can show, keeps every one of them", () => {
    const points = flat(20);
    expect(decimate(points, 0, 19_000, 10)).toEqual(points);
  });

  it("when points are thinned, the newest reading is still where the trace ends", () => {
    const points = flat(3000);
    points[2975] = { t: 2_975_000, v: 5 }; // a spike in the last pixel column, before the end
    expect(decimate(points, 0, 2_999_000, 100).at(-1)).toEqual({ t: 2_999_000, v: 1 });
  });

  it("when an hour of readings is squeezed into 10 pixels, a one-sample spike is still there", () => {
    const points = flat(3600);
    points[1234] = { t: 1_234_000, v: 9 };
    const thinned = decimate(points, 0, 3_599_000, 10);
    expect(thinned.length).toBeLessThanOrEqual(20);
    expect(thinned).toContainEqual({ t: 1_234_000, v: 9 });
  });

  it("when points are thinned, they stay in time order", () => {
    const points = Array.from({ length: 5000 }, (_, i) => ({ t: i * 1000, v: Math.sin(i) }));
    const times = decimate(points, 0, 4_999_000, 50).map((p) => p.t);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});

describe("splitAtGaps", () => {
  it("when the readings pause for longer than the gap, the trace is cut there instead of bridging the pause", () => {
    const points = [0, 1000, 2000, 60_000, 61_000].map((t) => ({ t, v: 1 }));
    expect(splitAtGaps(points, 5000).map((run) => run.map((p) => p.t))).toEqual([
      [0, 1000, 2000],
      [60_000, 61_000],
    ]);
  });
});

describe("nearestIndex", () => {
  it("when the pointer is between two readings, picks the closer one", () => {
    expect(nearestIndex([0, 1000, 2000, 3000], 1400)).toBe(1);
    expect(nearestIndex([0, 1000, 2000, 3000], 1600)).toBe(2);
  });

  it("when the pointer is before the first or after the last reading, picks that end", () => {
    expect(nearestIndex([1000, 2000], 0)).toBe(0);
    expect(nearestIndex([1000, 2000], 9000)).toBe(1);
  });

  it("when nothing is recorded, reports that there is no reading", () => {
    expect(nearestIndex([], 5)).toBe(-1);
  });
});

describe("timeAt", () => {
  // a plot 1066 px wide has 1000 px between its gutters (52 px left, 14 px right)
  it("when the pointer is halfway across the plot area, gives the middle of the time on screen", () => {
    expect(timeAt(52 + 500, 1066, 10_000, 70_000)).toBe(40_000);
  });

  it("when the pointer is over the axis labels beside the plot area, stops at the edge of the time on screen", () => {
    expect(timeAt(10, 1066, 10_000, 70_000)).toBe(10_000);
    expect(timeAt(1060, 1066, 10_000, 70_000)).toBe(70_000);
  });
});

describe("xAt", () => {
  it("when asked where a time is, gives the position timeAt turns back into that time", () => {
    for (const t of [10_000, 25_000, 70_000])
      expect(timeAt(xAt(t, 1066, 10_000, 70_000), 1066, 10_000, 70_000)).toBe(t);
  });

  it("when the time is outside the time on screen, stops at the edge of the plot area", () => {
    expect(xAt(0, 1066, 10_000, 70_000)).toBe(52);
    expect(xAt(99_000, 1066, 10_000, 70_000)).toBe(1052);
  });
});

describe("stepIndex", () => {
  it("when an arrow key is pressed, moves one reading, and stays within the recording", () => {
    expect(stepIndex("ArrowLeft", 5, 20)).toBe(4);
    expect(stepIndex("ArrowRight", 5, 20)).toBe(6);
    expect(stepIndex("ArrowLeft", 0, 20)).toBe(0);
    expect(stepIndex("ArrowRight", 19, 20)).toBe(19);
  });

  it("when Page Up or Page Down is pressed, moves ten readings", () => {
    expect(stepIndex("PageUp", 15, 20)).toBe(5);
    expect(stepIndex("PageDown", 15, 20)).toBe(19);
  });

  it("when Home or End is pressed, goes to the oldest or the newest reading", () => {
    expect(stepIndex("Home", 7, 20)).toBe(0);
    expect(stepIndex("End", 7, 20)).toBe(19);
  });

  it("when any other key is pressed, leaves the cursor where it is", () => {
    expect(stepIndex("a", 7, 20)).toBeUndefined();
    expect(stepIndex("Tab", 7, 20)).toBeUndefined();
  });
});

describe("stepDecimals", () => {
  it("when the axis steps by 0.2, 0.05 or 5, labels get 1, 2 or 0 decimals", () => {
    expect([0.2, 0.05, 5].map(stepDecimals)).toEqual([1, 2, 0]);
  });
});
