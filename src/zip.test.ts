import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { zip } from "./zip.ts";

const text = (value: string) => new TextEncoder().encode(value);

/** The archive as another implementation reads it: { name: text } */
function read(archive: Uint8Array): Record<string, string> {
  return Object.fromEntries(
    Object.entries(unzipSync(archive)).map(([name, data]) => [name, strFromU8(data)]),
  );
}

describe("zip", () => {
  it("when files are packed, another zip reader gets the same names and contents back", () => {
    const archive = zip([
      { name: "README.md", data: text("# Recording\n") },
      { name: "readings.csv", data: text("time,voltage_v\n2026-01-01T00:00:00.000Z,5.1\n") },
    ]);
    expect(read(archive)).toEqual({
      "README.md": "# Recording\n",
      "readings.csv": "time,voltage_v\n2026-01-01T00:00:00.000Z,5.1\n",
    });
  });

  it("when a file sits in a folder or has a name outside ASCII, the reader sees that path", () => {
    const archive = zip([
      { name: "usbmeter-analysis/SKILL.md", data: text("skill") },
      { name: "測定.csv", data: text("5 V → 9 V") },
    ]);
    expect(read(archive)).toEqual({
      "usbmeter-analysis/SKILL.md": "skill",
      "測定.csv": "5 V → 9 V",
    });
  });

  it("when a file is empty or large, its contents survive", () => {
    const large = "0123456789abcdef".repeat(70_000); // over 1 MB, past any 16-bit size
    const archive = zip([
      { name: "empty.txt", data: new Uint8Array() },
      { name: "large.csv", data: text(large) },
    ]);
    const files = read(archive);
    expect(files["empty.txt"]).toBe("");
    expect(files["large.csv"]).toBe(large);
  });

  it("when a file is packed, the checksum stored with it is the CRC-32 that strict readers verify", () => {
    const archive = zip([{ name: "check.txt", data: text("123456789") }]);
    // 0xCBF43926 is the published CRC-32 check value for "123456789"
    expect(entries(archive)[0]?.central.crc).toBe(0xcbf43926);
  });

  it("when the archive is read header by header, the directory and each file's own header agree with the data", () => {
    const files = [
      { name: "README.md", data: text("# Recording\n") },
      { name: "usbmeter-analysis/SKILL.md", data: text("skill") },
      { name: "empty.txt", data: new Uint8Array() },
    ];
    const archive = zip(files);
    const read = entries(archive);
    expect(read.map((entry) => entry.name)).toEqual(files.map((file) => file.name));
    for (const [i, entry] of read.entries()) {
      // a strict reader rejects an archive whose two copies of a field differ
      expect(entry.local).toEqual(entry.central);
      expect(entry.localName).toBe(entry.name);
      expect(entry.central.size).toBe(files[i]?.data.length);
      expect(entry.central.packedSize).toBe(files[i]?.data.length);
      expect(entry.central.method).toBe(0);
      expect(entry.central.crc).toBe(crcOf(files[i]?.data ?? new Uint8Array()));
      expect(entry.data).toEqual(files[i]?.data);
    }
  });

  it("when a time is given, every file carries it as its modification time", () => {
    const archive = zip(
      [
        { name: "a.txt", data: text("a") },
        { name: "b.txt", data: text("b") },
      ],
      new Date(2026, 9, 12, 21, 40, 58), // local time, which is what a ZIP stores
    );
    for (const entry of entries(archive))
      expect(entry.central.modified).toEqual([2026, 10, 12, 21, 40, 58]);
  });
});

/** CRC-32 written out independently of src/zip.ts (bit by bit, no table) */
function crcOf(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Walks an archive the way the format describes it (APPNOTE 4.3.7, 4.3.12, 4.3.16): the end
 * record points to the directory, each directory entry to a file header, the data follows.
 * Throws on a wrong signature. Returns both copies of every field, so a test can compare them.
 */
function entries(archive: Uint8Array) {
  const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
  const signature = (at: number, wanted: number) => {
    if (view.getUint32(at, true) !== wanted) throw new Error(`no ${wanted.toString(16)} at ${at}`);
  };
  /** The fields a file header and a directory entry share, from "version needed" on */
  const fields = (at: number) => {
    const time = view.getUint16(at + 6, true);
    const date = view.getUint16(at + 8, true);
    return {
      versionNeeded: view.getUint16(at, true),
      flags: view.getUint16(at + 2, true),
      method: view.getUint16(at + 4, true),
      modified: [
        (date >> 9) + 1980,
        (date >> 5) & 15,
        date & 31,
        time >> 11,
        (time >> 5) & 63,
        (time & 31) * 2,
      ],
      crc: view.getUint32(at + 10, true),
      packedSize: view.getUint32(at + 14, true),
      size: view.getUint32(at + 18, true),
      nameLength: view.getUint16(at + 22, true),
      extraLength: view.getUint16(at + 24, true),
    };
  };
  const name = (at: number, length: number) =>
    new TextDecoder("utf-8", { fatal: true }).decode(archive.subarray(at, at + length));

  const end = archive.length - 22;
  signature(end, 0x06054b50);
  const count = view.getUint16(end + 10, true);
  if (view.getUint16(end + 8, true) !== count) throw new Error("entry counts differ");
  let at = view.getUint32(end + 16, true);
  if (at + view.getUint32(end + 12, true) !== end)
    throw new Error("the directory does not end at the end record");
  const read = [];
  for (let i = 0; i < count; i++) {
    signature(at, 0x02014b50);
    const central = fields(at + 6);
    const fileAt = view.getUint32(at + 42, true);
    signature(fileAt, 0x04034b50);
    const local = fields(fileAt + 4);
    const dataAt = fileAt + 30 + local.nameLength + local.extraLength;
    read.push({
      name: name(at + 46, central.nameLength),
      localName: name(fileAt + 30, local.nameLength),
      central,
      local,
      data: archive.slice(dataAt, dataAt + local.packedSize),
    });
    at += 46 + central.nameLength + central.extraLength + view.getUint16(at + 32, true);
  }
  if (at !== end) throw new Error("the directory holds more than its entries");
  return read;
}
