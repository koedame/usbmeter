// Web Bluetooth glue: pick a meter, subscribe to its notifications, hand the bytes on.
// The meters stream their readings from a serial-over-BLE characteristic (service 0xFFE0,
// characteristic 0xFFE1 on ATorch devices); the other services are tried only to find
// meters that use a different UART service.

const SERVICES: BluetoothServiceUUID[] = [
  0xffe0,
  0xfff0,
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART
];

export interface MeterConnection {
  name: string;
  /** Closes the link and removes every listener. Safe to call more than once. */
  disconnect(): void;
}

export function bluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

/**
 * Opens the browser's device picker and starts streaming. Rejects when the user cancels.
 * `onLost` runs when the meter drops the link by itself, not after `disconnect()`.
 */
export async function connectMeter(
  onData: (chunk: Uint8Array) => void,
  onLost: () => void,
): Promise<MeterConnection> {
  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: SERVICES,
  });
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
  return { name: device.name ?? "Unnamed meter", disconnect: close };
}

async function findNotifyCharacteristic(
  server: BluetoothRemoteGATTServer,
): Promise<BluetoothRemoteGATTCharacteristic> {
  for (const uuid of SERVICES) {
    let service: BluetoothRemoteGATTService;
    try {
      service = await server.getPrimaryService(uuid);
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotFoundError") continue; // not this service
      throw error;
    }
    const characteristics = await service.getCharacteristics();
    const notifying = characteristics.filter((c) => c.properties.notify);
    const preferred = notifying.find((c) => c.uuid.startsWith("0000ffe1"));
    const found = preferred ?? notifying[0];
    if (found) return found;
  }
  throw new Error(
    "This device has no serial-over-Bluetooth service (0xFFE0) that streams readings. It may not be a supported meter.",
  );
}
