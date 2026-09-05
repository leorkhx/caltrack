export interface DietPreset {
  id: string;
  label: string;
  description: string;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

export const DIET_PRESETS: DietPreset[] = [
  { id: "custom", label: "Custom", description: "Set your own macro grams below", proteinPct: 0, carbsPct: 0, fatPct: 0 },
  { id: "balanced", label: "Balanced", description: "30% protein · 40% carbs · 30% fat", proteinPct: 0.3, carbsPct: 0.4, fatPct: 0.3 },
  { id: "high_protein", label: "High protein", description: "40% protein · 30% carbs · 30% fat", proteinPct: 0.4, carbsPct: 0.3, fatPct: 0.3 },
  { id: "low_carb", label: "Low carb", description: "30% protein · 20% carbs · 50% fat", proteinPct: 0.3, carbsPct: 0.2, fatPct: 0.5 },
  { id: "keto", label: "Keto", description: "25% protein · 5% carbs · 70% fat", proteinPct: 0.25, carbsPct: 0.05, fatPct: 0.7 },
];

const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARBS = 4;
const KCAL_PER_G_FAT = 9;

export function distributeMacros(dailyCalories: number, preset: DietPreset) {
  return {
    protein: Math.round((dailyCalories * preset.proteinPct) / KCAL_PER_G_PROTEIN),
    carbs: Math.round((dailyCalories * preset.carbsPct) / KCAL_PER_G_CARBS),
    fat: Math.round((dailyCalories * preset.fatPct) / KCAL_PER_G_FAT),
  };
}

export function caloriesFromMacros(proteinG: number, carbsG: number, fatG: number): number {
  return proteinG * KCAL_PER_G_PROTEIN + carbsG * KCAL_PER_G_CARBS + fatG * KCAL_PER_G_FAT;
}
