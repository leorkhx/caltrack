export type UserRole = "user" | "admin";
export type BiologicalSex = "male" | "female";
export type ActivityLevel = "sedentary" | "lightly_active" | "light" | "moderate" | "active" | "very_active";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  daily_calorie_limit: number;
  protein_target_g: number | null;
  carbs_target_g: number | null;
  fat_target_g: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  sex: BiologicalSex | null;
  activity_level: ActivityLevel | null;
  basal_metabolic_rate_kcal: number | null;
  maintenance_calories_kcal: number | null;
}

export interface UserSettingsInput {
  daily_calorie_limit?: number;
  protein_target_g?: number | null;
  carbs_target_g?: number | null;
  fat_target_g?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  age?: number | null;
  sex?: BiologicalSex | null;
  activity_level?: ActivityLevel | null;
}

export interface FoodEntry {
  id: number;
  user_id: number;
  food_name: string;
  calories: number;
  meal_type: MealType;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  consumed_at: string; // ISO datetime
  from_fdc: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminFoodEntry extends FoodEntry {
  user_name: string;
  user_daily_limit: number;
  day_total: number;
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
  meal_type: MealType;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  consumed_at: string;
  from_fdc: boolean;
  user_id?: number;
}

export interface FdcSearchResult {
  name: string;
  calories: number;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  meta?: Record<string, unknown>;
}

export interface FavoriteFood {
  id: number;
  food_name: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  from_fdc: boolean;
  created_at: string;
}

export interface FavoriteFoodInput {
  food_name: string;
  calories: number;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  from_fdc?: boolean;
}

/** A single autocomplete suggestion in the food-name search, tagged by
 * source so the UI can badge favorites separately from live FDC results. */
export interface FoodSuggestion {
  source: "favorite" | "fdc";
  name: string;
  calories: number;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  favoriteId?: number;
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
