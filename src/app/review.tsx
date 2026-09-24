import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import LabelRenderer from "@/components/label-renderer";
import { updateLabelJobStatus } from "@/database/database";
import type { LabelJob } from "@/models/label-job";
import { MockLabelPrinter } from "@/services/printing/mock/mock-label-printer";
import type { LabelPrinterService } from "@/services/printing/printer-service";

const COLORS = {
  navy: "#142B4A",
  orange: "#F58220",
  background: "#F7F8FA",
  white: "#FFFFFF",
  border: "#D9DEE5",
  secondaryText: "#667085",
  overlay: "rgba(0, 0, 0, 0.45)",
};

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();

  const { labelJob } = useLocalSearchParams<{ labelJob: string }>();

  const [isPrinting, setIsPrinting] = useState(false);
  const [currentBox, setCurrentBox] = useState(0);

  let job: LabelJob | null = null;

  try {
    if (labelJob) {
      job = JSON.parse(labelJob) as LabelJob;
    }
  } catch {
    job = null;
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.container}>
          <Text style={styles.title}>Review</Text>

          <Text style={styles.errorText}>
            Unable to load the label information.
          </Text>

          <Pressable style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>GO BACK</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handlePrint = async () => {
    if (isPrinting) {
      return;
    }

    try {
      setIsPrinting(true);
      setCurrentBox(0);

      const printer: LabelPrinterService = new MockLabelPrinter();

      const result = await printer.print(job, (progress) => {
        setCurrentBox(progress.currentBox);
      });

      if (result.status === "completed") {
        await updateLabelJobStatus(job.id, "Completed");
        console.log("Mock printing completed successfully.");
        router.replace("/success");
      } else if (result.status === "cancelled") {
        console.log("Mock printing cancelled.");
      } else {
        console.error("Mock printing failed:", result.error);
      }
    } catch (error) {
      console.error("Mock printing error:", error);
    } finally {
      setIsPrinting(false);
      setCurrentBox(0);
    }
  };

  const progress = job.boxCount > 0 ? currentBox / job.boxCount : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Review</Text>

        <Text style={styles.subtitle}>
          Check the shipment details before printing.
        </Text>

        {/* Shipment Details */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shipment Details</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Docket Number</Text>
            <Text style={styles.value}>{job.docketNumber}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{job.locationText}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Number of Boxes</Text>
            <Text style={styles.value}>{job.boxCount}</Text>
          </View>

          <View style={[styles.row, styles.lastRow]}>
            <Text style={styles.label}>Label Size</Text>
            <Text style={styles.value}>3" × 4"</Text>
          </View>
        </View>

        {/* Label Preview */}

        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Label Preview</Text>

          <LabelRenderer job={job} boxNumber={1} />

          <Text style={styles.previewNote}>Preview of the first label</Text>
        </View>

        {/* Print Button */}

        <Pressable
          style={[styles.button, isPrinting && styles.buttonDisabled]}
          onPress={handlePrint}
          disabled={isPrinting}
        >
          <Text style={styles.buttonText}>PRINT</Text>
        </Pressable>

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
                {currentBox} / {job.boxCount}
              </Text>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress * 100}%`,
                    },
                  ]}
                />
              </View>

              <Text style={styles.printingMessage}>Please wait...</Text>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: 20,
  },

  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.navy,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,
    color: COLORS.secondaryText,
    marginBottom: 24,
  },

  /* Shipment Details */

  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 18,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.navy,
    marginBottom: 16,
  },

  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  label: {
    fontSize: 13,
    color: COLORS.secondaryText,
    marginBottom: 4,
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.navy,
  },

  /* Label Preview */

  previewSection: {
    marginTop: 24,
  },

  previewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.navy,
    marginBottom: 12,
  },

  previewNote: {
    fontSize: 12,
    color: COLORS.secondaryText,
    textAlign: "center",
    marginTop: 8,
  },

  /* Print */

  button: {
    height: 56,
    backgroundColor: COLORS.navy,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },

  /* Printing Modal */

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

  errorText: {
    color: COLORS.secondaryText,
    fontSize: 15,
    marginTop: 10,
  },
});
