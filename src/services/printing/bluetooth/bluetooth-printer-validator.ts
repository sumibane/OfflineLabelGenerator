import type { BluetoothPrinter } from "./bluetooth-printer-manager";

const PRINTER_KEYWORDS = ["tsc", "alpha", "printer", "label", "barcode"];

export function looksLikePrinter(device: BluetoothPrinter): boolean {
  const name = device.name.trim().toLowerCase();

  if (!name || name === "unnamed bluetooth device") {
    return false;
  }

  return PRINTER_KEYWORDS.some((keyword) => name.includes(keyword));
}
