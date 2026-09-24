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
