import { describe, expect, it } from "vitest";
import { checksumOf, encodeReport, FrameStream, hexToBytes, parseReport } from "./protocol.ts";

// Frames recorded from a J7-C and posted with the on-screen values in the Arduino forum thread
// "USB Digital Tester (BT) Protocol", January 2022:
// https://forum.arduino.cc/t/usb-digital-tester-bt-protocol/943891
// The screen showed 4.73 V, 1.07 A, 776 mAh, 3.67 Wh, 00:44:16, 31 °C for the fourth frame.
const J7C_FRAMES = [
  "FF5501030001D900006C0003070000016E004B004B001F00002C0D3C0DAC012C032000" + "7C",
  "FF5501030001D900006A0003070000016E004A004B001F00002C0E3C0DAC012C032000" + "E7",
  "FF5501030001D900006A0003080000016E004B004B001E00002C0F3C0DAC012C032000" + "54",
  "FF5501030001D900006B0003080000016F004B004B001F00002C103C0DAC012C032000" + "C5",
];
// A notebook charger negotiating 19.8 V (the same device, second recording).
const J7C_FAST_CHARGE =
  "FF5501030007BC000048000031000000310009000900" + "1E00002436" + "3C0DAC012C032000" + "01";

// Packets of an ATorch UD18 (USB), an AC meter and a DC meter, and the command and reply frames
// further down, are the sample packets of the atorch-console test suite
// (https://github.com/CursedHardware/atorch-console, MIT License, Copyright 2020 NiceLabs).
const UD18_IDLE = "FF5501030001F3000000000638000003110007000A000000122E333C000000000000004E";
const UD18_LOAD = "FF5501030001CD00007F003CC80000554E0009000A00000047300D3C000000000000008F";
const AC_IDLE = "FF55010100090400000E0000040000000000006401F40085002F00000A093C0000000039";
const DC_IDLE = "FF55010200011A00003C0004D40000002000006400000000002600590D363C00000000F0";

describe("parseReport", () => {
  it("when the frame is a UD18 USB report, reads voltage, capacity, energy, data lines and time", () => {
    const reading = parseReport(hexToBytes(UD18_IDLE));
    expect(reading).toMatchObject({
      kind: "usb",
      voltage: 4.99,
      current: 0,
      capacityAh: 1.592,
      energyWh: 7.85,
      dMinus: 0.07,
      dPlus: 0.1,
      temperatureC: 0,
      durationSec: 18 * 3600 + 46 * 60 + 51,
      backlightSec: 60,
      checksumOk: true,
    });
  });

  it("when a load is connected, the current is in 10 mA steps and the power is voltage times current", () => {
    const reading = parseReport(hexToBytes(UD18_LOAD));
    expect(reading?.current).toBe(1.27);
    expect(reading?.power).toBeCloseTo(5.855, 3);
  });

  it("when the frame comes from a J7-C, matches the values on its screen", () => {
    const reading = parseReport(hexToBytes(J7C_FRAMES[3] ?? ""));
    expect(reading).toMatchObject({
      kind: "usb",
      voltage: 4.73,
      current: 1.07,
      capacityAh: 0.776,
      energyWh: 3.67,
      dMinus: 0.75,
      dPlus: 0.75,
      temperatureC: 31,
      durationSec: 44 * 60 + 16,
    });
    expect(reading?.power).toBeCloseTo(5.061, 3);
  });

  it("when the frame comes from a J7-C, accepts it although its checksum is not the ATorch one", () => {
    for (const hex of J7C_FRAMES) expect(parseReport(hexToBytes(hex))?.checksumOk).toBe(false);
  });

  it("when a J7-C negotiates fast charge, reads 19.8 V", () => {
    expect(parseReport(hexToBytes(J7C_FAST_CHARGE))?.voltage).toBe(19.8);
  });

  it("when the frame is an AC meter report, reads mains voltage, frequency and power factor", () => {
    const reading = parseReport(hexToBytes(AC_IDLE));
    expect(reading).toMatchObject({
      kind: "ac",
      voltage: 230.8,
      current: 0.014,
      power: 0.4,
      frequencyHz: 50,
      powerFactor: 0.133,
      temperatureC: 47,
      durationSec: 10 * 60 + 9,
      pricePerKwh: 1,
      checksumOk: true,
    });
  });

  it("when the frame is a DC meter report, reads voltage, current and time, and leaves the unconfirmed energy out", () => {
    const reading = parseReport(hexToBytes(DC_IDLE));
    expect(reading).toMatchObject({
      kind: "dc",
      voltage: 28.2,
      current: 0.06,
      temperatureC: 38,
      durationSec: 89 * 3600 + 13 * 60 + 54,
      checksumOk: true,
    });
    expect(reading?.energyWh).toBeUndefined();
  });

  it("when the frame is a reply or has a wrong length, returns nothing", () => {
    expect(parseReport(hexToBytes("FF55020101000040"))).toBeUndefined();
    expect(parseReport(hexToBytes(UD18_IDLE.slice(0, 70)))).toBeUndefined();
  });

  it("when the device type is unknown, returns nothing", () => {
    expect(parseReport(hexToBytes(UD18_IDLE.replace("FF55010300", "FF55010900")))).toBeUndefined();
  });
});

