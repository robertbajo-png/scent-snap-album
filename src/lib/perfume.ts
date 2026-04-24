import { PerfumeData, ScanRow } from "./types";
import type { Lang } from "./i18n";

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

const INTENSITY_LABELS: Record<Lang, [string, string, string, string, string]> = {
  sv: ["Mycket stark", "Stark", "Måttlig", "Mild", "Svag"],
  en: ["Very strong", "Strong", "Moderate", "Mild", "Weak"],
};

export function intensityLabel(v: number, max = 5, lang: Lang = "sv") {
  const ratio = v / max;
  const labels = INTENSITY_LABELS[lang];
  if (ratio >= 0.9) return labels[0];
  if (ratio >= 0.7) return labels[1];
  if (ratio >= 0.5) return labels[2];
  if (ratio >= 0.3) return labels[3];
  return labels[4];
}

export function formatRelative(iso: string, lang: Lang = "sv") {
  const d = new Date(iso);
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (lang === "en") {
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} d ago`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  if (diff < 60) return "Just nu";
  if (diff < 3600) return `${Math.floor(diff / 60)} min sedan`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h sedan`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} d sedan`;
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}
