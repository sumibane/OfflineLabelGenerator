import AsyncStorage from "@react-native-async-storage/async-storage";

const SELECTED_PRINTER_KEY = "@rudrax/selected-bluetooth-printer";

export type SavedBluetoothPrinter = {
  address: string;
  name: string;
};

export async function saveSelectedPrinter(
  printer: SavedBluetoothPrinter,
): Promise<void> {
  await AsyncStorage.setItem(SELECTED_PRINTER_KEY, JSON.stringify(printer));
}

export async function getSelectedPrinter(): Promise<SavedBluetoothPrinter | null> {
  const value = await AsyncStorage.getItem(SELECTED_PRINTER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as SavedBluetoothPrinter;
  } catch {
    return null;
  }
}

export async function clearSelectedPrinter(): Promise<void> {
  await AsyncStorage.removeItem(SELECTED_PRINTER_KEY);
}
