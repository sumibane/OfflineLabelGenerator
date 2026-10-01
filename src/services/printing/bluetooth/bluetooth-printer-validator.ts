import type { BluetoothPrinter } from "./bluetooth-printer-manager";

const TSC_PRINTER_KEYWORDS = ["tsc", "alpha", "bt-spp", "btspp"];

export function looksLikePrinter(device: BluetoothPrinter): boolean {
  const name = device.name.trim().toLowerCase();

  if (!name || name === "unnamed bluetooth device") {
    return false;
  }

  return TSC_PRINTER_KEYWORDS.some((keyword) => name.includes(keyword));
}
