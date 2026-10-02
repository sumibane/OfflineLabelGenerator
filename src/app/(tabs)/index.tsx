import { saveLabelJob, updateLabelJobStatus } from "@/database/database";
import type { LabelJob } from "@/models/label-job";
import { getPrinterService } from "@/services/printing/printer-service-factory";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  navy: "#142B4A",
  orange: "#F58220",
  white: "#FFFFFF",
  background: "#F7F8FA",
  border: "#D9DEE5",
  text: "#142B4A",
  secondaryText: "#667085",
  inputBackground: "#FFFFFF",
  overlay: "rgba(0, 0, 0, 0.45)",
};

const getUserFriendlyPrintError = (error: string): string => {
  const normalizedError = error.toLowerCase();

  if (
    normalizedError.includes("connectionfailedexception") ||
    normalizedError.includes("socket might closed") ||
    normalizedError.includes("read failed") ||
    normalizedError.includes("timeout")
  ) {
    return "Unable to connect to the printer. Please make sure the printer is powered on, nearby, and connected.";
  }

  if (
    normalizedError.includes("bluetooth") ||
    normalizedError.includes("bluetoothadapter")
  ) {
    return "There was a problem with the Bluetooth connection. Please check that Bluetooth is enabled and the printer is connected.";
  }

  if (
    normalizedError.includes("printer") &&
    normalizedError.includes("connect")
  ) {
    return "Unable to connect to the printer. Please check the printer connection and try again.";
  }

  return "The labels could not be printed. Please check the printer and try again.";
};

