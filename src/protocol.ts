// Wire format of the Bluetooth USB / DC / AC meters that stream "FF 55" frames
// (ATorch UD18, AT24, AC18 ... and look-alikes such as the J7-C).
//
// Every frame is: FF 55 <type> <payload...> <checksum>
//   type 0x01  report   36 bytes   (device type, then readings)
//   type 0x02  reply     8 bytes
//   type 0x11  command  10 bytes
//
// The layout follows the community reverse-engineering notes
// (https://github.com/syssi/esphome-atorch-dl24/blob/main/docs/protocol-design.md) and was
// checked against the packets in the test file.

export type MeterKind = "usb" | "dc" | "ac";

export interface Reading {
  kind: MeterKind;
  voltage: number; // V
  current: number; // A
  power: number; // W
  energyWh?: number; // Wh (not available on DC meters, see parseReport)
  temperatureC: number;
  durationSec: number;
  backlightSec: number;
  /** false for meters that use another checksum (the J7-C does) */
  checksumOk: boolean;
  capacityAh?: number; // USB meters
  dMinus?: number; // V, USB meters
  dPlus?: number; // V, USB meters
  frequencyHz?: number; // AC meters
  powerFactor?: number; // AC meters
  pricePerKwh?: number; // AC / DC meters
}

export const REPORT_LENGTH = 36;
const FRAME_LENGTH: Record<number, number> = { 1: REPORT_LENGTH, 2: 8, 17: 10 };
const DEVICE_KIND: Record<number, MeterKind> = { 1: "ac", 2: "dc", 3: "usb" };
const DEVICE_TYPE: Record<MeterKind, number> = { ac: 0x01, dc: 0x02, usb: 0x03 };

/** Checksum of a whole frame: the sum of everything between the header and the checksum, xor 0x44 */
export function checksumOf(frame: Uint8Array): number {
  let sum = 0;
  for (let i = 2; i < frame.length - 1; i++) sum += frame[i] ?? 0;
  return (sum & 0xff) ^ 0x44;
}

