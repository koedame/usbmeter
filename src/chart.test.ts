import { describe, expect, it } from "vitest";
import { axisRange, niceStep } from "./chart.ts";

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
  it("when every value is zero, the axis still runs from 0 to a round number", () => {
    expect(axisRange([0, 0, 0], 0.1)).toEqual({ bottom: 0, top: 0.05, step: 0.05 });
  });

  it("when the values reach 10.02 W, the axis tops out at the next round step", () => {
    expect(axisRange([6.5, 10.02], 1)).toEqual({ bottom: 0, top: 15, step: 5 });
  });

  it("when there are far more values than a function call can take as arguments, still works", () => {
    expect(axisRange(new Array(500_000).fill(3), 1).top).toBeGreaterThanOrEqual(3);
  });
});
