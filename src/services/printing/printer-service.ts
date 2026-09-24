import type { LabelJob } from "@/models/label-job";
import type { PrintProgress, PrintResult } from "./print-types";

export interface LabelPrinterService {
  print(
    job: LabelJob,
    onProgress?: (progress: PrintProgress) => void,
  ): Promise<PrintResult>;
}
