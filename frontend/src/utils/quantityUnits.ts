import type { QuantityUnit } from "../types";

export function formatQuantity(quantity: number, unit: QuantityUnit): string {
  const amount = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${amount} ${unit}${unit === "serving" || unit === "piece" ? (quantity === 1 ? "" : "s") : ""}`;
}

export const QUANTITY_UNITS: { value: QuantityUnit; label: string }[] = [
  { value: "serving", label: "serving" },
  { value: "piece", label: "piece" },
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "l", label: "l" },
  { value: "oz", label: "oz" },
  { value: "lb", label: "lb" },
  { value: "cup", label: "cup" },
  { value: "tbsp", label: "tbsp" },
  { value: "tsp", label: "tsp" },
];
