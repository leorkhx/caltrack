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
  return localDateKey(new Date());
}

/** The calendar day a UTC timestamp falls on in the browser's local timezone.
 * Slicing the ISO string instead (e.g. "2026-09-15T04:30:00Z".slice(0, 10))
 * gives the UTC day, which is wrong for anyone not in UTC and misfiles
 * entries logged near midnight into the wrong day. */
function localDateKey(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Converts a "yyyy-mm-dd" date range (the viewer's local calendar days) into
 * full UTC instants spanning local midnight to local end-of-day. The backend
 * has no idea what timezone the viewer is in, so it can't safely turn a bare
 * date into a UTC boundary itself — sending the resolved instant is what lets
 * e.g. a just-created "now" entry reliably fall inside "today"'s range for
 * anyone not in UTC. */
function localRangeToUtc(params: { date_from?: string; date_to?: string }): {
  date_from?: string;
  date_to?: string;
} {
  return {
    date_from: params.date_from ? new Date(`${params.date_from}T00:00:00`).toISOString() : undefined,
    date_to: params.date_to ? new Date(`${params.date_to}T23:59:59.999`).toISOString() : undefined,
  };
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

export { todayIso, localDateKey, localRangeToUtc };
