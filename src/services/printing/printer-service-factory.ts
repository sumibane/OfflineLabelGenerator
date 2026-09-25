import type { LabelPrinterService } from "./printer-service";

import { MockLabelPrinter } from "./mock/mock-label-printer";

import { getSelectedPrinter } from "./bluetooth/bluetooth-printer-storage";

import { BluetoothTransport } from "./transports/bluetooth/bluetooth-transport";

import { TsplEncoder } from "./protocols/tspl/tspl-encoder";

import { TscPrinterService } from "./tsc/tsc-printer-service";

export async function getPrinterService(): Promise<LabelPrinterService> {
  const printer = await getSelectedPrinter();

  if (!printer) {
    return new MockLabelPrinter();
  }

  if (printer.connectionType === "bluetooth" && printer.protocol === "tspl") {
    const transport = new BluetoothTransport(printer.address);
    const protocol = new TsplEncoder();

    return new TscPrinterService(protocol, transport);
  }

  throw new Error(
    `Unsupported printer configuration: ${printer.connectionType}/${printer.protocol}`,
  );
}
