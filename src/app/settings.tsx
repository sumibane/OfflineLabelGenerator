import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  discoverPrinters,
  ensureBluetoothEnabled,
  getPairedPrinters,
  pairPrinter,
  type BluetoothPrinter,
} from "@/services/printing/bluetooth/bluetooth-printer-manager";

import {
  clearSelectedPrinter,
  getSelectedPrinter,
  saveSelectedPrinter,
} from "@/services/printing/bluetooth/bluetooth-printer-storage";

import type { PrinterConfig } from "@/services/printing/printer-config";

import { BluetoothTransport } from "@/services/printing/transports/bluetooth/bluetooth-transport";

import { looksLikePrinter } from "@/services/printing/bluetooth/bluetooth-printer-validator";

export default function SettingsScreen() {
  const [pairedPrinters, setPairedPrinters] = useState<BluetoothPrinter[]>([]);
  const [discoveredDevices, setDiscoveredDevices] = useState<
    BluetoothPrinter[]
  >([]);

  const [selectedPrinter, setSelectedPrinter] = useState<PrinterConfig | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const savedPrinter = await getSelectedPrinter();

      setSelectedPrinter(savedPrinter);

      const enabled = await ensureBluetoothEnabled();

      if (!enabled) {
        setStatus("Bluetooth permission is required");
        return;
      }

      const printers = await getPairedPrinters();

      setPairedPrinters(printers);

      setStatus(
        printers.length > 0
          ? `${printers.length} paired device(s)`
          : "No paired Bluetooth devices",
      );
    } catch (error) {
      console.log("Bluetooth settings load failed:", error);
      setStatus("Bluetooth unavailable");
    }
  }

  async function refreshPairedDevices() {
    try {
      setLoading(true);
      setStatus("Loading paired devices...");

      const enabled = await ensureBluetoothEnabled();

      if (!enabled) {
        setStatus("Bluetooth permission is required");
        return;
      }

      const printers = await getPairedPrinters();

      setPairedPrinters(printers);

      setStatus(
        printers.length > 0
          ? `${printers.length} paired device(s)`
          : "No paired Bluetooth devices",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      setStatus("Unable to load paired devices");
      Alert.alert("Bluetooth Error", message);
    } finally {
      setLoading(false);
    }
  }

  async function discoverDevices() {
    try {
      setLoading(true);
      setStatus("Searching nearby Bluetooth devices...");

      const enabled = await ensureBluetoothEnabled();

      if (!enabled) {
        setStatus("Bluetooth permission is required");
        return;
      }

      const devices = await discoverPrinters();

      setDiscoveredDevices(devices);

      setStatus(
        devices.length > 0
          ? `${devices.length} nearby device(s) found`
          : "No nearby devices found",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      setStatus("Bluetooth discovery failed");
      Alert.alert("Bluetooth Error", message);
    } finally {
      setLoading(false);
    }
  }

  async function pairDevice(device: BluetoothPrinter) {
    try {
      setLoading(true);
      setStatus(`Pairing ${device.name}...`);

      const paired = await pairPrinter(device.address);

      setPairedPrinters((current) => {
        const exists = current.some((item) => item.address === paired.address);

        if (exists) {
          return current;
        }

        return [...current, paired];
      });

      setStatus(`${paired.name} paired successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      setStatus("Pairing failed");
      Alert.alert("Pairing Failed", message);
    } finally {
      setLoading(false);
    }
  }

  async function selectPrinter(printer: BluetoothPrinter) {
    try {
      setLoading(true);
      setStatus(`Testing ${printer.name}...`);

      const transport = new BluetoothTransport(printer.address);

      await transport.connect();
      await transport.disconnect();

      const config: PrinterConfig = {
        address: printer.address,
        name: printer.name,
        connectionType: "bluetooth",
        protocol: "tspl",
      };

      await saveSelectedPrinter(config);

      setSelectedPrinter(config);

      setStatus(`${printer.name} selected`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      setStatus("Printer connection failed");
      Alert.alert("Connection Failed", message);
    } finally {
      setLoading(false);
    }
  }

  async function removeSelectedPrinter() {
    await clearSelectedPrinter();
    setSelectedPrinter(null);
    setStatus("No printer selected");
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator
    >
      <Text style={styles.title}>Printer Settings</Text>

      <Text style={styles.status}>{status}</Text>

      <View style={styles.selectedCard}>
        <Text style={styles.sectionTitle}>Selected Printer</Text>

        {selectedPrinter ? (
          <>
            <Text style={styles.deviceName}>{selectedPrinter.name}</Text>

            <Text style={styles.deviceAddress}>{selectedPrinter.address}</Text>

            <Text style={styles.deviceProtocol}>Bluetooth • TSPL</Text>

            <Pressable
              style={styles.removeButton}
              onPress={removeSelectedPrinter}
              disabled={loading}
            >
              <Text style={styles.removeButtonText}>Remove Printer</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.empty}>No printer selected</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Paired Bluetooth Devices</Text>

      <Pressable
        style={styles.primaryButton}
        onPress={refreshPairedDevices}
        disabled={loading}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? "Please wait..." : "Refresh Paired Devices"}
        </Text>
      </Pressable>

      <View style={styles.listSpacing} />

      {pairedPrinters.length === 0 ? (
        <Text style={styles.empty}>No paired devices.</Text>
      ) : (
        pairedPrinters.map((item) => {
          const selected = selectedPrinter?.address === item.address;

          const printerCandidate = looksLikePrinter(item);

          return (
            <View key={item.address} style={styles.device}>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{item.name}</Text>

                <Text style={styles.deviceAddress}>{item.address}</Text>
              </View>

              {printerCandidate ? (
                <Pressable
                  style={selected ? styles.selectedButton : styles.testButton}
                  onPress={() => selectPrinter(item)}
                  disabled={loading}
                >
                  <Text
                    style={
                      selected
                        ? styles.selectedButtonText
                        : styles.testButtonText
                    }
                  >
                    {selected ? "Selected" : "Select Printer"}
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.notPrinterText}>Not a printer</Text>
              )}
            </View>
          );
        })
      )}

      <Text style={styles.sectionTitle}>Nearby Bluetooth Devices</Text>

      <Pressable
        style={styles.secondaryButton}
        onPress={discoverDevices}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>Find Nearby Devices</Text>
      </Pressable>

      <View style={styles.listSpacing} />

      {discoveredDevices.length === 0 ? (
        <Text style={styles.empty}>No nearby devices found.</Text>
      ) : (
        discoveredDevices.map((item) => {
          const alreadyPaired = pairedPrinters.some(
            (paired) => paired.address === item.address,
          );

          return (
            <View key={item.address} style={styles.device}>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{item.name}</Text>

                <Text style={styles.deviceAddress}>{item.address}</Text>
              </View>

              {alreadyPaired ? (
                <Text style={styles.pairedText}>Paired</Text>
              ) : (
                <Pressable
                  style={styles.testButton}
                  onPress={() => pairDevice(item)}
                  disabled={loading}
                >
                  <Text style={styles.testButtonText}>Pair</Text>
                </Pressable>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#142B4A",
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#142B4A",
    marginTop: 18,
    marginBottom: 10,
  },

  status: {
    fontSize: 14,
    color: "#667085",
    marginBottom: 10,
  },

  selectedCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9DEE5",
    borderRadius: 12,
    padding: 16,
  },

  device: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9DEE5",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  deviceInfo: {
    flex: 1,
    minWidth: 0,
  },

  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#142B4A",
  },

  deviceAddress: {
    fontSize: 12,
    color: "#667085",
    marginTop: 4,
  },

  deviceProtocol: {
    fontSize: 12,
    color: "#667085",
    marginTop: 6,
  },

  primaryButton: {
    backgroundColor: "#142B4A",
    paddingVertical: 13,
    borderRadius: 9,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  secondaryButton: {
    backgroundColor: "#F58220",
    paddingVertical: 13,
    borderRadius: 9,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  listSpacing: {
    height: 10,
  },

  testButton: {
    backgroundColor: "#142B4A",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },

  testButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  selectedButton: {
    backgroundColor: "#E7F6EC",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },

  selectedButtonText: {
    color: "#217A3C",
    fontWeight: "600",
  },

  removeButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#D9DEE5",
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
  },

  removeButtonText: {
    color: "#667085",
    fontWeight: "600",
  },

  pairedText: {
    color: "#217A3C",
    fontWeight: "600",
  },

  notPrinterText: {
    color: "#667085",
    fontSize: 13,
    fontWeight: "600",
  },

  empty: {
    color: "#667085",
    paddingVertical: 12,
  },
});
