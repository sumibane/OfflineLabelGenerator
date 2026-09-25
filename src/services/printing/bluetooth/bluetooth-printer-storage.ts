import AsyncStorage from "@react-native-async-storage/async-storage";

import type { PrinterConfig } from "../printer-config";

const SELECTED_PRINTER_KEY = "@rudrax/selected-printer";

export async function saveSelectedPrinter(
  printer: PrinterConfig,
): Promise<void> {
  await AsyncStorage.setItem(SELECTED_PRINTER_KEY, JSON.stringify(printer));
}

export async function getSelectedPrinter(): Promise<PrinterConfig | null> {
  const value = await AsyncStorage.getItem(SELECTED_PRINTER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as PrinterConfig;
  } catch {
    return null;
  }
}

export async function clearSelectedPrinter(): Promise<void> {
  await AsyncStorage.removeItem(SELECTED_PRINTER_KEY);
}
