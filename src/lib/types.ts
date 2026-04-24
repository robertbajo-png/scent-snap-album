export type Accord = { name: string; intensity: number };
export type SimilarPerfume = { brand: string; name: string; why: string };

export interface PerfumeData {
  brand: string;
  name: string;
  perfumer?: string;
  year?: number;
  gender?: string;
  description: string;
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
  created_at: string;
  updated_at: string;
}
