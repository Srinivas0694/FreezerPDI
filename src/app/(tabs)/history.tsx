// app/(tabs)/history.tsx  — HISTORY
import { useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../../constants/theme";
import { Eyebrow, Muted, Pill } from "../../components/ui";
import { API_BASE, STATION_ID } from "../../constants/config";

export default function HistoryScreen() {
  const router = useRouter();
  const [tests, setTests] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PASS" | "FAIL">("ALL");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ stationId: STATION_ID, limit: "100" });
    if (q) p.set("q", q);
    if (filter !== "ALL") p.set("result", filter);
    try {
      const r = await fetch(`${API_BASE}/api/tests?${p.toString()}`);
      const j = await r.json();
      setTests(j.tests ?? []);
    } finally { setLoading(false); }
  }, [q, filter]);

  useEffect(() => { load(); }, [filter]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Eyebrow>FREEZER PDI</Eyebrow>
            <Text style={styles.h1}>Test History</Text>
          </View>
          <Muted>{STATION_ID}</Muted>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            value={q}
            onChangeText={setQ}
            onSubmitEditing={load}
            placeholder="Search freezer…"
            placeholderTextColor={C.faint}
            style={styles.input}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={load}>
            <Ionicons name="search" size={18} color="#04140c" />
          </TouchableOpacity>
        </View>

        <View style={styles.filters}>
          {(["ALL", "PASS", "FAIL"] as const).map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterBtn, filter === f && styles.filterOn]}>
              <Text style={[styles.filterText, filter === f && { color: C.white }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <Muted>Loading…</Muted>
        ) : (
          <FlatList
            data={tests}
            keyExtractor={(t) => t.testId}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={<Muted>No tests found.</Muted>}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => router.push(`/report/${item.testId}`)} activeOpacity={0.8}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.freezer}>{item.freezerId}</Text>
                  <Muted style={{ fontSize: 12 }}>{new Date(item.completedAt ?? item.startedAt).toLocaleString()}</Muted>
                </View>
                <Pill
                  label={item.status === "RUNNING" ? "RUNNING" : item.overallResult ?? "—"}
                  status={item.status === "RUNNING" ? "WARN" : item.overallResult ?? ""}
                />
                <Ionicons name="chevron-forward" size={18} color={C.faint} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, padding: 18, gap: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  h1: { color: C.text, fontFamily: F.b, fontSize: 24, marginTop: 2 },
  searchRow: { flexDirection: "row", gap: 8 },
  input: { flex: 1, backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 12, color: C.text, fontFamily: F.m, fontSize: 15, paddingHorizontal: 14, paddingVertical: 10 },
  searchBtn: { backgroundColor: C.accent, borderRadius: 12, width: 48, alignItems: "center", justifyContent: "center" },
  filters: { flexDirection: "row", gap: 6, backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 12, padding: 4, alignSelf: "flex-start" },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  filterOn: { backgroundColor: "#334155" },
  filterText: { color: C.sub, fontFamily: F.sb, fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 16, padding: 14 },
  freezer: { color: C.text, fontFamily: F.sb, fontSize: 15 },
});
