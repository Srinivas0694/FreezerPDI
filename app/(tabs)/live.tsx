// app/(tabs)/live.tsx  — LIVE
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, F, statusColor } from "../../constants/theme";
import { Card, Eyebrow, Muted, Pill } from "../../components/ui";
import { API_BASE, STATION_ID } from "../../constants/config";

function mmss(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function LiveScreen() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let on = true;
    const tick = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/test/live?stationId=${STATION_ID}`);
        const j = await r.json();
        if (on) setData(j);
      } catch {}
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => { on = false; clearInterval(id); };
  }, []);

  const l = data?.latest;
  const progress = data?.active && data.duration ? Math.min(100, Math.round(((data.elapsedSeconds ?? 0) / data.duration) * 100)) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Eyebrow>FREEZER PDI</Eyebrow>
            <Text style={styles.h1}>Live Test</Text>
          </View>
          <Muted>{STATION_ID}</Muted>
        </View>

        {!data && <Muted>Loading…</Muted>}

        {data && !data.active && (
          <View style={{ gap: 14 }}>
            <Card style={{ alignItems: "center", paddingVertical: 34 }}>
              <Text style={styles.mid}>No test running</Text>
              <Muted style={{ marginTop: 6, textAlign: "center" }}>Scan a freezer to start one.</Muted>
            </Card>
            {data.lastCompleted && (
              <Card>
                <Muted>Last completed test</Muted>
                <View style={styles.rowBetween}>
                  <Text style={styles.station}>{data.lastCompleted.freezerId}</Text>
                  <Pill label={data.lastCompleted.overallResult === "PASS" ? "PDI PASSED" : "PDI FAILED"} status={data.lastCompleted.overallResult} />
                </View>
              </Card>
            )}
          </View>
        )}

        {data?.active && (
          <View style={{ gap: 16 }}>
            <Card>
              <View style={styles.rowBetween}>
                <View>
                  <Muted>Freezer</Muted>
                  <Text style={styles.code}>{data.freezerId}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Muted>Time left</Muted>
                  <Text style={styles.timer}>{mmss(data.remainingSeconds ?? 0)}</Text>
                </View>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${progress}%` }]} />
              </View>
              <Muted style={{ textAlign: "right", marginTop: 4, fontSize: 11 }}>{progress}%</Muted>
            </Card>

            <View style={styles.grid}>
              <Metric label="VOLTAGE" value={l ? `${l.voltage.toFixed(1)} V` : "—"} status={l?.voltageStatus} />
              <Metric label="CURRENT" value={l ? `${l.current.toFixed(2)} A` : "—"} status={l?.currentStatus} />
              <Metric label="POWER" value={l ? `${l.power.toFixed(0)} W` : "—"} status={l?.powerStatus} />
              <Metric label="ENERGY" value={l ? `${l.energy.toFixed(2)} kWh` : "—"} />
              <Metric label="GAS" value={l ? String(l.gasValue) : "—"} status={l?.gasStatus} />
              <View style={[styles.metric, { borderColor: C.accent + "44", backgroundColor: C.accent + "14", justifyContent: "center", alignItems: "center" }]}>
                <Muted style={{ fontSize: 11 }}>STATUS</Muted>
                <Text style={{ color: C.accent, fontFamily: F.b, fontSize: 16, marginTop: 2 }}>TESTING</Text>
              </View>
            </View>

            {!l && <Muted style={{ textAlign: "center" }}>Waiting for the first reading…</Muted>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value, status }: { label: string; value: string; status?: string }) {
  return (
    <View style={styles.metric}>
      <Muted style={{ fontSize: 11 }}>{label}</Muted>
      <Text style={styles.metricVal}>{value}</Text>
      {status ? (
        <View style={{ marginTop: 6 }}>
          <Pill label={status.toUpperCase()} status={status} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 18, gap: 18 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  h1: { color: C.text, fontFamily: F.b, fontSize: 24, marginTop: 2 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  code: { color: C.accent, fontFamily: F.b, fontSize: 20 },
  timer: { color: C.text, fontFamily: F.xb, fontSize: 34 },
  track: { height: 12, borderRadius: 8, backgroundColor: C.border, marginTop: 14, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: C.accent },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: { width: "31.5%", minWidth: 100, flexGrow: 1, backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 16, padding: 14 },
  metricVal: { color: C.text, fontFamily: F.b, fontSize: 18, marginTop: 4 },
  mid: { color: C.sub, fontFamily: F.sb, fontSize: 18 },
  station: { color: C.text, fontFamily: F.sb, fontSize: 16 },
});
