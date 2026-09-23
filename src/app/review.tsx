import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import type { LabelJob } from "@/models/label-job";

const COLORS = {
  navy: "#142B4A",
  orange: "#F58220",
  background: "#F7F8FA",
  white: "#FFFFFF",
  border: "#D9DEE5",
  secondaryText: "#667085",
};

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();

  const { labelJob } = useLocalSearchParams<{ labelJob: string }>();

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

          <View style={styles.labelPreview}>
            {/* Company */}

            <Text style={styles.previewCompany}>RUDRAX LOGISTICS SERVICES</Text>

            <View style={styles.divider} />

            {/* Docket */}

            <View style={styles.previewField}>
              <Text style={styles.previewLabel}>DOCKET NUMBER</Text>

              <Text
                style={styles.previewDocket}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {job.docketNumber}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Location */}

            <View style={styles.previewField}>
              <Text style={styles.previewLabel}>LOCATION</Text>

              <Text
                style={styles.previewLocation}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {job.locationText}
              </Text>
            </View>

            {/* Box Number */}

            <View style={styles.boxSection}>
              <Text style={styles.previewLabel}>BOX</Text>

              <Text style={styles.previewBox}>{`1/${job.boxCount}`}</Text>
            </View>
          </View>

          <Text style={styles.previewNote}>Preview of the first label</Text>
        </View>

        {/* Print Button */}

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>PRINT</Text>
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

  labelPreview: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
  },

  previewCompany: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.navy,
    textAlign: "center",
    letterSpacing: 0.4,
    marginBottom: 12,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    width: "100%",
  },

  previewField: {
    paddingVertical: 16,
  },

  previewLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.secondaryText,
    letterSpacing: 0.8,
    marginBottom: 5,
  },

  previewDocket: {
    fontSize: 27,
    fontWeight: "800",
    color: COLORS.navy,
  },

  previewLocation: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.navy,
  },

  boxSection: {
    marginTop: "auto",
    paddingTop: 16,
    alignItems: "center",
  },

  previewBox: {
    fontSize: 34,
    fontWeight: "900",
    color: COLORS.orange,
    letterSpacing: 0.5,
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

  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },

  errorText: {
    color: COLORS.secondaryText,
    fontSize: 15,
    marginTop: 10,
  },
});
