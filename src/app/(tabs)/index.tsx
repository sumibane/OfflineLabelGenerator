import { saveLabelJob } from "@/database/database";
import type { LabelJob } from "@/models/label-job";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
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
};

export default function NewLabelScreen() {
  const [docketNumber, setDocketNumber] = useState("");
  const [location, setLocation] = useState("");
  const [boxCount, setBoxCount] = useState("");

  const handleGenerate = async () => {
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

      router.push({
        pathname: "/review",
        params: {
          labelJob: JSON.stringify(labelJob),
        },
      });
    } catch (error) {
      console.error("Failed to save Label Job:", error);
      alert("Failed to save the label job. Please try again.");
    }
  };

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
            />

            <Pressable style={styles.scanButton}>
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
        <Pressable style={styles.printButton} onPress={handleGenerate}>
          <Text style={styles.printButtonText}>GENERATE & PRINT</Text>
        </Pressable>
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

  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.secondaryText,
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
});
