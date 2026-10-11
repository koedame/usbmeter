// Web Bluetooth glue: pick a meter, subscribe to its notifications, hand the bytes on.
// The meters stream their readings from a serial-over-BLE characteristic (service 0xFFE0,
// characteristic 0xFFE1 on ATorch devices); the other services are tried only to find
// meters that use a different UART service.

const SERVICES: BluetoothServiceUUID[] = [
  0xffe0,
  0xfff0,
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART
];

/** How the Bluetooth name of a known meter starts. A J7-C calls itself UC96_BLE; ATorch meters use the model name, as in UD18-BLE, AT24-BLE or DL24M_BLE. */
const METER_NAME_PREFIXES = ["UC96", "UD18", "UD24", "AT24", "AT3010", "DT24", "DT3010", "DL24"];

/**
 * Narrows the browser's device list to meters. A device is listed when it matches any entry:
 * it advertises the serial service, or its name starts like a known meter (for meters that
 * leave the service out of their advertisement). The browser lists only what it hears while
 * the list is open, so a meter that is off or connected elsewhere is missing whatever its name.
 */
export const METER_FILTERS: BluetoothLEScanFilter[] = [
  { services: [0xffe0] },
  ...METER_NAME_PREFIXES.map((namePrefix) => ({ namePrefix })),
];

/** Whether the name starts like a meter this page knows, the way the narrowed list matches names */
export function knownMeterName(name: string | undefined): boolean {
  return name !== undefined && METER_NAME_PREFIXES.some((prefix) => name.startsWith(prefix));
}

/**
 * A device name fit to show. A J7-C name can arrive padded with NUL characters, which some
 * fonts draw as boxes.
 */
export function shownName(name: string | undefined): string | undefined {
  return name?.replaceAll("\0", "") || undefined;
}

/**
 * A device name exactly as the browser matched it against the list, with every character that
 * does not print written as an escape. A name is matched from its first character, so a hidden
 * one in front keeps a meter out of the narrowed list although the name reads like a known one.
 */
export function exactName(name: string): string {
  return name.replace(/\p{C}/gu, (hidden) => `\\u{${hidden.codePointAt(0)?.toString(16)}}`);
}

export interface MeterConnection {
  /** The meter's Bluetooth name, when it has one */
  name: string | undefined;
  /** The name as the meter sends it (`exactName`), when it has one */
  exactName: string | undefined;
  /** Whether the name starts like a meter this page knows */
  knownName: boolean;
  /** Closes the link and removes every listener. Safe to call more than once. */
  disconnect(): void;
}

export function bluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

/**
 * Opens the browser's device picker and starts streaming. Resolves to undefined when the user
 * closes the picker without choosing a device.
 * The picker lists only meters (`METER_FILTERS`) unless `anyDevice` is set, which is the way
 * in for a meter with a name this page does not know yet.
 * `onLost` runs when the meter drops the link by itself, not after `disconnect()`.
 */
export async function connectMeter(
  onData: (chunk: Uint8Array) => void,
  onLost: () => void,
  anyDevice = false,
): Promise<MeterConnection | undefined> {
  let device: BluetoothDevice;
  try {
    device = await navigator.bluetooth.requestDevice(
      anyDevice
        ? { acceptAllDevices: true, optionalServices: SERVICES }
        : { filters: METER_FILTERS, optionalServices: SERVICES },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError") return undefined;
    throw error;
  }
  let characteristic: BluetoothRemoteGATTCharacteristic | undefined;

  const handleValue = () => {
    const value = characteristic?.value;
    if (value) onData(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
  };
  const close = () => {
    device.removeEventListener("gattserverdisconnected", handleLost);
    characteristic?.removeEventListener("characteristicvaluechanged", handleValue);
    if (device.gatt?.connected) device.gatt.disconnect();
  };
  const handleLost = () => {
    close();
    onLost();
  };

  device.addEventListener("gattserverdisconnected", handleLost);
  try {
    const server = await device.gatt?.connect();
    if (!server) throw new Error("This device does not offer a GATT connection.");
    characteristic = await findNotifyCharacteristic(server);
    characteristic.addEventListener("characteristicvaluechanged", handleValue);
    await characteristic.startNotifications();
  } catch (error) {
    close(); // the meter accepts one connection at a time, so do not hold it after a failure
    throw error;
  }
  return {
    name: shownName(device.name),
    exactName: device.name === undefined ? undefined : exactName(device.name),
    knownName: knownMeterName(device.name),
    disconnect: close,
  };
}

async function findNotifyCharacteristic(
  server: BluetoothRemoteGATTServer,
): Promise<BluetoothRemoteGATTCharacteristic> {
  for (const uuid of SERVICES) {
    let characteristics: BluetoothRemoteGATTCharacteristic[];
    try {
      const service = await server.getPrimaryService(uuid);
      characteristics = await service.getCharacteristics();
    } catch (error) {
      // not this service, or a service without characteristics
      if (error instanceof DOMException && error.name === "NotFoundError") continue;
      throw error;
    }
    const notifying = characteristics.filter((c) => c.properties.notify);
    const preferred = notifying.find((c) => c.uuid.startsWith("0000ffe1"));
    const found = preferred ?? notifying[0];
    if (found) return found;
  }
  throw new Error(
    "This device has no serial-over-Bluetooth service (0xFFE0) that streams readings. It may not be a supported meter.",
  );
}
