import type { LabelJob } from "@/models/label-job";

export interface LabelProtocol {
  encode(job: LabelJob): Uint8Array;
}
