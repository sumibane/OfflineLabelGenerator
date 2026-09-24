import type { LabelJob } from "@/models/label-job";
import type { PrintProgress, PrintResult } from "../print-types";
import type { LabelPrinterService } from "../printer-service";
import type { LabelProtocol } from "../protocols/label-protocol";
import type { LabelTransport } from "../transports/label-transport";

export class TscPrinterService implements LabelPrinterService {
  constructor(
    private readonly protocol: LabelProtocol,
    private readonly transport: LabelTransport,
  ) {}

  async print(
    job: LabelJob,
    onProgress?: (progress: PrintProgress) => void,
  ): Promise<PrintResult> {
    try {
      const data = this.protocol.encode(job);

      await this.transport.connect();
      await this.transport.send(data);
      await this.transport.disconnect();

      onProgress?.({
        currentBox: job.boxCount,
        totalBoxes: job.boxCount,
      });

      return {
        status: "completed",
      };
    } catch (error) {
      try {
        await this.transport.disconnect();
      } catch {
        // Ignore disconnect errors after a print failure.
      }

      return {
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
