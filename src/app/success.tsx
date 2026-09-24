import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  navy: "#142B4A",
  orange: "#F58220",
  background: "#F7F8FA",
  white: "#FFFFFF",
  secondaryText: "#667085",
};

export default function SuccessScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/");
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.successCircle}>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        <Text style={styles.title}>Printing Complete</Text>

        <Text style={styles.message}>
          All labels have been printed successfully.
        </Text>

        <Text style={styles.redirectMessage}>Returning to New Label...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  successCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  checkmark: {
    fontSize: 42,
    fontWeight: "700",
    color: COLORS.white,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.navy,
    textAlign: "center",
  },

  message: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.secondaryText,
    textAlign: "center",
  },

  redirectMessage: {
    marginTop: 24,
    fontSize: 13,
    color: COLORS.secondaryText,
    textAlign: "center",
  },
});
