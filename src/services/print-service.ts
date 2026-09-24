import type { LabelJob } from "@/models/label-job";

export type PrintProgress = {
  currentBox: number;
  totalBoxes: number;
};

export type PrintResult =
  | {
      status: "completed";
    }
  | {
      status: "failed";
      error: string;
    }
  | {
      status: "cancelled";
    };

export interface PrintService {
  print(
    job: LabelJob,
    onProgress?: (progress: PrintProgress) => void,
  ): Promise<PrintResult>;
}
