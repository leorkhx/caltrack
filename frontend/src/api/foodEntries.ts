import { apiClient } from "./client";
import type { FoodEntry, FoodEntryInput } from "../types";

export interface DateRangeParams {
  date_from?: string;
  date_to?: string;
}

export async function fetchMyEntries(params: DateRangeParams = {}): Promise<FoodEntry[]> {
  const { data } = await apiClient.get<FoodEntry[]>("/api/food-entries", { params });
  return data;
}

export async function createMyEntry(input: FoodEntryInput): Promise<FoodEntry> {
  const { data } = await apiClient.post<FoodEntry>("/api/food-entries", input);
  return data;
}

export async function updateMyEntry(id: number, input: Partial<FoodEntryInput>): Promise<FoodEntry> {
  const { data } = await apiClient.put<FoodEntry>(`/api/food-entries/${id}`, input);
  return data;
}

export async function deleteMyEntry(id: number): Promise<void> {
  await apiClient.delete(`/api/food-entries/${id}`);
}
