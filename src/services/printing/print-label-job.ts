import { updateLabelJobStatus } from "@/database/database";
import type { LabelJob } from "@/models/label-job";
import { getPrinterService } from "@/services/printing/printer-service-factory";

export type PrintLabelResult =
  | {
      status: "completed";
      error?: undefined;
    }
  | {
      status: "failed";
      error: string;
    }
  | {
      status: "cancelled";
      error?: undefined;
    };

export const getUserFriendlyPrintError = (error: string): string => {
  const normalizedError = error.toLowerCase();

  if (
    normalizedError.includes("connectionfailedexception") ||
    normalizedError.includes("socket might closed") ||
    normalizedError.includes("read failed") ||
    normalizedError.includes("timeout")
  ) {
    return "Unable to connect to the printer. Please make sure the printer is powered on, nearby, and connected.";
  }

  if (
    normalizedError.includes("bluetooth") ||
    normalizedError.includes("bluetoothadapter")
  ) {
    return "There was a problem with the Bluetooth connection. Please check that Bluetooth is enabled and the printer is connected.";
  }

  if (
    normalizedError.includes("printer") &&
    normalizedError.includes("connect")
  ) {
    return "Unable to connect to the printer. Please check the printer connection and try again.";
  }

  return "The labels could not be printed. Please check the printer and try again.";
};

export const printLabelJob = async (
  job: LabelJob,
  onProgress?: (currentBox: number, totalBoxes: number) => void,
): Promise<PrintLabelResult> => {
  try {
    const printer = await getPrinterService();

    const result = await printer.print(job, (progress) => {
      onProgress?.(progress.currentBox, job.boxCount);
    });

    if (result.status === "completed") {
      await updateLabelJobStatus(job.id, "Completed");

      return {
        status: "completed",
      };
    }

    if (result.status === "cancelled") {
      return {
        status: "cancelled",
      };
    }

    const technicalError = result.error || "Unknown printing error occurred.";

    console.error("TSC printing failed:", technicalError);

    await updateLabelJobStatus(job.id, "Failed");

    return {
      status: "failed",
      error: getUserFriendlyPrintError(technicalError),
    };
  } catch (error) {
    const technicalError =
      error instanceof Error ? error.message : String(error);

    console.error("Printing error:", technicalError);

    await updateLabelJobStatus(job.id, "Failed");

    return {
      status: "failed",
      error: getUserFriendlyPrintError(technicalError),
    };
  }
};
