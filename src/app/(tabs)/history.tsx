import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getAllLabelJobs } from "@/database/database";
import type { LabelJob } from "@/models/label-job";

import { saveLabelPdf } from "@/services/pdf-service";
import { printLabelJob } from "@/services/printing/print-label-job";

export default function HistoryScreen() {
  const [jobs, setJobs] = useState<LabelJob[]>([]);
  const [loading, setLoading] = useState(true);

  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  const [printingJobId, setPrintingJobId] = useState<string | null>(null);

  const [currentBox, setCurrentBox] = useState(0);

  const handleSave = async (job: LabelJob) => {
    if (savingJobId || printingJobId) {
      return;
    }

    try {
      setSavingJobId(job.id);

      const savedUri = await saveLabelPdf(job);

      Alert.alert("Saved", "The label PDF has been saved to local storage.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.error("PDF save error:", error);

      Alert.alert("Save Failed", message);
    } finally {
      setSavingJobId(null);
    }
  };

  const handleReprint = async (job: LabelJob) => {
    if (savingJobId || printingJobId) {
      return;
    }

    try {
      setPrintingJobId(job.id);
      setCurrentBox(0);

      const result = await printLabelJob(job, (currentBox) => {
        setCurrentBox(currentBox);
      });

      if (result.status === "completed") {
        setCurrentBox(job.boxCount);

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
      console.error("Reprint error:", error);
    } finally {
      setPrintingJobId(null);
    }
  };

  const loadJobs = async () => {
    try {
      setLoading(true);

      const savedJobs = await getAllLabelJobs();

      setJobs(savedJobs);
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

  const printingJob = jobs.find((job) => job.id === printingJobId);

  const progress =
    printingJob && printingJob.boxCount > 0
      ? currentBox / printingJob.boxCount
      : 0;

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
                {/* SAVE PDF */}
                <Pressable
                  style={[
                    styles.saveButton,
                    (savingJobId !== null || printingJobId !== null) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={() => handleSave(item)}
                  disabled={savingJobId !== null || printingJobId !== null}
                >
                  <Text style={styles.saveButtonText}>
                    {savingJobId === item.id ? "SAVING..." : "SAVE PDF"}
                  </Text>
                </Pressable>

                {/* REPRINT */}
                <Pressable
                  style={[
                    styles.reprintButton,
                    (savingJobId !== null || printingJobId !== null) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={() => handleReprint(item)}
                  disabled={savingJobId !== null || printingJobId !== null}
                >
                  <Text style={styles.reprintButtonText}>
                    {printingJobId === item.id ? "PRINTING..." : "REPRINT"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      {/* Reprint Printing Modal */}
      <Modal
        visible={printingJobId !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.printingModal}>
            <Text style={styles.printingTitle}>Printing Labels</Text>

            <Text style={styles.printingProgress}>
              {currentBox} / {printingJob?.boxCount ?? 0}
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  printingModal: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
  },

  printingTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#142B4A",
  },

  printingProgress: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "700",
    color: "#142B4A",
  },

  progressTrack: {
    width: "100%",
    height: 10,
    marginTop: 22,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "#D9DEE5",
  },

  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#142B4A",
  },

  printingMessage: {
    marginTop: 14,
    fontSize: 14,
    color: "#667085",
  },
});
