import { PerfumeData, ScanRow } from "./types";

const PERFUME_FIELDS = [
  "brand", "name", "perfumer", "year", "gender", "description",
  "top_notes", "heart_notes", "base_notes", "accords",
  "longevity", "sillage", "occasions", "seasons", "similar_perfumes", "confidence",
] as const;

export function pickPerfumeFields(scan: ScanRow): PerfumeData {
  const out: any = {};
  for (const f of PERFUME_FIELDS) out[f] = (scan as any)[f];
  return out as PerfumeData;
}

export function intensityLabel(v: number, max = 5) {
  const ratio = v / max;
  if (ratio >= 0.9) return "Mycket stark";
  if (ratio >= 0.7) return "Stark";
  if (ratio >= 0.5) return "Måttlig";
  if (ratio >= 0.3) return "Mild";
  return "Svag";
}

export function formatRelative(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (diff < 60) return "Just nu";
  if (diff < 3600) return `${Math.floor(diff / 60)} min sedan`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h sedan`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} d sedan`;
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}
