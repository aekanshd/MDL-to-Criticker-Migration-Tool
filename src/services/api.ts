import axios from "axios";
import { MatchedItem } from "../types";

export const searchTMDB = async (title: string, apiToken?: string) => {
  const headers: Record<string, string> = {};
  if (apiToken) headers["X-TMDB-Token"] = apiToken;
  const response = await axios.get("/api/tmdb/search", { 
    params: { query: title },
    headers
  });
  return response.data.results;
};

export const getExternalIds = async (id: number, type: string, apiToken?: string) => {
  const headers: Record<string, string> = {};
  if (apiToken) headers["X-TMDB-Token"] = apiToken;
  const response = await axios.get("/api/tmdb/external-ids", { 
    params: { id, type },
    headers
  });
  return response.data;
};

export const getTitleByImdbId = async (imdbId: string, apiToken?: string) => {
  const headers: Record<string, string> = {};
  if (apiToken) headers["X-TMDB-Token"] = apiToken;
  const response = await axios.get("/api/tmdb/find-by-imdb", { 
    params: { imdbId },
    headers
  });
  return response.data;
};

export const matchItems = async (items: { originalTitle: string; rating: number }[], apiToken?: string): Promise<MatchedItem[]> => {
  const matched: MatchedItem[] = [];

  for (const item of items) {
    try {
      const searchResults = await searchTMDB(item.originalTitle, apiToken);
      const topMatch = searchResults[0];

      let imdbId = undefined;
      let matchedTitle = undefined;
      let tmdbId = undefined;

      if (topMatch) {
        const extIds = await getExternalIds(topMatch.id, topMatch.media_type, apiToken);
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
