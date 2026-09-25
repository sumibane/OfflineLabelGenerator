import { PermissionsAndroid, Platform } from "react-native";
import BluetoothClassic from "react-native-bluetooth-classic";

export type BluetoothPrinter = {
  address: string;
  name: string;
};

async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true;
  }

  if (Platform.Version >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    ]);

    return (
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
        PermissionsAndroid.RESULTS.GRANTED
    );
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function ensureBluetoothEnabled(): Promise<boolean> {
  const permissionsGranted = await requestBluetoothPermissions();

  if (!permissionsGranted) {
    return false;
  }

  const enabled = await BluetoothClassic.isBluetoothEnabled();

  if (enabled) {
    return true;
  }

  return BluetoothClassic.requestBluetoothEnabled();
}

export async function getPairedPrinters(): Promise<BluetoothPrinter[]> {
  const devices = await BluetoothClassic.getBondedDevices();

  return devices.map((device) => ({
    address: device.address,
    name: device.name?.trim() || "Unnamed Bluetooth Device",
  }));
}

export async function discoverPrinters(): Promise<BluetoothPrinter[]> {
  const devices = await BluetoothClassic.startDiscovery();

  const uniqueDevices = new Map<string, BluetoothPrinter>();

  for (const device of devices) {
    uniqueDevices.set(device.address, {
      address: device.address,
      name: device.name?.trim() || "Unnamed Bluetooth Device",
    });
  }

  return Array.from(uniqueDevices.values());
}

export async function pairPrinter(address: string): Promise<BluetoothPrinter> {
  const device = await BluetoothClassic.pairDevice(address);

  return {
    address: device.address,
    name: device.name?.trim() || "Unnamed Bluetooth Device",
  };
}
