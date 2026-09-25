import type { LabelPrinterService } from "./printer-service";

import { MockLabelPrinter } from "./mock/mock-label-printer";

export async function getPrinterService(): Promise<LabelPrinterService> {
  return new MockLabelPrinter();
}
