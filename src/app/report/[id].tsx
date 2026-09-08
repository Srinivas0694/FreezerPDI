// app/report/[id].tsx  — REPORT
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../../constants/theme";
import { Card, Muted } from "../../components/ui";
import ExportBar from "../../components/ExportBar";
import { API_BASE } from "../../constants/config";

// Keep in sync with the ESP32 firmware thresholds.
const TH = {
  voltage: { min: 200, max: 250 },
  current: { min: 0.8, max: 2.5 },
  power: { min: 120, max: 400 },
  gas: 1000,
};
const W = Dimensions.get("window").width - 36;

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [test, setTest] = useState<any>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/tests/${id}`);
        const j = await r.json();
        setTest(j.test); setReadings(j.readings ?? []);
      } finally { setLoading(false); }
    })();
  }, [id]);

  const fails: string[] = [];
  if (test) {
    if (test.voltageResult === "FAIL") fails.push("Voltage went out of the allowed range.");
    if (test.currentResult === "FAIL") fails.push("Current went out of the allowed range.");
    if (test.powerResult === "FAIL") fails.push("Power went out of the allowed range.");
    if (test.gasResult === "FAIL") fails.push("Gas leak detected during the test.");
  }
  const pass = test?.overallResult === "PASS";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={C.sub} />
          <Muted>Back to history</Muted>
        </TouchableOpacity>

        {loading ? (
          <Muted>Loading…</Muted>
        ) : !test ? (
          <Muted>Test not found.</Muted>
        ) : (
          <>
            <Card>
              <Muted>Freezer</Muted>
              <Text style={styles.code}>{test.freezerId}</Text>
              <View style={{ marginTop: 12, gap: 4 }}>
                <Row k="Station" v={test.stationId} />
                <Row k="Started" v={new Date(test.startedAt).toLocaleString()} />
                <Row k="Completed" v={test.completedAt ? new Date(test.completedAt).toLocaleString() : "—"} />
              </View>
            </Card>

            <Card style={{ alignItems: "center" }}>
              <Muted>Overall</Muted>
              <Text style={[styles.verdict, { color: pass ? C.green : C.red }]}>
                {pass ? "PDI PASSED" : test.overallResult === "FAIL" ? "PDI FAILED" : test.status}
              </Text>
              <View style={{ alignSelf: "stretch", marginTop: 10 }}>
                <ResRow label="Voltage" r={test.voltageResult} />
                <ResRow label="Current" r={test.currentResult} />
                <ResRow label="Power" r={test.powerResult} />
                <ResRow label="Gas" r={test.gasResult} />
              </View>
            </Card>

            <ExportBar test={test} readings={readings} />

            {fails.length > 0 && (
              <Card style={{ borderColor: C.red + "66", backgroundColor: C.red + "12" }}>
                <Text style={styles.failTitle}>Failure reasons</Text>
                {fails.map((f, i) => <Muted key={i} style={{ marginTop: 4 }}>• {f}</Muted>)}
              </Card>
            )}

            {readings.length === 0 ? (
              <Muted>No readings were recorded for this test.</Muted>
            ) : (
              <>
                <ChartCard title="Voltage (V)" readings={readings} field="voltage" min={TH.voltage.min} max={TH.voltage.max} />
                <ChartCard title="Current (A)" readings={readings} field="current" min={TH.current.min} max={TH.current.max} />
                <ChartCard title="Power (W)" readings={readings} field="power" min={TH.power.min} max={TH.power.max} />
                <ChartCard title="Gas (ADC)" readings={readings} field="gasValue" max={TH.gas} />
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Muted>{k}</Muted>
      <Text style={{ color: C.text, fontFamily: F.m, fontSize: 13 }}>{v}</Text>
    </View>
  );
}
function ResRow({ label, r }: { label: string; r: string | null }) {
  const col = r === "PASS" ? C.green : r === "FAIL" ? C.red : C.faint;
  return (
    <View style={styles.resRow}>
      <Text style={{ color: C.sub, fontFamily: F.m, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: col, fontFamily: F.b, fontSize: 14 }}>{r ?? "—"}</Text>
    </View>
  );
}

function ChartCard({ title, readings, field, min, max }: { title: string; readings: any[]; field: string; min?: number; max?: number }) {
  const values = readings.map((r) => Number(r[field]) || 0);
  const labels = readings.map((r, i) => (i % Math.ceil(readings.length / 4 || 1) === 0 ? `${Math.floor(r.elapsedSeconds / 60)}m` : ""));
  const datasets: any[] = [{ data: values, color: () => C.accent, strokeWidth: 2 }];
  if (min !== undefined) datasets.push({ data: values.map(() => min), color: () => C.red + "88", strokeWidth: 1, withDots: false });
  if (max !== undefined) datasets.push({ data: values.map(() => max), color: () => C.red + "88", strokeWidth: 1, withDots: false });

  return (
    <Card style={{ paddingHorizontal: 8 }}>
      <Text style={styles.chartTitle}>{title}</Text>
      <LineChart
        data={{ labels, datasets }}
        width={W - 16}
        height={190}
        withInnerLines={false}
        withOuterLines={false}
        withShadow={false}
        bezier
        chartConfig={{
          backgroundGradientFrom: C.card,
          backgroundGradientTo: C.card,
          decimalPlaces: field === "current" ? 2 : 0,
          color: () => C.faint,
          labelColor: () => C.faint,
          propsForDots: { r: "2" },
        }}
        style={{ borderRadius: 12 }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 18, gap: 16 },
  back: { flexDirection: "row", alignItems: "center", gap: 2 },
  code: { color: C.accent, fontFamily: F.b, fontSize: 22, marginTop: 2 },
  verdict: { fontFamily: F.xb, fontSize: 30, marginTop: 2 },
  resRow: { flexDirection: "row", justifyContent: "space-between", borderTopColor: C.border, borderTopWidth: 1, paddingVertical: 8 },
  failTitle: { color: C.red, fontFamily: F.b, fontSize: 15 },
  chartTitle: { color: C.text, fontFamily: F.sb, fontSize: 14, marginBottom: 6, marginLeft: 8 },
});