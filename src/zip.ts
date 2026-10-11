// A ZIP archive with the files stored as they are (no compression). Enough to hand a few text
// files over as one download; a recording at the sample limit is about 10 MB of CSV.
// Layout: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT (4.3.7, 4.3.12, 4.3.16)

export interface ZipFile {
  /** Path inside the archive, with "/" between folders */
  name: string;
  data: Uint8Array;
}

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? (value >>> 1) ^ 0xedb88320 : value >>> 1;
  return value;
});

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = (crc >>> 8) ^ (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0);
  return (crc ^ 0xffffffff) >>> 0;
}

const VERSION = 20; // ZIP 2.0, the version common tools write for plain files in folders
const UTF8_NAMES = 0x0800;

/** Packs the files into one archive. `modified` is the timestamp every file gets. */
export function zip(files: ZipFile[], modified = new Date()): Uint8Array<ArrayBuffer> {
  const time =
    (modified.getHours() << 11) | (modified.getMinutes() << 5) | (modified.getSeconds() >> 1);
  const date =
    ((modified.getFullYear() - 1980) << 9) | ((modified.getMonth() + 1) << 5) | modified.getDate();
  const entries = files.map(({ name, data }) => ({
    name: new TextEncoder().encode(name),
    data,
    crc: crc32(data),
  }));
  const namesLength = entries.reduce((sum, entry) => sum + entry.name.length, 0);
  const dataLength = entries.reduce((sum, entry) => sum + entry.data.length, 0);
  const directoryLength = 46 * entries.length + namesLength;
  const directoryStart = 30 * entries.length + namesLength + dataLength;
  const archive = new Uint8Array(directoryStart + directoryLength + 22);
  const view = new DataView(archive.buffer);

  // what the local header and the directory entry of a file have in common, from "version needed" on
  const describe = (at: number, entry: (typeof entries)[number]): void => {
    view.setUint16(at, VERSION, true);
    view.setUint16(at + 2, UTF8_NAMES, true);
    view.setUint16(at + 4, 0, true); // stored
    view.setUint16(at + 6, time, true);
    view.setUint16(at + 8, date, true);
    view.setUint32(at + 10, entry.crc, true);
    view.setUint32(at + 14, entry.data.length, true); // size in the archive
    view.setUint32(at + 18, entry.data.length, true); // size unpacked
    view.setUint16(at + 22, entry.name.length, true);
  };

  let fileAt = 0;
  let entryAt = directoryStart;
  for (const entry of entries) {
    view.setUint32(fileAt, 0x04034b50, true);
    describe(fileAt + 4, entry);
    archive.set(entry.name, fileAt + 30);
    archive.set(entry.data, fileAt + 30 + entry.name.length);

    view.setUint32(entryAt, 0x02014b50, true);
    view.setUint16(entryAt + 4, VERSION, true); // made by
    describe(entryAt + 6, entry);
    view.setUint32(entryAt + 42, fileAt, true);
    archive.set(entry.name, entryAt + 46);

    fileAt += 30 + entry.name.length + entry.data.length;
    entryAt += 46 + entry.name.length;
  }

  view.setUint32(entryAt, 0x06054b50, true);
  view.setUint16(entryAt + 8, entries.length, true); // entries on this disk
  view.setUint16(entryAt + 10, entries.length, true); // entries in total
  view.setUint32(entryAt + 12, directoryLength, true);
  view.setUint32(entryAt + 16, directoryStart, true);
  return archive;
}
