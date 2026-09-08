// components/ui.tsx
import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { C, F, statusColor } from "../constants/theme";

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function H1({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h1}>{children}</Text>;
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}
export function Muted({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export function Pill({ label, status }: { label: string; status?: string }) {
  const col = statusColor(status ?? label);
  return (
    <View style={[styles.pill, { borderColor: col + "66", backgroundColor: col + "1a" }]}>
      <Text style={[styles.pillText, { color: col }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  h1: { color: C.text, fontFamily: F.b, fontSize: 24 },
  eyebrow: { color: C.accent, fontFamily: F.b, fontSize: 11, letterSpacing: 3 },
  muted: { color: C.sub, fontFamily: F.r, fontSize: 13 },
  pill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" },
  pillText: { fontFamily: F.b, fontSize: 12 },
});
