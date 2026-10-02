import { saveLabelJob } from "@/database/database";
import type { LabelJob } from "@/models/label-job";
import { printLabelJob } from "@/services/printing/print-label-job";
import { router } from "expo-router";
import { useRef, useState } from "react";
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

export default function NewLabelScreen() {
  const [docketNumber, setDocketNumber] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [activeDocketIndex, setActiveDocketIndex] = useState(0);

  const [location, setLocation] = useState("");
  const [boxCount, setBoxCount] = useState("");

  const [isPrinting, setIsPrinting] = useState(false);
  const [currentBox, setCurrentBox] = useState(0);

  const docketInputRefs = useRef<Array<TextInput | null>>([]);

  const handleDocketChange = (value: string, index: number) => {
    const digits = value.replace(/\D/g, "");

    // Ignore empty/malformed input.
    if (!digits) {
      const updated = [...docketNumber];
      updated[index] = "";

      setDocketNumber(updated);
      return;
    }

    const updated = [...docketNumber];

    // Handle pasted/multiple digits.
    if (digits.length > 1) {
      digits
        .slice(0, 6 - index)
        .split("")
        .forEach((digit, offset) => {
          updated[index + offset] = digit;
        });

      setDocketNumber(updated);

      const nextIndex = Math.min(index + digits.length, 5);

      setActiveDocketIndex(nextIndex);

      docketInputRefs.current[nextIndex]?.focus();

      return;
    }

    updated[index] = digits;

    setDocketNumber(updated);

    // Automatically move to the next box.
    if (index < 5) {
      setActiveDocketIndex(index + 1);
      docketInputRefs.current[index + 1]?.focus();
    } else {
      setActiveDocketIndex(5);
    }
  };

  const handleDocketKeyPress = (event: any, index: number) => {
    if (
      event.nativeEvent.key === "Backspace" &&
      !docketNumber[index] &&
      index > 0
    ) {
      const previousIndex = index - 1;

      setActiveDocketIndex(previousIndex);

      docketInputRefs.current[previousIndex]?.focus();
    }
  };

  const handleGenerate = async () => {
    if (isPrinting) {
      return;
    }

    const trimmedDocket = docketNumber.join("");
    const trimmedLocation = location.trim();
    const boxes = Number(boxCount);

    if (trimmedDocket.length !== 6) {
      alert("Please enter the 6-digit docket number.");
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
      // Save the new job to History first.
      await saveLabelJob(labelJob);

      setIsPrinting(true);
      setCurrentBox(0);

      // Use the shared printing service.
      const result = await printLabelJob(labelJob, (currentBox) => {
        setCurrentBox(currentBox);
      });

      if (result.status === "completed") {
        setCurrentBox(labelJob.boxCount);

        router.replace("/success");
      } else if (result.status === "failed") {
        router.replace({
          pathname: "/error",
          params: {
            message: result.error,
          },
        });
      }

      // Cancelled printing intentionally does not navigate.
    } catch (error) {
      // Safeguard for unexpected errors outside
      // normal printLabelJob() result handling.
      console.error("Generate and print error:", error);
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

          <View style={styles.docketInputRow}>
            {docketNumber.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  docketInputRefs.current[index] = ref;
                }}
                style={[
                  styles.docketInput,
                  activeDocketIndex === index && styles.docketInputActive,
                ]}
                value={digit}
                onChangeText={(value) => handleDocketChange(value, index)}
                onKeyPress={(event) => handleDocketKeyPress(event, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isPrinting}
                textAlign="center"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
              />
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Location</Text>

          <TextInput
            style={styles.fullInput}
            placeholder="Enter location..."
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

          <Text style={styles.labelSizeValue}>70MM × 70MM</Text>
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

  docketInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  docketInput: {
    flex: 1,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },

  docketInputActive: {
    borderColor: COLORS.navy,
    borderWidth: 2,
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
