export type PrinterConnectionType = "bluetooth";

export type PrinterProtocol = "tspl";

export type PrinterConfig = {
  address: string;
  name: string;
  connectionType: PrinterConnectionType;
  protocol: PrinterProtocol;
};
