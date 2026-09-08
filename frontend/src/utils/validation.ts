export const MIN_NAME_LEN = 2;
export const MAX_CALORIES = 5000;

export interface EntryFormValues {
  foodName: string;
  caloriesText: string;
  quantityText: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
}

export interface EntryFormErrors {
  foodName?: string;
  calories?: string;
  quantity?: string;
  date?: string;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Mirrors the backend's Pydantic validation rules so users get instant
 * feedback client-side, while the server still re-validates everything. */
export function validateEntryForm(values: EntryFormValues): EntryFormErrors {
  const errors: EntryFormErrors = {};

  const name = values.foodName.trim();
  if (!name) {
    errors.foodName = "Food name is required.";
  } else if (name.length < MIN_NAME_LEN) {
    errors.foodName = `Use at least ${MIN_NAME_LEN} characters.`;
  }

  if (values.caloriesText === "" || values.caloriesText === undefined) {
    errors.calories = "Calorie value is required.";
  } else if (!/^\d+$/.test(values.caloriesText)) {
    errors.calories = "Whole numbers only.";
  } else {
    const cal = Number(values.caloriesText);
    if (cal < 1) errors.calories = "Must be greater than 0.";
    else if (cal > MAX_CALORIES) errors.calories = `Must be ${MAX_CALORIES} kcal or less.`;
  }

  if (values.quantityText === "" || values.quantityText === undefined) {
    errors.quantity = "Quantity is required.";
  } else if (!/^\d*\.?\d+$/.test(values.quantityText) || Number(values.quantityText) <= 0) {
    errors.quantity = "Enter a positive number.";
  }

  if (!values.date) {
    errors.date = "Date is required.";
  } else {
    const combined = `${values.date}T${values.time || "00:00"}`;
    const chosen = new Date(combined);
    const now = new Date();
    if (chosen.getTime() - now.getTime() > 60_000) {
      errors.date = "Date/time cannot be in the future.";
    }
  }

  return errors;
}

export function hasErrors(errors: EntryFormErrors): boolean {
  return Boolean(errors.foodName || errors.calories || errors.quantity || errors.date);
}

export { todayIso };