describe("checksumOf", () => {
  it("when the frame is a command, gives the byte the meter sends", () => {
    expect(checksumOf(hexToBytes("FF551103330000000003"))).toBe(0x03);
    expect(checksumOf(hexToBytes("FF551101050000000053"))).toBe(0x53);
  });
});

describe("FrameStream", () => {
  const bytes = hexToBytes(UD18_IDLE);

  it("when a report arrives in two notifications, returns it once the second one is in", () => {
    const stream = new FrameStream();
    expect(stream.push(bytes.slice(0, 20))).toEqual([]);
    expect(stream.push(bytes.slice(20))).toEqual([bytes]);
  });

  it("when the first chunk starts in the middle of a frame, skips to the next header", () => {
    const stream = new FrameStream();
    const frames = stream.push(Uint8Array.from([0x12, 0x34, ...bytes, ...bytes.slice(0, 5)]));
    expect(frames).toEqual([bytes]);
    expect(stream.push(bytes.slice(5))).toEqual([bytes]);
  });

  it("when a reply sits between two reports, returns all three frames in order", () => {
    const reply = hexToBytes("FF55020101000040");
    const stream = new FrameStream();
    expect(stream.push(Uint8Array.from([...bytes, ...reply, ...bytes]))).toEqual([
      bytes,
      reply,
      bytes,
    ]);
  });

  it("when the header is split between two notifications, still finds it", () => {
    const stream = new FrameStream();
    expect(stream.push(Uint8Array.from([0x00, 0xff]))).toEqual([]);
    expect(stream.push(bytes)).toEqual([bytes]);
  });

  it("when a header is followed by an unknown type, drops it and keeps looking", () => {
    const stream = new FrameStream();
    expect(stream.push(Uint8Array.from([0xff, 0x55, 0x77, ...bytes]))).toEqual([bytes]);
  });
});

describe("encodeReport", () => {
  it("when a UD18 report is decoded and encoded again, gives the same bytes", () => {
    for (const hex of [UD18_IDLE, UD18_LOAD, AC_IDLE]) {
      const reading = parseReport(hexToBytes(hex));
      expect(reading).toBeDefined();
      if (reading) expect(encodeReport(reading)).toEqual(hexToBytes(hex));
    }
  });
});

describe("FrameStream after a lost notification", () => {
  const frame = hexToBytes(UD18_IDLE);

  it("when the second half of a report is lost, drops the stump and returns the next whole report", () => {
    const stream = new FrameStream();
    expect(stream.push(frame.slice(0, 20))).toEqual([]);
    expect(stream.push(frame)).toEqual([frame]);
  });
});
