// app/(tabs)/index.tsx  — SCAN
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { C, F } from "../../constants/theme";
import { Card, Eyebrow, Muted } from "../../components/ui";
import { API_BASE, STATION_ID } from "../../constants/config";

type Phase = "idle" | "scanning" | "review" | "starting" | "started" | "error";

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>("idle");
  const [freezerId, setFreezerId] = useState("");
  const [manual, setManual] = useState("");
  const [msg, setMsg] = useState("");
  const [testId, setTestId] = useState("");

  async function openScanner() {
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) { setMsg("Camera permission is needed to scan."); return; }
    }
    setMsg("");
    setPhase("scanning");
  }

  function onScanned({ data }: { data: string }) {
    if (phase !== "scanning") return;
    setFreezerId(data.trim());
    setPhase("review");
  }

  function useManual() {
    const v = manual.trim();
    if (!v) return;
    setFreezerId(v);
    setPhase("review");
  }

  async function startTest() {
    setPhase("starting"); setMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/test/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: STATION_ID, freezerId }),
      });
      const data = await res.json();
      if (res.ok && data.success) { setTestId(data.testId); setPhase("started"); }
      else if (res.status === 409) { setPhase("error"); setMsg("This station already has a test running."); }
      else { setPhase("error"); setMsg(data.error || `Start failed (${res.status}).`); }
    } catch {
      setPhase("error"); setMsg("Network error — is the station online?");
    }
  }

  function reset() { setFreezerId(""); setManual(""); setTestId(""); setMsg(""); setPhase("idle"); }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Eyebrow>FREEZER PDI</Eyebrow>
          <Text style={styles.h1}>Scan Freezer</Text>
          <Muted>Station {STATION_ID}</Muted>
        </View>

        {phase === "idle" && (
          <View style={{ gap: 14 }}>
            <TouchableOpacity style={styles.primary} onPress={openScanner} activeOpacity={0.85}>
              <Text style={styles.primaryText}>Scan QR / Barcode</Text>
            </TouchableOpacity>
            <Card>
              <Muted style={{ marginBottom: 8 }}>Or enter the freezer serial manually</Muted>
              <TextInput
                value={manual}
                onChangeText={setManual}
                placeholder="Freezer serial / code"
                placeholderTextColor={C.faint}
                autoCapitalize="characters"
                style={styles.input}
              />
              <TouchableOpacity style={styles.secondary} onPress={useManual}>
                <Text style={styles.secondaryText}>Use this code</Text>
              </TouchableOpacity>
            </Card>
            {!!msg && <Text style={styles.warn}>{msg}</Text>}
          </View>
        )}

        {phase === "scanning" && (
          <View style={{ gap: 14 }}>
            <View style={styles.cameraWrap}>
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_a", "upc_e", "codabar", "itf14", "datamatrix", "pdf417"],
                }}
                onBarcodeScanned={onScanned}
              />
              <View style={styles.reticle} />
            </View>
            <Muted style={{ textAlign: "center" }}>Point the camera at the label on the freezer</Muted>
            <TouchableOpacity style={styles.secondary} onPress={() => setPhase("idle")}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === "review" && (
          <View style={{ gap: 14 }}>
            <Card>
              <Muted>Freezer</Muted>
              <Text style={styles.bigCode}>{freezerId}</Text>
              <Muted style={{ marginTop: 12 }}>Station</Muted>
              <Text style={styles.station}>{STATION_ID}</Text>
            </Card>
            <TouchableOpacity style={styles.primary} onPress={startTest} activeOpacity={0.85}>
              <Text style={styles.primaryText}>START TEST</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondary} onPress={reset}>
              <Text style={styles.secondaryText}>Scan a different freezer</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === "starting" && (
          <Card style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={styles.station}>Starting test…</Text>
            <Muted>{freezerId}</Muted>
          </Card>
        )}

        {phase === "started" && (
          <View style={{ gap: 14 }}>
            <Card style={{ borderColor: C.accent + "66", backgroundColor: C.accent + "14", alignItems: "center", paddingVertical: 28 }}>
              <Text style={styles.running}>TEST RUNNING</Text>
              <Muted style={{ marginTop: 8 }}>{freezerId}</Muted>
              <Muted style={{ fontSize: 11, marginTop: 4 }}>Test ID: {testId.slice(0, 8)}…</Muted>
              <Muted style={{ textAlign: "center", marginTop: 12 }}>
                The station runs the 5-minute test on its own. You can close the app.
              </Muted>
            </Card>
            <TouchableOpacity style={styles.primary} onPress={() => router.push("/live")}>
              <Text style={styles.primaryText}>Watch live →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondary} onPress={reset}>
              <Text style={styles.secondaryText}>Scan next freezer</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === "error" && (
          <View style={{ gap: 14 }}>
            <Card style={{ borderColor: C.red + "66", backgroundColor: C.red + "14", alignItems: "center", paddingVertical: 24 }}>
              <Text style={[styles.running, { color: C.red }]}>Couldn't start</Text>
              <Muted style={{ textAlign: "center", marginTop: 8 }}>{msg}</Muted>
            </Card>
            <TouchableOpacity style={styles.primary} onPress={() => setPhase("review")}>
              <Text style={styles.primaryText}>Try again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondary} onPress={reset}>
              <Text style={styles.secondaryText}>Start over</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 18, gap: 18 },
  header: { alignItems: "center", marginTop: 6 },
  h1: { color: C.text, fontFamily: F.b, fontSize: 26, marginTop: 2 },
  primary: { backgroundColor: C.accent, borderRadius: 18, paddingVertical: 18, alignItems: "center" },
  primaryText: { color: "#04140c", fontFamily: F.b, fontSize: 17 },
  secondary: { borderColor: C.border, borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  secondaryText: { color: C.text, fontFamily: F.sb, fontSize: 14 },
  input: { backgroundColor: C.bg, borderColor: C.border, borderWidth: 1, borderRadius: 12, color: C.text, fontFamily: F.m, fontSize: 16, paddingHorizontal: 14, paddingVertical: 12 },
  warn: { color: C.amber, fontFamily: F.m, fontSize: 13 },
  cameraWrap: { height: 320, borderRadius: 20, overflow: "hidden", borderColor: C.border, borderWidth: 1, backgroundColor: "#000" },
  reticle: { position: "absolute", top: "50%", left: "50%", width: 200, height: 200, marginLeft: -100, marginTop: -100, borderColor: C.accent, borderWidth: 3, borderRadius: 20 },
  bigCode: { color: C.accent, fontFamily: F.b, fontSize: 22, marginTop: 2 },
  station: { color: C.text, fontFamily: F.sb, fontSize: 17 },
  running: { color: C.accent, fontFamily: F.xb, fontSize: 26 },
});
