import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  navy: "#142B4A",
  orange: "#F58220",
  background: "#F7F8FA",
  white: "#FFFFFF",
  secondaryText: "#667085",
  error: "#D92D20",
  errorBackground: "#FEE4E2",
  border: "#D9DEE5",
};

export default function ErrorScreen() {
  const { message } = useLocalSearchParams<{
    message?: string;
  }>();

  const errorMessage =
    typeof message === "string" && message.trim()
      ? message
      : "An unknown printing error occurred.";

  const handleGoToHistory = () => {
    router.replace("/history");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.errorCircle}>
          <Text style={styles.errorIcon}>!</Text>
        </View>

        <Text style={styles.title}>Printing Failed</Text>

        <Text style={styles.message}>
          The labels could not be printed successfully.
        </Text>

        <View style={styles.errorCard}>
          <Text style={styles.errorLabel}>PRINT ERROR</Text>

          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>

        <Pressable style={styles.historyButton} onPress={handleGoToHistory}>
          <Text style={styles.historyButtonText}>GO TO HISTORY</Text>
        </Pressable>
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

  errorCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.errorBackground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  errorIcon: {
    fontSize: 42,
    fontWeight: "700",
    color: COLORS.error,
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

  errorCard: {
    width: "100%",
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },

  errorLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.error,
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.navy,
  },

  historyButton: {
    width: "100%",
    height: 52,
    marginTop: 24,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.navy,
  },

  historyButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
