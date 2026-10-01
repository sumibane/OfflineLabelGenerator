import { Buffer } from "buffer";
import BluetoothClassic from "react-native-bluetooth-classic";

import type { LabelJob } from "@/models/label-job";
import { getSelectedPrinter } from "../bluetooth/bluetooth-printer-storage";
import type { PrintProgress, PrintResult } from "../print-types";
import type { LabelPrinterService } from "../printer-service";
import {
    RUDRAX_LOGO_BITMAP,
    RUDRAX_LOGO_HEIGHT,
    RUDRAX_LOGO_WIDTH_BYTES,
} from "./tsc-image";

function escapeTsplText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, " ");
}

function buildTestLabel(job: LabelJob, boxNumber: number): Buffer {
  const docket = escapeTsplText(job.docketNumber);
  const location = escapeTsplText(job.locationText);
  const box = `${boxNumber}/${job.boxCount}`;

  const header =
    [
      "SIZE 70mm,70mm",
      "GAP 2,0",
      "CLS",

      // Rudrax logo: 10 mm from the left, 5 mm from the top.
      `BITMAP 80,40,${RUDRAX_LOGO_WIDTH_BYTES},${RUDRAX_LOGO_HEIGHT},0,`,
    ].join("\r\n") + "\r\n";

  const footer = [
    "",
    // Docket Number
    `TEXT 80,210,"3",0,2,2,"Docket: ${docket}"`,

    // Location
    `TEXT 80,310,"3",0,2,2,"Location:"`,
    `TEXT 80,355,"3",0,2,2,"${location}"`,

    // Box Number
    `TEXT 80,470,"3",0,2,2,"BOX ${box}"`,

    "PRINT 1",
    "",
  ].join("\r\n");

  return Buffer.concat([
    Buffer.from(header, "utf8"),
    RUDRAX_LOGO_BITMAP,
    Buffer.from(footer, "utf8"),
  ]);
}

async function writeInChunks(
  device: Awaited<ReturnType<typeof BluetoothClassic.connectToDevice>>,
  data: Buffer,
): Promise<void> {
  const CHUNK_SIZE = 128;

  for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
    const chunk = data.subarray(
      offset,
      Math.min(offset + CHUNK_SIZE, data.length),
    );
    await device.write(Buffer.from(chunk));

    if (offset + CHUNK_SIZE < data.length) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

export class TscLabelPrinter implements LabelPrinterService {
  async print(
    job: LabelJob,
    onProgress?: (progress: PrintProgress) => void,
  ): Promise<PrintResult> {
    const printer = await getSelectedPrinter();

    if (!printer) {
      return {
        status: "failed",
        error: "No printer selected.",
      };
    }

    if (printer.protocol !== "tspl") {
      return {
        status: "failed",
        error: `Unsupported printer protocol: ${printer.protocol}`,
      };
    }

    let device;

    try {
      console.log("=== TSC PRINT START ===");
      console.log("Printer:", printer.name);
      console.log("Address:", printer.address);

      device = await BluetoothClassic.connectToDevice(printer.address);

      if (!device) {
        throw new Error("Unable to connect to the TSC printer.");
      }

      for (let boxNumber = 1; boxNumber <= job.boxCount; boxNumber += 1) {
        const tspl = buildTestLabel(job, boxNumber);

        console.log(`Sending TSPL for box ${boxNumber}/${job.boxCount}`);
        console.log("TSPL bytes:", tspl.length);
        console.log("Logo bytes:", RUDRAX_LOGO_BITMAP.length);

        await writeInChunks(device, tspl);

        onProgress?.({
          currentBox: boxNumber,
          totalBoxes: job.boxCount,
        });

        if (boxNumber < job.boxCount) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }

      console.log("=== TSC PRINT COMPLETE ===");

      return {
        status: "completed",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.error("TSC printing failed:", error);

      return {
        status: "failed",
        error: message,
      };
    } finally {
      try {
        if (device) {
          await device.disconnect();
        }
      } catch (disconnectError) {
        console.warn("Bluetooth disconnect failed:", disconnectError);
      }
    }
  }
}
