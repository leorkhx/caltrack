import { apiClient } from "./client";
import type { FdcSearchResult } from "../types";

export async function searchFoods(query: string): Promise<FdcSearchResult[]> {
  if (query.trim().length < 2) return [];
  const { data } = await apiClient.get<{ results: FdcSearchResult[] }>("/api/foods/search", {
    params: { q: query },
  });
  return data.results;
}
