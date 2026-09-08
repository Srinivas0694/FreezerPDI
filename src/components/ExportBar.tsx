// components/ExportBar.tsx
import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../constants/theme";
import { exportCSV, exportXLSX, exportPDF } from "../utils/export";

export default function ExportBar({ test, readings }: { test: any; readings: any[] }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function run(kind: "csv" | "xlsx" | "pdf") {
    if (readings.length === 0) { Alert.alert("Nothing to export", "This test has no readings."); return; }
    setBusy(kind);
    try {
      if (kind === "csv") await exportCSV(test, readings);
      else if (kind === "xlsx") await exportXLSX(test, readings);
      else await exportPDF(test, readings);
    } catch (e: any) {
      Alert.alert("Export failed", e?.message ?? "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  const Btn = ({ kind, icon, label }: { kind: "csv" | "xlsx" | "pdf"; icon: any; label: string }) => (
    <TouchableOpacity style={styles.btn} onPress={() => run(kind)} disabled={!!busy} activeOpacity={0.85}>
      {busy === kind ? <ActivityIndicator color={C.accent} /> : <Ionicons name={icon} size={18} color={C.accent} />}
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.row}>
      <Btn kind="csv" icon="document-text-outline" label="CSV" />
      <Btn kind="xlsx" icon="grid-outline" label="Excel" />
      <Btn kind="pdf" icon="document-outline" label="PDF" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center",
    backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 14, paddingVertical: 13,
  },
  label: { color: C.text, fontFamily: F.sb, fontSize: 14 },
});
