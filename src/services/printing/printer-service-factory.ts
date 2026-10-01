import type { LabelPrinterService } from "./printer-service";
import { TscLabelPrinter } from "./tsc/tsc-label-printer";

export async function getPrinterService(): Promise<LabelPrinterService> {
  return new TscLabelPrinter();
}