export default function NewLabelScreen() {
  const [docketNumber, setDocketNumber] = useState("");
  const [location, setLocation] = useState("");
  const [boxCount, setBoxCount] = useState("");

  const [isPrinting, setIsPrinting] = useState(false);
  const [currentBox, setCurrentBox] = useState(0);

  const handleGenerate = async () => {
    if (isPrinting) {
      return;
    }

    const trimmedDocket = docketNumber.trim();
    const trimmedLocation = location.trim();
    const boxes = Number(boxCount);

    if (!trimmedDocket) {
      alert("Please enter the docket number.");
      return;
    }

    if (!trimmedLocation) {
      alert("Please enter the location.");
      return;
    }

    if (!Number.isInteger(boxes) || boxes <= 0) {
      alert("Please enter a valid number of boxes.");
      return;
    }

    const labelJob: LabelJob = {
      id: Date.now().toString(),
      docketNumber: trimmedDocket,
      locationId: null,
      locationText: trimmedLocation,
      boxCount: boxes,
      createdAt: new Date().toISOString(),
      printStatus: "Pending",
    };

    try {
      await saveLabelJob(labelJob);

      console.log("Label Job saved:", labelJob);

      setIsPrinting(true);
      setCurrentBox(0);

      const printer = await getPrinterService();

      const result = await printer.print(labelJob, (progress) => {
        setCurrentBox(progress.currentBox);
      });

      if (result.status === "completed") {
        await updateLabelJobStatus(labelJob.id, "Completed");

        console.log("Printing completed successfully.");

        setCurrentBox(labelJob.boxCount);

        router.replace("/success");
      } else if (result.status === "cancelled") {
        console.log("Printing cancelled.");
      } else {
        const technicalError =
          result.error || "Unknown printing error occurred.";

        // Keep the detailed technical error in the developer log.
        console.error("TSC printing failed:", technicalError);

        // Show only a user-friendly message to the user.
        const userFriendlyError = getUserFriendlyPrintError(technicalError);

        await updateLabelJobStatus(labelJob.id, "Failed");

        router.replace({
          pathname: "/error",
          params: {
            message: userFriendlyError,
          },
        });
      }
    } catch (error) {
      const technicalError =
        error instanceof Error ? error.message : String(error);

      console.error("Printing error:", technicalError);

      const userFriendlyError = getUserFriendlyPrintError(technicalError);

      await updateLabelJobStatus(labelJob.id, "Failed");

      router.replace({
        pathname: "/error",
        params: {
          message: userFriendlyError,
        },
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const progress = Number(boxCount) > 0 ? currentBox / Number(boxCount) : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/RudraxLogisticsLogo.jpeg")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Pressable
            style={styles.settingsButton}
            onPress={() => router.push("/settings")}
            disabled={isPrinting}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>

        {/* Screen title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>New Label</Text>
          <Text style={styles.subtitle}>
            Enter the shipment details to create labels.
          </Text>
        </View>

        {/* Docket Number */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Docket Number</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter docket number"
              placeholderTextColor="#98A2B3"
              value={docketNumber}
              onChangeText={setDocketNumber}
              editable={!isPrinting}
            />

            <Pressable
              style={[styles.scanButton, isPrinting && styles.buttonDisabled]}
              disabled={isPrinting}
            >
              <Text style={styles.scanButtonText}>SCAN</Text>
            </Pressable>
          </View>
        </View>

        {/* Location */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Location</Text>

          <TextInput
            style={styles.fullInput}
            placeholder="Search location..."
            placeholderTextColor="#98A2B3"
            value={location}
            onChangeText={setLocation}
            editable={!isPrinting}
          />
        </View>

        {/* Number of Boxes */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Number of Boxes</Text>

          <TextInput
            style={styles.fullInput}
            placeholder="Enter number of boxes"
            placeholderTextColor="#98A2B3"
            keyboardType="number-pad"
            value={boxCount}
            onChangeText={setBoxCount}
            editable={!isPrinting}
          />
        </View>

        {/* Fixed Label Size */}
        <View style={styles.labelSizeCard}>
          <View>
            <Text style={styles.labelSizeTitle}>Label Size</Text>
            <Text style={styles.labelSizeDescription}>Fixed label size</Text>
          </View>

          <Text style={styles.labelSizeValue}>3" × 4"</Text>
        </View>

        {/* Generate & Print */}
        <Pressable
          style={[styles.printButton, isPrinting && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={isPrinting}
        >
          <Text style={styles.printButtonText}>
            {isPrinting ? "PRINTING..." : "GENERATE & PRINT"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Printing Modal */}
      <Modal
        visible={isPrinting}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.printingModal}>
            <Text style={styles.printingTitle}>Printing Labels</Text>

            <Text style={styles.printingProgress}>
              {currentBox} / {Number(boxCount)}
            </Text>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(progress * 100, 100)}%`,
                  },
                ]}
              />
            </View>

            <Text style={styles.printingMessage}>Please wait...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },

  header: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: {
    width: 165,
    height: 82,
  },

  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  settingsIcon: {
    fontSize: 22,
    color: COLORS.navy,
  },

  titleSection: {
    marginTop: 12,
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.navy,
    textTransform: "uppercase",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.secondaryText,
  },

  fieldContainer: {
    marginBottom: 20,
  },

  label: {
    marginBottom: 8,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },

  inputRow: {
    flexDirection: "row",
    gap: 10,
  },

  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBackground,
    color: COLORS.text,
    fontSize: 16,
  },

  fullInput: {
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBackground,
    color: COLORS.text,
    fontSize: 16,
  },

  scanButton: {
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.orange,
  },

  scanButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },

  labelSizeCard: {
    minHeight: 70,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  labelSizeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },

  labelSizeDescription: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.secondaryText,
  },

  labelSizeValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.navy,
  },

  printButton: {
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.navy,
  },

  printButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  printingModal: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
  },

  printingTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.navy,
  },

  printingProgress: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.navy,
  },

  progressTrack: {
    width: "100%",
    height: 10,
    marginTop: 22,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: COLORS.border,
  },

  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: COLORS.navy,
  },

  printingMessage: {
    marginTop: 14,
    fontSize: 14,
    color: COLORS.secondaryText,
  },
});
