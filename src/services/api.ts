import axios from "axios";
import { MatchedItem } from "../types";

export const extractPdf = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("pdf", file);
  const response = await axios.post("/api/extract-pdf", formData);
  return response.data.text;
};

export const searchTMDB = async (title: string) => {
  const response = await axios.get("/api/tmdb/search", { params: { query: title } });
  return response.data.results;
};

export const getExternalIds = async (id: number, type: string) => {
  const response = await axios.get("/api/tmdb/external-ids", { params: { id, type } });
  return response.data;
};

export const getTitleByImdbId = async (imdbId: string) => {
  const response = await axios.get("/api/tmdb/find-by-imdb", { params: { imdbId } });
  return response.data;
};

export const matchItems = async (items: { originalTitle: string; rating: number }[]): Promise<MatchedItem[]> => {
  const matched: MatchedItem[] = [];

  for (const item of items) {
    try {
      const searchResults = await searchTMDB(item.originalTitle);
      const topMatch = searchResults[0];

      let imdbId = undefined;
      let matchedTitle = undefined;
      let tmdbId = undefined;

      if (topMatch) {
        const extIds = await getExternalIds(topMatch.id, topMatch.media_type);
        imdbId = extIds.imdb_id;
        matchedTitle = topMatch.title || topMatch.name;
        tmdbId = topMatch.id;
      }

      matched.push({
        id: Math.random().toString(36).substr(2, 9),
        originalTitle: item.originalTitle,
        rating: item.rating,
        imdbId,
        matchedTitle,
        tmdbId,
        status: "pending",
        critickerScore: Math.round(item.rating * 10),
        imdbUrl: imdbId ? `https://www.imdb.com/title/${imdbId}/` : undefined,
      });
    } catch (err) {
      console.error(`Failed to match ${item.originalTitle}:`, err);
      matched.push({
        id: Math.random().toString(36).substr(2, 9),
        originalTitle: item.originalTitle,
        rating: item.rating,
        status: "pending",
        critickerScore: Math.round(item.rating * 10),
      });
    }
  }

  return matched;
};
