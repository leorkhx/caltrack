export type UserRole = "user" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  daily_calorie_limit: number;
}

export interface FoodEntry {
  id: number;
  user_id: number;
  food_name: string;
  calories: number;
  consumed_at: string; // ISO datetime
  from_fdc: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminFoodEntry extends FoodEntry {
  user_name: string;
  user_daily_limit: number;
}

export interface PaginatedAdminFoodEntries {
  items: AdminFoodEntry[];
  total: number;
  page: number;
  page_size: number;
}

export interface FoodEntryInput {
  food_name: string;
  calories: number;
  consumed_at: string;
  from_fdc: boolean;
  user_id?: number;
}

export interface FdcSearchResult {
  name: string;
  calories: number;
  meta?: Record<string, unknown>;
}

export interface WeekComparison {
  last_7_days_count: number;
  previous_7_days_count: number;
  last_7_days_from: string;
  last_7_days_to: string;
  previous_7_days_from: string;
  previous_7_days_to: string;
}

export interface UserAverage {
  user_id: number;
  name: string;
  entries_count: number;
  average_daily_calories: number;
}

export interface ReportsData {
  week_comparison: WeekComparison;
  per_user_averages: UserAverage[];
  overall_average_daily_calories: number;
}

export interface ApiFieldError {
  loc: (string | number)[];
  msg: string;
  type: string;
}
