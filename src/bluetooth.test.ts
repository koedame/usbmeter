import { describe, expect, it } from "vitest";
import { knownMeterName, METER_FILTERS, shownName } from "./bluetooth.ts";

/** Whether the browser would list a device with this advertised name and these advertised services */
function listed(name: string, services: number[] = []): boolean {
  return METER_FILTERS.some(
    (filter) =>
      (filter.namePrefix !== undefined && name.startsWith(filter.namePrefix)) ||
      (filter.services ?? []).some((uuid) => services.includes(uuid as number)),
  );
}

describe("METER_FILTERS", () => {
  it("when a J7-C advertises as UC96_BLE without naming its service, it is listed", () => {
    expect(listed("UC96_BLE")).toBe(true);
  });

  it("when an ATorch meter advertises its model name, it is listed", () => {
    expect(["UD18-BLE", "AT24-BLE", "DL24M_BLE"].map((name) => listed(name))).toEqual([
      true,
      true,
      true,
    ]);
  });

  it("when an unknown meter advertises the serial service 0xFFE0, it is listed whatever its name", () => {
    expect(listed("BT05", [0xffe0])).toBe(true);
  });

  it("when a keyboard, earbuds, a mouse or a nameless device are nearby, they are left out", () => {
    expect({
      keyboard: listed("Magic Keyboard", [0x1812]),
      earbuds: listed("DAISO_TWS_G273_3"),
      mouse: listed("MX Ergo", [0x1812, 0x180f]),
      nameless: listed(""),
    }).toEqual({ keyboard: false, earbuds: false, mouse: false, nameless: false });
  });
});

describe("knownMeterName", () => {
  it("when the name starts like a known meter, also with the NUL padding of a J7-C, it is known", () => {
    expect(["UC96_BLE", "UC96_BLE\0\0\0", "DL24M_BLE"].map(knownMeterName)).toEqual([
      true,
      true,
      true,
    ]);
  });

  it("when the name starts differently, or the device has no name, it is not known", () => {
    expect(["BT05", "uc96_ble", " UC96_BLE", undefined].map(knownMeterName)).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });
});

describe("shownName", () => {
  it("when a J7-C pads its name with NUL characters, the padding is not shown", () => {
    expect(shownName("UC96_BLE\0\0\0")).toBe("UC96_BLE");
  });

  it("when a device has no name, or nothing but padding, there is no name to show", () => {
    expect([undefined, "", "\0\0"].map(shownName)).toEqual([undefined, undefined, undefined]);
  });
});
