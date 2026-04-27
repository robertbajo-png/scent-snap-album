export type Accord = { name: string; intensity: number };
export type SimilarPerfume = { brand: string; name: string; why: string };

export type Reaction = "like" | "want" | "dislike" | null;

export interface PerfumeData {
  brand: string;
  name: string;
  perfumer?: string;
  year?: number;
  gender?: string;
  description: string;
  plain_description?: string;
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  accords: Accord[];
  longevity: number;
  sillage: number;
  occasions: string[];
  seasons: string[];
  similar_perfumes: SimilarPerfume[];
  confidence: number;
}

export interface ScanRow extends PerfumeData {
  id: string;
  user_id: string;
  image_url: string | null;
  user_rating: number | null;
  user_notes: string | null;
  is_favorite: boolean;
  reaction: Reaction;
  owned: boolean;
  bottle_size: string | null;
  created_at: string;
  updated_at: string;
}

export const REACTION_META: Record<Exclude<Reaction, null>, { label: string; emoji: string; color: string }> = {
  like: { label: "Gillar", emoji: "♡", color: "text-rose-500" },
  want: { label: "Vill ha", emoji: "✦", color: "text-gold" },
  dislike: { label: "Ogillar", emoji: "✕", color: "text-muted-foreground" },
};
