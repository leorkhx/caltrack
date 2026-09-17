import { useEffect, useState } from "react";
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
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StarIcon from "@mui/icons-material/Star";
import VerifiedIcon from "@mui/icons-material/Verified";
import AddIcon from "@mui/icons-material/Add";
import { searchFoods } from "../../api/foods";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useFavoriteMutations } from "../../hooks/useFavorites";
import { QUANTITY_UNITS } from "../../utils/quantityUnits";
import type { FavoriteFood, FdcSearchResult, QuantityUnit } from "../../types";

interface FavoriteDialogProps {
  open: boolean;
  onClose: () => void;
  initialFavorite?: FavoriteFood | null;
}

type Step = "search" | "details";

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function toText(value: number | null): string {
  return value === null ? "" : String(value);
}

export function FavoriteDialog({ open, onClose, initialFavorite }: FavoriteDialogProps) {
  const isEdit = Boolean(initialFavorite);
  const { create, update } = useFavoriteMutations();
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<QuantityUnit>("serving");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fromFdc, setFromFdc] = useState(false);
  const [touched, setTouched] = useState(false);

  const [fdcOptions, setFdcOptions] = useState<FdcSearchResult[]>([]);
  const [fdcLoading, setFdcLoading] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 350);

  useEffect(() => {
    if (!open) return;
    if (initialFavorite) {
      setStep("details");
      setName(initialFavorite.food_name);
      setCalories(String(initialFavorite.calories));
      setQuantity(String(initialFavorite.quantity));
      setUnit(initialFavorite.unit);
      setProtein(toText(initialFavorite.protein_g));
      setCarbs(toText(initialFavorite.carbs_g));
      setFat(toText(initialFavorite.fat_g));
      setFromFdc(initialFavorite.from_fdc);
    } else {
      setStep("search");
      setQuery("");
      setName("");
      setCalories("");
      setQuantity("1");
      setUnit("serving");
      setProtein("");
      setCarbs("");
      setFat("");
      setFromFdc(false);
    }
    setTouched(false);
  }, [open, initialFavorite]);

  useEffect(() => {
    let cancelled = false;
    if (debouncedQuery.trim().length < 2) {
      setFdcOptions([]);
      return;
    }
    setFdcLoading(true);
    searchFoods(debouncedQuery)
      .then((results) => {
        if (!cancelled) setFdcOptions(results);
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

  const selectFdcResult = (result: FdcSearchResult) => {
    setName(result.name);
    setCalories(String(result.calories));
    setQuantity("1");
    setUnit("serving");
    setProtein(result.protein_g != null ? String(result.protein_g) : "");
    setCarbs(result.carbs_g != null ? String(result.carbs_g) : "");
    setFat(result.fat_g != null ? String(result.fat_g) : "");
    setFromFdc(true);
    setStep("details");
  };

  const selectManualName = () => {
    setName(query.trim());
    setCalories("");
    setQuantity("1");
    setUnit("serving");
    setProtein("");
    setCarbs("");
    setFat("");
    setFromFdc(false);
    setStep("details");
  };

  const nameError = touched && name.trim().length < 2 ? "Use at least 2 characters." : "";
  const caloriesError =
    touched && (!/^\d+$/.test(calories) || Number(calories) < 1) ? "Enter a positive whole number." : "";
  const quantityError =
    touched && (!/^\d*\.?\d+$/.test(quantity) || Number(quantity) <= 0) ? "Enter a positive number." : "";
  const isInvalid =
    name.trim().length < 2 ||
    !/^\d+$/.test(calories) ||
    Number(calories) < 1 ||
    !/^\d*\.?\d+$/.test(quantity) ||
    Number(quantity) <= 0;
  const mutation = isEdit ? update : create;

  const handleSubmit = async () => {
    setTouched(true);
    if (isInvalid) return;
    const input = {
      food_name: name.trim(),
      calories: Number(calories),
      quantity: Number(quantity),
      unit,
      protein_g: protein === "" ? null : Number(protein),
      carbs_g: carbs === "" ? null : Number(carbs),
      fat_g: fat === "" ? null : Number(fat),
      from_fdc: fromFdc,
    };
    if (isEdit && initialFavorite) {
      await update.mutateAsync({ id: initialFavorite.id, input });
    } else {
      await create.mutateAsync(input);
    }
    onClose();
  };

  const canSearchManually = query.trim().length >= 2;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.75, pb: 1 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "15px",
            bgcolor: "rgba(217,138,15,0.14)",
            color: "#a9690a",
            display: "grid",
            placeItems: "center",
          }}
        >
          <StarIcon />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography fontSize={20} fontWeight={800} letterSpacing={-0.4}>
            {isEdit ? "Edit favorite" : step === "search" ? "Add a favorite" : "Fill in the details"}
          </Typography>
          <Typography fontSize={13} fontWeight={500} color="text.secondary">
            {isEdit
              ? "Update this saved food"
              : step === "search"
                ? "Search for a food, or add one manually"
                : name}
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
              options={fdcOptions}
              loading={fdcLoading}
              filterOptions={(x) => x}
              getOptionLabel={(opt) => (typeof opt === "string" ? opt : `${opt.name} (${opt.calories} kcal)`)}
              inputValue={query}
              onInputChange={(_, value) => setQuery(value)}
              onChange={(_, value) => {
                if (value && typeof value !== "string") selectFdcResult(value);
              }}
              renderOption={(props, option) => {
                if (typeof option === "string") return null;
                return (
                  <li {...props} key={`${option.name}-${option.calories}`}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{ width: "100%" }}>
                      <VerifiedIcon sx={{ fontSize: 15, color: "#0f8f60", flex: "none" }} />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography fontSize={14} fontWeight={600} noWrap>
                          {option.name}
                        </Typography>
                        <Typography fontSize={12} color="text.secondary">
                          {option.calories} kcal
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
                  placeholder="Start typing to search USDA FoodData Central..."
                  helperText="2+ characters searches the FDC database."
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
            <TextField
              label="Food name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={Boolean(nameError)}
              helperText={nameError}
              fullWidth
              autoFocus={!fromFdc}
            />
            <TextField
              label="Calories"
              value={calories}
              onChange={(e) => {
                setCalories(digitsOnly(e.target.value));
                setFromFdc(false);
              }}
              error={Boolean(caloriesError)}
              helperText={caloriesError}
              fullWidth
              autoFocus={fromFdc}
              slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>kcal</Typography> } }}
            />
            <Stack direction="row" gap={1.5}>
              <TextField
                label="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value.replace(/[^\d.]/g, ""))}
                error={Boolean(quantityError)}
                helperText={quantityError}
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
            {mutation.isError && (
              <Alert severity="error" sx={{ borderRadius: "14px" }}>
                Couldn't save that favorite. Please try again.
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
            <Button variant="contained" onClick={handleSubmit} disabled={mutation.isPending || isInvalid}>
              {isEdit ? "Save changes" : "Add favorite"}
            </Button>
          </Stack>
        </Stack>
      )}
    </Dialog>
  );
}
