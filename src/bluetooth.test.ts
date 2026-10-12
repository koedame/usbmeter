import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CONNECT_TIMEOUT_MS,
  connectMeter,
  exactName,
  knownMeterName,
  METER_FILTERS,
  MeterError,
  shownName,
} from "./bluetooth.ts";

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
  it("when the name starts like a known meter, also when padded with NUL characters, it is known", () => {
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
  it("when a name arrives padded with NUL characters, the padding is not shown", () => {
    expect(shownName("UC96_BLE\0\0\0")).toBe("UC96_BLE");
  });

  it("when a device has no name, or nothing but padding, there is no name to show", () => {
    expect([undefined, "", "\0\0"].map(shownName)).toEqual([undefined, undefined, undefined]);
  });
});

describe("exactName", () => {
  it("when the name has characters that do not print, in front or as padding, they are written out", () => {
    expect(["\0UC96_BLE", "BT-METER\0\0", "\u200bUC96"].map(exactName)).toEqual([
      "\\u{0}UC96_BLE",
      "BT-METER\\u{0}\\u{0}",
      "\\u{200b}UC96",
    ]);
  });

  it("when every character prints, spaces and non-Latin letters included, the name stays as it is", () => {
    expect([" UC96_BLE", "BT-METER-01", "電力計"].map(exactName)).toEqual([
      " UC96_BLE",
      "BT-METER-01",
      "電力計",
    ]);
  });
});

describe("connectMeter", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  /** A device whose link request never returns, until the page lets go of it, as in Chrome */
  function silentDevice() {
    let refuse: (reason: unknown) => void = () => {};
    const gatt = {
      connected: false,
      connect: () =>
        new Promise<never>((_, reject) => {
          refuse = reject;
        }),
      disconnect: vi.fn(() =>
        refuse(
          new DOMException("GATT Server disconnected while attempting to connect.", "NetworkError"),
        ),
      ),
    };
    const device = { name: "UC96_BLE", gatt, addEventListener() {}, removeEventListener() {} };
    vi.stubGlobal("navigator", { bluetooth: { requestDevice: async () => device } });
    return gatt;
  }

  it("when the meter never answers the link request, gives up after the time allowed and lets go of it", async () => {
    vi.useFakeTimers();
    const gatt = silentDevice();
    const attempt = connectMeter(
      () => {},
      () => {},
    );
    const outcome = attempt.then(
      () => "connected",
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(CONNECT_TIMEOUT_MS - 1);
    expect(gatt.disconnect).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    const error = await outcome;
    expect(error).toBeInstanceOf(MeterError);
    expect((error as MeterError).code).toBe("timeout");
    expect(gatt.disconnect).toHaveBeenCalledOnce();
  });
});
