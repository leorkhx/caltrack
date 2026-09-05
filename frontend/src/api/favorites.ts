import { apiClient } from "./client";
import type { FavoriteFood, FavoriteFoodInput } from "../types";

export async function fetchFavorites(): Promise<FavoriteFood[]> {
  const { data } = await apiClient.get<FavoriteFood[]>("/api/favorites");
  return data;
}

export async function createFavorite(input: FavoriteFoodInput): Promise<FavoriteFood> {
  const { data } = await apiClient.post<FavoriteFood>("/api/favorites", input);
  return data;
}

export async function updateFavorite(id: number, input: Partial<FavoriteFoodInput>): Promise<FavoriteFood> {
  const { data } = await apiClient.patch<FavoriteFood>(`/api/favorites/${id}`, input);
  return data;
}

export async function deleteFavorite(id: number): Promise<void> {
  await apiClient.delete(`/api/favorites/${id}`);
}
