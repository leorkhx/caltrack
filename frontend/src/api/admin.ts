import { apiClient } from "./client";
import { localRangeToUtc } from "../utils/validation";
import type { AdminFoodEntry, FoodEntryInput, PaginatedAdminFoodEntries, ReportsData, TopFoodsData, User } from "../types";
import type { DateRangeParams } from "./foodEntries";

export interface AdminListParams extends DateRangeParams {
  user_id?: number;
  cursor?: string;
  page_size?: number;
  search?: string;
  sort?: string;
  day_status?: "over" | "within";
}

export interface AdminStatsParams extends DateRangeParams {
  user_id?: number;
}

export interface AdminDayStats {
  avg_per_logged_day: number;
  days_over_limit: number;
  active_users: number;
  since: string | null;
}

export async function fetchEntryStats(params: AdminStatsParams = {}): Promise<AdminDayStats> {
  const { data } = await apiClient.get<AdminDayStats>("/api/admin/food-entries/stats", {
    params: { ...params, ...localRangeToUtc(params) },
  });
  return data;
}

export async function fetchAllUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>("/api/admin/users");
  return data;
}

export async function fetchAllEntries(params: AdminListParams = {}): Promise<PaginatedAdminFoodEntries> {
  const { data } = await apiClient.get<PaginatedAdminFoodEntries>("/api/admin/food-entries", {
    params: { ...params, ...localRangeToUtc(params) },
  });
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
  user_id?: number;
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

export interface TotalCaloriesParams extends DateRangeParams {
  user_id: number;
}

export async function fetchTotalCalories(params: TotalCaloriesParams): Promise<{ total_calories: number }> {
  const { data } = await apiClient.get<{ total_calories: number }>("/api/admin/food-entries/total-calories", {
    params: { ...params, ...localRangeToUtc(params) },
  });
  return data;
}
