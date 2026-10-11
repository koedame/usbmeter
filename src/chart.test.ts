import { describe, expect, it } from "vitest";
import { niceStep } from "./chart.ts";

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
