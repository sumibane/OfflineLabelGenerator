export type LabelJob = {
  id: string;
  docketNumber: string;
  locationId: string | null;
  locationText: string;
  boxCount: number;
  createdAt: string;
  printStatus: "Pending" | "Completed" | "Partial" | "Failed";
};
