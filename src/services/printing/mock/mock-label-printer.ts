import type { LabelJob } from "@/models/label-job";
import type { PrintProgress, PrintResult } from "../print-types";
import type { LabelPrinterService } from "../printer-service";

export class MockLabelPrinter implements LabelPrinterService {
  async print(
    job: LabelJob,
    onProgress?: (progress: PrintProgress) => void,
  ): Promise<PrintResult> {
    console.log("=== MOCK PRINT START ===");
    console.log("Docket Number:", job.docketNumber);
    console.log("Location:", job.locationText);
    console.log("Total Boxes:", job.boxCount);

    for (let boxNumber = 1; boxNumber <= job.boxCount; boxNumber += 1) {
      console.log(`Printing box ${boxNumber}/${job.boxCount}`);

      onProgress?.({
        currentBox: boxNumber,
        totalBoxes: job.boxCount,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
    }

    console.log("=== MOCK PRINT COMPLETE ===");

    return {
      status: "completed",
    };
  }
}
