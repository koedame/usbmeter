import { describe, expect, it } from "vitest";
import { METRICS, PANELS } from "./metrics.ts";

describe("PANELS", () => {
  it("when two quantities share a plot, they share a unit, because the plot has one y-axis", () => {
    for (const panel of PANELS) {
      const units = new Set(panel.metrics.map((id) => METRICS[id].unit));
      expect(units.size, panel.id).toBe(1);
    }
  });
});
