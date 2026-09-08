import { apiClient } from "./client";
import type { AdminFoodEntry, FoodEntryInput, PaginatedAdminFoodEntries, ReportsData, TopFoodsData, User } from "../types";
import type { DateRangeParams } from "./foodEntries";

export interface AdminListParams extends DateRangeParams {
  user_id?: number;
  page?: number;
  page_size?: number;
}

export async function fetchAllUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>("/api/admin/users");
  return data;
}

export async function fetchAllEntries(params: AdminListParams = {}): Promise<PaginatedAdminFoodEntries> {
  const { data } = await apiClient.get<PaginatedAdminFoodEntries>("/api/admin/food-entries", { params });
  return data;
}

export async function createEntryAsAdmin(input: FoodEntryInput): Promise<AdminFoodEntry> {
  const { data } = await apiClient.post<AdminFoodEntry>("/api/admin/food-entries", input);
  return data;
}

export async function updateEntryAsAdmin(id: number, input: Partial<FoodEntryInput>): Promise<AdminFoodEntry> {
  const { data } = await apiClient.put<AdminFoodEntry>(`/api/admin/food-entries/${id}`, input);
  return data;
}

export async function deleteEntryAsAdmin(id: number): Promise<void> {
  await apiClient.delete(`/api/admin/food-entries/${id}`);
}

export interface ReportsParams {
  days?: number;
  all?: boolean;
}

export async function fetchReports(params: ReportsParams = {}): Promise<ReportsData> {
  const { data } = await apiClient.get<ReportsData>("/api/admin/reports", { params });
  return data;
}

export interface TopFoodsParams {
  days?: number;
  all?: boolean;
  page?: number;
  page_size?: number;
}

export async function fetchTopFoods(params: TopFoodsParams = {}): Promise<TopFoodsData> {
  const { data } = await apiClient.get<TopFoodsData>("/api/admin/foods/top", { params });
  return data;
}
