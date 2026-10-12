import { describe, expect, it } from "vitest";
import { formatCapacity } from "./format.ts";

describe("formatCapacity", () => {
  it("when the capacity is 12.345 Ah, it reads 12345, without a separator that some languages would take for a decimal point", () => {
    expect(formatCapacity(12.345)).toBe("12345");
  });

  it("when the meter counts 0.7754 Ah, it reads 775 mAh, rounded to whole mAh", () => {
    expect(formatCapacity(0.7754)).toBe("775");
  });
});
