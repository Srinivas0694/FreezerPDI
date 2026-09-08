// app/(tabs)/admin.tsx  — LABELS
import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { C, F } from "../../constants/theme";
import { Card, Eyebrow, Muted } from "../../components/ui";
import { API_BASE } from "../../constants/config";

const FRZ_RE = /^FRZ-\d{4}-\d{6}$/;

export default function AdminScreen() {
  const [code, setCode] = useState("");
  const [model, setModel] = useState("");
  const [msg, setMsg] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function loadNext() {
    setSaved(false); setMsg("");
    try {
      const r = await fetch(`${API_BASE}/api/freezers`);
      const j = await r.json();
      setCode(j.nextId ?? "");
    } catch { setMsg("Couldn't reach the server."); }
  }
  useEffect(() => { loadNext(); }, []);

  const valid = code.trim().length > 0;

  async function save() {
    const freezerCode = code.trim().toUpperCase();
    if (!FRZ_RE.test(freezerCode)) { setMsg("Auto IDs use FRZ-YYYY-NNNNNN. For freezers with their own printed serial, just scan them on the Scan tab — no need to pre-create."); return; }
    setBusy(true); setMsg("");
    try {
      const r = await fetch(`${API_BASE}/api/freezers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freezerCode, model: model.trim() || null }),
      });
      const j = await r.json();
      if (r.ok && j.success) setSaved(true);
      else setMsg(j.error || "Save failed.");
    } catch { setMsg("Network error."); }
    finally { setBusy(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View>
          <Eyebrow>FREEZER PDI</Eyebrow>
          <Text style={styles.h1}>QR Labels</Text>
        </View>

        <Card style={{ gap: 4 }}>
          <Muted>Freezer ID</Muted>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              value={code}
              onChangeText={(t) => { setCode(t); setSaved(false); }}
              autoCapitalize="characters"
              style={[styles.input, { flex: 1 }]}
            />
            <TouchableOpacity style={styles.nextBtn} onPress={loadNext}>
              <Text style={styles.nextText}>Next</Text>
            </TouchableOpacity>
          </View>

          <Muted style={{ marginTop: 12 }}>Model (optional)</Muted>
          <TextInput value={model} onChangeText={setModel} placeholder="e.g. CF-300L" placeholderTextColor={C.faint} style={styles.input} />

          <TouchableOpacity style={[styles.primary, busy && { opacity: 0.6 }]} onPress={save} disabled={busy}>
            <Text style={styles.primaryText}>{saved ? "Saved ✓" : busy ? "Saving…" : "Save freezer"}</Text>
          </TouchableOpacity>
          {!!msg && <Text style={styles.warn}>{msg}</Text>}
        </Card>

        {valid && (
          <View style={styles.qrCard}>
            <QRCode value={code.trim().toUpperCase()} size={220} />
            <Text style={styles.qrCode}>{code.trim().toUpperCase()}</Text>
            {!!model && <Text style={styles.qrModel}>{model}</Text>}
            <Muted style={{ marginTop: 10, textAlign: "center", fontSize: 11 }}>
              Screenshot to print, or scan directly on the Scan tab.
            </Muted>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 18, gap: 18 },
  h1: { color: C.text, fontFamily: F.b, fontSize: 24, marginTop: 2 },
  input: { backgroundColor: C.bg, borderColor: C.border, borderWidth: 1, borderRadius: 12, color: C.text, fontFamily: F.m, fontSize: 16, paddingHorizontal: 14, paddingVertical: 12 },
  nextBtn: { borderColor: C.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, justifyContent: "center" },
  nextText: { color: C.text, fontFamily: F.sb },
  primary: { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 14 },
  primaryText: { color: "#04140c", fontFamily: F.b, fontSize: 16 },
  warn: { color: C.amber, fontFamily: F.m, fontSize: 13, marginTop: 8 },
  qrCard: { backgroundColor: C.white, borderRadius: 20, padding: 26, alignItems: "center" },
  qrCode: { color: "#000", fontFamily: F.b, fontSize: 20, marginTop: 16 },
  qrModel: { color: "#444", fontFamily: F.m, fontSize: 13 },
});
