import { getSelectedPrinter } from "./bluetooth/bluetooth-printer-storage";
import { MockLabelPrinter } from "./mock/mock-label-printer";
import type { LabelPrinterService } from "./printer-service";
import { TsplEncoder } from "./protocols/tspl/tspl-encoder";
import { BluetoothTransport } from "./transports/bluetooth/bluetooth-transport";
import { TscPrinterService } from "./tsc/tsc-printer-service";

export async function getPrinterService(): Promise<LabelPrinterService> {
  const selectedPrinter = await getSelectedPrinter();

  if (!selectedPrinter) {
    return new MockLabelPrinter();
  }

  const transport = new BluetoothTransport(selectedPrinter.address);

  const protocol = new TsplEncoder();

  return new TscPrinterService(protocol, transport);
}
