import { Buffer } from "buffer";
import BluetoothClassic from "react-native-bluetooth-classic";

import type { LabelTransport } from "../label-transport";

export class BluetoothTransport implements LabelTransport {
  constructor(private readonly deviceAddress: string) {}

  async connect(): Promise<void> {
    const connected = await BluetoothClassic.connectToDevice(
      this.deviceAddress,
    );

    if (!connected) {
      throw new Error("Failed to connect to Bluetooth printer.");
    }
  }

  async disconnect(): Promise<void> {
    await BluetoothClassic.disconnectFromDevice(this.deviceAddress);
  }

  async send(data: Uint8Array): Promise<void> {
    const payload = Buffer.from(data);

    await BluetoothClassic.writeToDevice(this.deviceAddress, payload);
  }
}
