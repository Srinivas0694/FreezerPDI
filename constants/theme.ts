// constants/theme.ts
export const C = {
  bg: "#020617",
  card: "#0f172a",
  card2: "#131c2b",
  border: "#1e293b",
  text: "#e2e8f0",
  sub: "#94a3b8",
  faint: "#64748b",
  accent: "#34d399",
  accentDim: "#065f46",
  green: "#34d399",
  amber: "#fbbf24",
  red: "#f87171",
  white: "#ffffff",
};

export const F = {
  r: "Poppins_400Regular",
  m: "Poppins_500Medium",
  sb: "Poppins_600SemiBold",
  b: "Poppins_700Bold",
  xb: "Poppins_800ExtraBold",
};

// status -> color
export function statusColor(s?: string) {
  switch ((s ?? "").toUpperCase()) {
    case "PASS":
    case "SAFE":
      return C.green;
    case "WARN":
    case "WARNING":
      return C.amber;
    case "FAIL":
    case "LEAK":
      return C.red;
    default:
      return C.faint;
  }
}