function be(frame: Uint8Array, offset: number, size: number): number {
  let value = 0;
  for (let i = 0; i < size; i++) value = value * 256 + (frame[offset + i] ?? 0);
  return value;
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

/** Reads one complete frame. Returns undefined for anything that is not a meter report. */
export function parseReport(frame: Uint8Array): Reading | undefined {
  if (frame.length !== REPORT_LENGTH || frame[0] !== 0xff || frame[1] !== 0x55) return undefined;
  if (frame[2] !== 0x01) return undefined;
  const kind = DEVICE_KIND[frame[3] ?? 0];
  if (kind === undefined) return undefined;

  const checksumOk = checksumOf(frame) === frame[REPORT_LENGTH - 1];
  const voltage = be(frame, 4, 3) / (kind === "usb" ? 100 : 10);
  const current = be(frame, 7, 3) / (kind === "usb" ? 100 : 1000);

  if (kind === "usb") {
    return {
      kind,
      voltage,
      current,
      power: round(voltage * current, 3),
      capacityAh: be(frame, 10, 3) / 1000,
      energyWh: be(frame, 13, 4) / 100,
      dMinus: be(frame, 17, 2) / 100,
      dPlus: be(frame, 19, 2) / 100,
      temperatureC: be(frame, 21, 2),
      durationSec: be(frame, 23, 2) * 3600 + be(frame, 25, 1) * 60 + be(frame, 26, 1),
      backlightSec: be(frame, 27, 1),
      checksumOk,
    };
  }

  const timeAndBacklight = {
    temperatureC: be(frame, 24, 2),
    durationSec: be(frame, 26, 2) * 3600 + be(frame, 28, 1) * 60 + be(frame, 29, 1),
    backlightSec: be(frame, 30, 1),
    checksumOk,
  };

  if (kind === "ac") {
    return {
      kind,
      voltage,
      current,
      power: be(frame, 10, 3) / 10,
      energyWh: be(frame, 13, 4) * 10, // the counter is in units of 0.01 kWh
      pricePerKwh: be(frame, 17, 3) / 100,
      frequencyHz: be(frame, 20, 2) / 10,
      powerFactor: be(frame, 22, 2) / 1000,
      ...timeAndBacklight,
    };
  }

  // DC meters: the capacity and energy counters are not decoded, because the published
  // layouts disagree and none was confirmed on a device. Better no number than a wrong one.
  return {
    kind,
    voltage,
    current,
    power: round(voltage * current, 3),
    pricePerKwh: be(frame, 17, 3) / 100,
    ...timeAndBacklight,
  };
}

/**
 * Cuts a stream of notification chunks into frames. A 36-byte report arrives in two
 * notifications when the connection uses the default 23-byte MTU, and a chunk may also
 * start in the middle of a frame, so bytes are buffered until a whole frame is there.
 */
export class FrameStream {
  private buffer: number[] = [];

  push(chunk: Uint8Array): Uint8Array[] {
    this.buffer.push(...chunk);
    const frames: Uint8Array[] = [];
    for (;;) {
      const start = this.findHeader();
      if (start < 0) {
        this.buffer = this.buffer.slice(-1); // the last byte may be the 0xFF of the next header
        break;
      }
      this.buffer = this.buffer.slice(start);
      if (this.buffer.length < 3) break;
      const length = FRAME_LENGTH[this.buffer[2] ?? 0];
      if (length === undefined) {
        this.buffer = this.buffer.slice(1);
        continue;
      }
      if (this.buffer.length < length) break;
      const inner = this.findHeader(1, length);
      if (inner > 0) {
        this.buffer = this.buffer.slice(inner); // a notification was lost: this frame is cut short
        continue;
      }
      frames.push(Uint8Array.from(this.buffer.slice(0, length)));
      this.buffer = this.buffer.slice(length);
    }
    return frames;
  }

  private findHeader(from = 0, to = this.buffer.length): number {
    for (let i = from; i + 1 < to; i++) {
      if (this.buffer[i] === 0xff && this.buffer[i + 1] === 0x55) return i;
    }
    return -1;
  }
}

/** Builds a report frame with a valid checksum. Used by the demo mode and the tests. */
export function encodeReport(reading: Reading): Uint8Array {
  const frame = new Uint8Array(REPORT_LENGTH);
  const put = (offset: number, size: number, value: number) => {
    let rest = Math.round(value);
    for (let i = size - 1; i >= 0; i--) {
      frame[offset + i] = rest % 256;
      rest = Math.floor(rest / 256);
    }
  };
  frame[0] = 0xff;
  frame[1] = 0x55;
  frame[2] = 0x01;
  frame[3] = DEVICE_TYPE[reading.kind];

  const hours = Math.floor(reading.durationSec / 3600);
  const minutes = Math.floor(reading.durationSec / 60) % 60;
  const seconds = reading.durationSec % 60;

  if (reading.kind === "usb") {
    put(4, 3, reading.voltage * 100);
    put(7, 3, reading.current * 100);
    put(10, 3, (reading.capacityAh ?? 0) * 1000);
    put(13, 4, (reading.energyWh ?? 0) * 100);
    put(17, 2, (reading.dMinus ?? 0) * 100);
    put(19, 2, (reading.dPlus ?? 0) * 100);
    put(21, 2, reading.temperatureC);
    put(23, 2, hours);
    put(25, 1, minutes);
    put(26, 1, seconds);
    put(27, 1, reading.backlightSec);
  } else {
    put(4, 3, reading.voltage * 10);
    put(7, 3, reading.current * 1000);
    if (reading.kind === "ac") {
      put(10, 3, reading.power * 10);
      put(13, 4, (reading.energyWh ?? 0) / 10);
      put(20, 2, (reading.frequencyHz ?? 0) * 10);
      put(22, 2, (reading.powerFactor ?? 0) * 1000);
    }
    put(17, 3, (reading.pricePerKwh ?? 0) * 100);
    put(24, 2, reading.temperatureC);
    put(26, 2, hours);
    put(28, 1, minutes);
    put(29, 1, seconds);
    put(30, 1, reading.backlightSec);
  }
  frame[REPORT_LENGTH - 1] = checksumOf(frame);
  return frame;
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++)
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}
