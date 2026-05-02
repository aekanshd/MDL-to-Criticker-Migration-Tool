export interface MDLItem {
  id: string;
  originalTitle: string;
  rating: number; // 1-10
  type?: "movie" | "tv";
}

export interface MatchedItem extends MDLItem {
  imdbId?: string;
  matchedTitle?: string;
  tmdbId?: number;
  status: "pending" | "approved" | "skipped";
  critickerScore: number; // 1-100
  imdbUrl?: string;
  isManualOverride?: boolean;
  isDeleted?: boolean;
}

export interface ExtractionResult {
  title: string;
  rating: number;
}
