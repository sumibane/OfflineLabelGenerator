import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getAllLabelJobs } from "@/database/database";
import type { LabelJob } from "@/models/label-job";

import { saveLabelPdf } from "@/services/pdf-service";

export default function HistoryScreen() {
  const [jobs, setJobs] = useState<LabelJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  const handleSave = async (job: LabelJob) => {
    if (savingJobId) {
      return;
    }

    try {
      setSavingJobId(job.id);

      const savedUri = await saveLabelPdf(job);

      console.log("PDF saved successfully:", savedUri);

      Alert.alert("Saved", "The label PDF has been saved to local storage.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.error("PDF save error:", error);

      Alert.alert("Save Failed", message);
    } finally {
      setSavingJobId(null);
    }
  };

  const loadJobs = async () => {
    try {
      setLoading(true);

      const savedJobs = await getAllLabelJobs();

      setJobs(savedJobs);

      console.log("History loaded:", savedJobs);
    } catch (error) {
      console.error("Failed to load history:", error);
      Alert.alert(
        "Unable to load history",
        "Something went wrong while loading saved labels.",
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadJobs();
    }, []),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Previously generated label jobs</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : jobs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No label history yet.</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.docket}>{item.docketNumber}</Text>

              <Text style={styles.location}>{item.locationText}</Text>

              <View style={styles.detailsRow}>
                <Text style={styles.details}>
                  {item.boxCount} {item.boxCount === 1 ? "Box" : "Boxes"}
                </Text>

                <Text style={styles.status}>{item.printStatus}</Text>
              </View>

              <View style={styles.actionsRow}>
                <Pressable
                  style={[
                    styles.saveButton,
                    savingJobId === item.id && styles.buttonDisabled,
                  ]}
                  onPress={() => handleSave(item)}
                  disabled={savingJobId !== null}
                >
                  <Text style={styles.saveButtonText}>
                    {savingJobId === item.id ? "SAVING..." : "SAVE PDF"}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.reprintButton,
                    savingJobId !== null && styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    // Reprint functionality will be added next.
                  }}
                  disabled={savingJobId !== null}
                >
                  <Text style={styles.reprintButtonText}>REPRINT</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#142B4A",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#667085",
  },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9DEE5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  docket: {
    fontSize: 17,
    fontWeight: "700",
    color: "#142B4A",
  },

  location: {
    marginTop: 6,
    fontSize: 14,
    color: "#667085",
  },

  detailsRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  details: {
    fontSize: 13,
    color: "#667085",
  },

  status: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F58220",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  emptyText: {
    fontSize: 15,
    color: "#667085",
  },
  actionsRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },

  saveButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#142B4A",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  reprintButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F58220",
  },

  reprintButtonText: {
    color: "#F58220",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});
