import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import dayjs, { type Dayjs } from "dayjs";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { searchFoods } from "../api/foods";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useFavorites, useFavoriteMutations } from "../hooks/useFavorites";
import { validateEntryForm, hasErrors, type EntryFormErrors } from "../utils/validation";
import { QUANTITY_UNITS } from "../utils/quantityUnits";
import type { FoodEntry, FoodEntryInput, FoodSuggestion, MealType, QuantityUnit, User } from "../types";

interface EntryDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: FoodEntryInput) => Promise<void>;
  isAdmin: boolean;
  users?: User[];
  currentUserId: number;
  initialEntry?: FoodEntry | null;
  getUserLimit: (userId: number) => number;
  computeExistingTotal: (userId: number, dateIso: string, excludeEntryId: number | null) => number;
}

type Step = "search" | "details";

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}
function toTimeInput(iso: string): string {
  const d = new Date(iso);
  return d.toTimeString().slice(0, 5);
}
function nowDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}
function defaultMealType(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 18) return "snack";
  return "dinner";
}
function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export function EntryDialog({
  open,
  onClose,
  onSave,
  isAdmin,
  users = [],
  currentUserId,
  initialEntry,
  getUserLimit,
  computeExistingTotal,
}: EntryDialogProps) {
  const isEdit = Boolean(initialEntry);

  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [userId, setUserId] = useState<number>(currentUserId);
  const [foodName, setFoodName] = useState("");
  const [caloriesText, setCaloriesText] = useState("");
  const [quantityText, setQuantityText] = useState("1");
  const [unit, setUnit] = useState<QuantityUnit>("serving");
  const [mealType, setMealType] = useState<MealType>("snack");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [date, setDate] = useState(nowDate());
  const [time, setTime] = useState(nowTime());
  const [fromFdc, setFromFdc] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [fdcOptions, setFdcOptions] = useState<FoodSuggestion[]>([]);
  const [fdcLoading, setFdcLoading] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 350);

  const { data: favorites = [] } = useFavorites();
  const { create: createFavorite } = useFavoriteMutations();
  const matchingFavoriteId = favorites.find(
    (f) => f.food_name.toLowerCase() === foodName.trim().toLowerCase()
  )?.id;

  useEffect(() => {
    if (!open) return;
    if (initialEntry) {
      setStep("details");
      setUserId(initialEntry.user_id);
      setFoodName(initialEntry.food_name);
      setCaloriesText(String(initialEntry.calories));
      setQuantityText(String(initialEntry.quantity));
      setUnit(initialEntry.unit);
      setMealType(initialEntry.meal_type);
      setProtein(initialEntry.protein_g === null ? "" : String(initialEntry.protein_g));
      setCarbs(initialEntry.carbs_g === null ? "" : String(initialEntry.carbs_g));
      setFat(initialEntry.fat_g === null ? "" : String(initialEntry.fat_g));
      setDate(toDateInput(initialEntry.consumed_at));
      setTime(toTimeInput(initialEntry.consumed_at));
      setFromFdc(initialEntry.from_fdc);
    } else {
      setStep("search");
      setQuery("");
      setUserId(currentUserId);
      setFoodName("");
      setCaloriesText("");
      setQuantityText("1");
      setUnit("serving");
      setMealType(defaultMealType());
      setProtein("");
      setCarbs("");
      setFat("");
      setDate(nowDate());
      setTime(nowTime());
      setFromFdc(false);
    }
    setTouched(false);
    setServerError(null);
  }, [open, initialEntry, currentUserId]);

  useEffect(() => {
    let cancelled = false;
    if (debouncedQuery.trim().length < 2) {
      setFdcOptions([]);
      return;
    }
    setFdcLoading(true);
    searchFoods(debouncedQuery)
      .then((results) => {
        if (!cancelled) {
          setFdcOptions(
            results.map((r) => ({
              source: "fdc" as const,
              name: r.name,
              calories: r.calories,
              protein_g: r.protein_g,
              carbs_g: r.carbs_g,
              fat_g: r.fat_g,
            }))
          );
        }
      })
      .catch(() => {
        if (!cancelled) setFdcOptions([]);
      })
      .finally(() => {
        if (!cancelled) setFdcLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const combinedOptions: FoodSuggestion[] = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const favoriteMatches: FoodSuggestion[] =
      q.length < 2
        ? []
        : favorites
            .filter((f) => f.food_name.toLowerCase().includes(q))
            .map((f) => ({
              source: "favorite" as const,
              name: f.food_name,
              calories: f.calories,
              protein_g: f.protein_g,
              carbs_g: f.carbs_g,
              fat_g: f.fat_g,
              favoriteId: f.id,
            }));
    // Favorites first — the user already vetted these, no need to re-guess among FDC's per-100g vs per-serving values.
    return [...favoriteMatches, ...fdcOptions];
  }, [debouncedQuery, favorites, fdcOptions]);

  const selectSuggestion = (value: FoodSuggestion) => {
    setFoodName(value.name);
    setCaloriesText(String(value.calories));
    setQuantityText("1");
    setUnit("serving");
    setProtein(value.protein_g != null ? String(value.protein_g) : "");
    setCarbs(value.carbs_g != null ? String(value.carbs_g) : "");
    setFat(value.fat_g != null ? String(value.fat_g) : "");
    setFromFdc(value.source === "fdc");
    setStep("details");
  };

  const selectManualName = () => {
    setFoodName(query.trim());
    setCaloriesText("");
    setQuantityText("1");
    setUnit("serving");
    setProtein("");
    setCarbs("");
    setFat("");
    setFromFdc(false);
    setStep("details");
  };

  const errors: EntryFormErrors = useMemo(
    () => validateEntryForm({ foodName, caloriesText, quantityText, date, time }),
    [foodName, caloriesText, quantityText, date, time]
  );

  const limit = getUserLimit(userId);
  const projectedTotal = useMemo(() => {
    const existing = computeExistingTotal(userId, date, initialEntry ? initialEntry.id : null);
    const cal = Number(caloriesText) || 0;
    return existing + cal;
  }, [userId, date, caloriesText, initialEntry, computeExistingTotal]);
  const willExceedLimit = caloriesText !== "" && !errors.calories && projectedTotal > limit;
  const canSearchManually = query.trim().length >= 2;

  const handleSubmit = async () => {
    setTouched(true);
    if (hasErrors(errors)) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const consumedAt = new Date(`${date}T${time}:00`);
      const input: FoodEntryInput = {
        food_name: foodName.trim(),
        calories: Number(caloriesText),
        quantity: Number(quantityText),
        unit,
        meal_type: mealType,
        protein_g: protein === "" ? null : Number(protein),
        carbs_g: carbs === "" ? null : Number(carbs),
        fat_g: fat === "" ? null : Number(fat),
        consumed_at: consumedAt.toISOString(),
        from_fdc: fromFdc,
        ...(isAdmin ? { user_id: userId } : {}),
      };
      await onSave(input);
      onClose();
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { detail?: unknown } } };
      const detail = anyErr?.response?.data?.detail;
      if (typeof detail === "string") {
        setServerError(detail);
      } else if (Array.isArray(detail)) {
        setServerError(detail.map((d: { msg?: string }) => d.msg).join(" "));
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.75, pb: 1 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "15px",
            background: "linear-gradient(180deg, #6f6ff0 0%, #4f4fd0 100%)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
          }}
        >
          <RestaurantMenuIcon />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography fontSize={20} fontWeight={800} letterSpacing={-0.4}>
            {isEdit ? "Edit entry" : step === "search" ? "Log food" : "Fill in the details"}
          </Typography>
          <Typography fontSize={13} fontWeight={500} color="text.secondary">
            {isEdit ? "Update this food entry" : step === "search" ? "Search your favorites or USDA FoodData Central" : foodName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {step === "search" ? (
          <Stack gap={1.5} sx={{ pt: 0.5 }}>
            <Autocomplete
              freeSolo
              options={combinedOptions}
              loading={fdcLoading}
              filterOptions={(x) => x}
              getOptionLabel={(opt) => (typeof opt === "string" ? opt : `${opt.name} (${opt.calories} kcal)`)}
              inputValue={query}
              onInputChange={(_, value) => setQuery(value)}
              onChange={(_, value) => {
                if (value && typeof value !== "string") selectSuggestion(value);
              }}
              renderOption={(props, option) => {
                if (typeof option === "string") return null;
                const isFavorite = option.source === "favorite";
                return (
                  <li {...props} key={`${option.source}-${option.name}-${option.calories}`}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{ width: "100%" }}>
                      {isFavorite ? (
                        <StarIcon sx={{ fontSize: 16, color: "#d98a0f", flex: "none" }} />
                      ) : (
                        <StarBorderIcon sx={{ fontSize: 16, color: "transparent", flex: "none" }} />
                      )}
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography fontSize={14} fontWeight={600} noWrap>
                          {option.name}
                        </Typography>
                        <Typography fontSize={12} color="text.secondary">
                          {option.calories} kcal{isFavorite ? " · favorite" : ""}
                        </Typography>
                      </Box>
                    </Stack>
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Food name"
                  placeholder="Start typing to search your favorites or USDA FoodData Central..."
                  helperText="2+ characters triggers autocomplete."
                  autoFocus
                />
              )}
            />
            {canSearchManually && (
              <Button
                onClick={selectManualName}
                startIcon={<AddIcon />}
                sx={{ justifyContent: "flex-start", alignSelf: "flex-start", textTransform: "none", fontWeight: 600 }}
              >
                Can't find it? Add "{query.trim()}" manually
              </Button>
            )}
          </Stack>
        ) : (
          <Stack gap={2} sx={{ pt: 0.5 }}>
            {isAdmin && (
              <TextField
                select
                label="User"
                value={userId}
                onChange={(e) => setUserId(Number(e.target.value))}
                fullWidth
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <Stack direction="row" gap={1.5}>
              <DatePicker
                label="Date"
                value={dayjs(date)}
                onChange={(value: Dayjs | null) => value && setDate(value.format("YYYY-MM-DD"))}
                maxDate={dayjs()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: touched && Boolean(errors.date),
                    helperText: touched && errors.date,
                  },
                }}
              />
              <MobileTimePicker
                label="Time"
                value={dayjs(`${date}T${time}`)}
                onChange={(value: Dayjs | null) => value && setTime(value.format("HH:mm"))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Stack>

            <TextField select label="Meal" value={mealType} onChange={(e) => setMealType(e.target.value as MealType)} fullWidth>
              {MEAL_TYPES.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Food name"
              value={foodName}
              onChange={(e) => {
                setFoodName(e.target.value);
                setFromFdc(false);
              }}
              error={touched && Boolean(errors.foodName)}
              helperText={touched && errors.foodName}
              fullWidth
              autoFocus={!fromFdc}
              slotProps={{
                input: {
                  endAdornment: foodName.trim().length >= 2 && (
                    <Tooltip title={matchingFavoriteId ? "Saved in favorites" : "Save as favorite"}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={Boolean(matchingFavoriteId) || !caloriesText || createFavorite.isPending}
                          onClick={() =>
                            createFavorite.mutate({
                              food_name: foodName.trim(),
                              calories: Number(caloriesText) || 0,
                              quantity: Number(quantityText) || 1,
                              unit,
                              protein_g: protein === "" ? null : Number(protein),
                              carbs_g: carbs === "" ? null : Number(carbs),
                              fat_g: fat === "" ? null : Number(fat),
                              from_fdc: fromFdc,
                            })
                          }
                        >
                          {matchingFavoriteId ? (
                            <StarIcon sx={{ fontSize: 20, color: "#d98a0f" }} />
                          ) : (
                            <StarBorderIcon sx={{ fontSize: 20 }} />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  ),
                },
              }}
            />

            <TextField
              label="Calories (kcal)"
              value={caloriesText}
              onChange={(e) => {
                setCaloriesText(e.target.value.replace(/[^\d]/g, ""));
                setFromFdc(false);
              }}
              error={touched && Boolean(errors.calories)}
              helperText={touched && errors.calories}
              fullWidth
              autoFocus={fromFdc}
            />

            <Stack direction="row" gap={1.5}>
              <TextField
                label="Quantity"
                value={quantityText}
                onChange={(e) => setQuantityText(e.target.value.replace(/[^\d.]/g, ""))}
                error={touched && Boolean(errors.quantity)}
                helperText={touched && errors.quantity}
                sx={{ flex: 1 }}
              />
              <TextField
                select
                label="Unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as QuantityUnit)}
                sx={{ flex: 1 }}
              >
                {QUANTITY_UNITS.map((u) => (
                  <MenuItem key={u.value} value={u.value}>
                    {u.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack direction="row" gap={1.5}>
              <TextField
                label="Protein"
                value={protein}
                onChange={(e) => setProtein(digitsOnly(e.target.value))}
                placeholder="optional"
                sx={{ flex: 1 }}
                slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>g</Typography> } }}
              />
              <TextField
                label="Carbs"
                value={carbs}
                onChange={(e) => setCarbs(digitsOnly(e.target.value))}
                placeholder="optional"
                sx={{ flex: 1 }}
                slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>g</Typography> } }}
              />
              <TextField
                label="Fat"
                value={fat}
                onChange={(e) => setFat(digitsOnly(e.target.value))}
                placeholder="optional"
                sx={{ flex: 1 }}
                slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>g</Typography> } }}
              />
            </Stack>

            {willExceedLimit && (
              <Alert severity="warning" sx={{ borderRadius: "14px" }}>
                This will bring the day's total to <strong>{projectedTotal} kcal</strong>, over the{" "}
                {limit} kcal daily limit.
              </Alert>
            )}

            {serverError && (
              <Alert severity="error" sx={{ borderRadius: "14px" }}>
                {serverError}
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>
      {step === "details" && (
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ p: 3, pt: 1 }}>
          {!isEdit && (
            <Button onClick={() => setStep("search")} color="inherit" startIcon={<ArrowBackIcon fontSize="small" />}>
              Back
            </Button>
          )}
          <Stack direction="row" gap={1.5} sx={{ ml: "auto" }}>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
              {isEdit ? "Save changes" : "Add entry"}
            </Button>
          </Stack>
        </Stack>
      )}
    </Dialog>
  );
}
