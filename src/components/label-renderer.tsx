import { Image, StyleSheet, Text, View } from "react-native";

import type { LabelJob } from "@/models/label-job";

const COLORS = {
  black: "#000000",
  white: "#FFFFFF",
  border: "#000000",
  secondaryText: "#333333",
};

type LabelRendererProps = {
  job: LabelJob;
  boxNumber?: number;
};

export default function LabelRenderer({
  job,
  boxNumber = 1,
}: LabelRendererProps) {
  return (
    <View style={styles.label}>
      {/* Thermal Label Header */}
      <View style={styles.header}>
        <Image
          source={require("@/assets/images/RudraxLogisticsLogo-Thermal-Header.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.divider} />

      {/* Docket Number */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>DOCKET NUMBER</Text>

        <Text
          style={styles.docketNumber}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
        >
          {job.docketNumber}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Location */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>LOCATION</Text>

        <Text
          style={styles.location}
          numberOfLines={3}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
        >
          {job.locationText}
        </Text>
      </View>

      {/* Box Number */}
      <View style={styles.boxSection}>
        <Text style={styles.boxLabel}>BOX</Text>

        <Text style={styles.boxNumber}>
          {boxNumber}/{job.boxCount}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },

  header: {
    width: "100%",
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },

  headerLogo: {
    width: "92%",
    height: "100%",
  },

  divider: {
    width: "100%",
    height: 1,
    backgroundColor: COLORS.black,
  },

  field: {
    paddingVertical: 16,
  },

  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.secondaryText,
    letterSpacing: 0.8,
    marginBottom: 6,
  },

  docketNumber: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
    color: COLORS.black,
  },

  location: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "800",
    color: COLORS.black,
  },

  boxSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 12,
    paddingBottom: 4,
  },

  boxLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.secondaryText,
    letterSpacing: 0.8,
    marginBottom: 2,
  },

  boxNumber: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    color: COLORS.black,
    letterSpacing: 0.5,
  },
});
