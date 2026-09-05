import { useState } from "react";
import { Alert, Box, Button, Card, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { useUpdateMe } from "../../hooks/useUpdateMe";
import { DIET_PRESETS, distributeMacros } from "./dietPresets";
import { MacroBar } from "./MacroBar";
import type { BiologicalSex, User } from "../../types";

const MIN_LIMIT = 800;
const MAX_LIMIT = 10000;
const MAX_MACRO = 1000;
const MIN_HEIGHT = 100;
const MAX_HEIGHT = 250;
const MIN_WEIGHT = 30;
const MAX_WEIGHT = 300;
const MIN_AGE = 10;
const MAX_AGE = 120;

interface SettingsPageProps {
  currentUser: User;
}

function toText(value: number | null): string {
  return value === null ? "" : String(value);
}

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export function SettingsPage({ currentUser }: SettingsPageProps) {
  const [dailyLimit, setDailyLimit] = useState(toText(currentUser.daily_calorie_limit));
  const [dietPreset, setDietPreset] = useState("custom");
  const [protein, setProtein] = useState(toText(currentUser.protein_target_g));
  const [carbs, setCarbs] = useState(toText(currentUser.carbs_target_g));
  const [fat, setFat] = useState(toText(currentUser.fat_target_g));
  const [height, setHeight] = useState(toText(currentUser.height_cm));
  const [weight, setWeight] = useState(toText(currentUser.weight_kg));
  const [age, setAge] = useState(toText(currentUser.age));
  const [sex, setSex] = useState<BiologicalSex | "">(currentUser.sex ?? "");
  const [touched, setTouched] = useState(false);
  const { mutate, isPending, isSuccess, error, reset } = useUpdateMe();

  const limitNum = Number(dailyLimit);
  const limitError =
    dailyLimit === ""
      ? "Required."
      : !/^\d+$/.test(dailyLimit) || limitNum < MIN_LIMIT || limitNum > MAX_LIMIT
        ? `Must be between ${MIN_LIMIT} and ${MAX_LIMIT} kcal.`
        : "";

  const macroError = (value: string) =>
    value === "" ? "" : !/^\d+$/.test(value) || Number(value) > MAX_MACRO ? `0–${MAX_MACRO}g.` : "";
  const proteinError = macroError(protein);
  const carbsError = macroError(carbs);
  const fatError = macroError(fat);

  const rangeError = (value: string, min: number, max: number, unit: string) =>
    value === "" ? "" : Number(value) < min || Number(value) > max ? `${min}–${max}${unit}.` : "";
  const heightError = rangeError(height, MIN_HEIGHT, MAX_HEIGHT, "cm");
  const weightError = rangeError(weight, MIN_WEIGHT, MAX_WEIGHT, "kg");
  const ageError = rangeError(age, MIN_AGE, MAX_AGE, "y");

  const hasErrors = Boolean(
    limitError || proteinError || carbsError || fatError || heightError || weightError || ageError
  );

  const isDirty =
    dailyLimit !== toText(currentUser.daily_calorie_limit) ||
    protein !== toText(currentUser.protein_target_g) ||
    carbs !== toText(currentUser.carbs_target_g) ||
    fat !== toText(currentUser.fat_target_g) ||
    height !== toText(currentUser.height_cm) ||
    weight !== toText(currentUser.weight_kg) ||
    age !== toText(currentUser.age) ||
    sex !== (currentUser.sex ?? "");

  const applyPreset = (presetId: string) => {
    setDietPreset(presetId);
    const preset = DIET_PRESETS.find((p) => p.id === presetId);
    if (!preset || preset.id === "custom") return;
    const base = /^\d+$/.test(dailyLimit) ? Number(dailyLimit) : currentUser.daily_calorie_limit;
    const macros = distributeMacros(base, preset);
    setProtein(String(macros.protein));
    setCarbs(String(macros.carbs));
    setFat(String(macros.fat));
  };

  const canComputeBmr = height !== "" && weight !== "" && age !== "" && sex !== "";
  const previewBmr = canComputeBmr
    ? Math.round(
        10 * Number(weight) +
          6.25 * Number(height) -
          5 * Number(age) +
          (sex === "male" ? 5 : -161)
      )
    : null;

  const handleSave = () => {
    setTouched(true);
    if (hasErrors) return;
    reset();
    mutate({
      daily_calorie_limit: limitNum,
      protein_target_g: protein === "" ? null : Number(protein),
      carbs_target_g: carbs === "" ? null : Number(carbs),
      fat_target_g: fat === "" ? null : Number(fat),
      height_cm: height === "" ? null : Number(height),
      weight_kg: weight === "" ? null : Number(weight),
      age: age === "" ? null : Number(age),
      sex: sex === "" ? null : sex,
    });
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={1.25} sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: "14px",
            bgcolor: "rgba(79,79,208,0.1)",
            color: "primary.main",
            display: "grid",
            placeItems: "center",
          }}
        >
          <SettingsIcon />
        </Box>
        <Box>
          <Typography fontSize={26} fontWeight={800} letterSpacing={-0.6}>
            Settings
          </Typography>
          <Typography fontSize={13.5} color="text.secondary">
            Your daily calorie limit, macro targets, and body metrics
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Card sx={{ p: 3 }}>
          <Typography fontWeight={700} fontSize={16} sx={{ mb: 2 }}>
            Calorie & macro targets
          </Typography>
          <Stack direction="row" gap={4} flexWrap={{ xs: "wrap", 1025: "nowrap" }}>
            <Stack gap={2.5} sx={{ flex: "1 1 320px" }}>
              <TextField
                label="Daily calorie limit"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(digitsOnly(e.target.value))}
                error={touched && Boolean(limitError)}
                helperText={(touched && limitError) || "We'll flag any day you go over this. Default is 2100 kcal."}
                fullWidth
                slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>kcal</Typography> } }}
              />

              <TextField select label="Diet type" value={dietPreset} onChange={(e) => applyPreset(e.target.value)} fullWidth>
                {DIET_PRESETS.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    <Box>
                      <Typography fontSize={14}>{p.label}</Typography>
                      {p.id !== "custom" && (
                        <Typography fontSize={11.5} color="text.secondary">
                          {p.description}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>

              <Box>
                <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
                  <Typography fontWeight={700} fontSize={14}>
                    Macro targets
                  </Typography>
                  <Chip label="optional" size="small" sx={{ fontSize: 11, height: 20 }} />
                </Stack>
                <Stack direction="row" gap={1.5} flexWrap="wrap">
                  <TextField
                    label="Protein"
                    value={protein}
                    onChange={(e) => {
                      setProtein(digitsOnly(e.target.value));
                      setDietPreset("custom");
                    }}
                    error={touched && Boolean(proteinError)}
                    helperText={touched && proteinError}
                    sx={{ flex: "1 1 120px" }}
                    slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>g</Typography> } }}
                  />
                  <TextField
                    label="Carbs"
                    value={carbs}
                    onChange={(e) => {
                      setCarbs(digitsOnly(e.target.value));
                      setDietPreset("custom");
                    }}
                    error={touched && Boolean(carbsError)}
                    helperText={touched && carbsError}
                    sx={{ flex: "1 1 120px" }}
                    slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>g</Typography> } }}
                  />
                  <TextField
                    label="Fat"
                    value={fat}
                    onChange={(e) => {
                      setFat(digitsOnly(e.target.value));
                      setDietPreset("custom");
                    }}
                    error={touched && Boolean(fatError)}
                    helperText={touched && fatError}
                    sx={{ flex: "1 1 120px" }}
                    slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>g</Typography> } }}
                  />
                </Stack>
              </Box>
            </Stack>

            <Box sx={{ flex: "1 1 280px", pt: { sm: 0.5 }, display: "flex", alignSelf: "stretch", height: "auto" }}>
              <MacroBar
                proteinG={Number(protein) || 0}
                carbsG={Number(carbs) || 0}
                fatG={Number(fat) || 0}
                dailyCalorieLimit={limitNum || currentUser.daily_calorie_limit}
              />
            </Box>
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography fontWeight={700} fontSize={16} sx={{ mb: 2 }}>
            Body metrics
          </Typography>
          <Stack gap={2.5}>
            <Stack direction="row" gap={1.5} flexWrap="wrap">
              <TextField
                label="Height"
                value={height}
                onChange={(e) => setHeight(digitsOnly(e.target.value))}
                error={touched && Boolean(heightError)}
                helperText={touched && heightError}
                sx={{ flex: "1 1 140px" }}
                slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>cm</Typography> } }}
              />
              <TextField
                label="Weight"
                value={weight}
                onChange={(e) => setWeight(digitsOnly(e.target.value))}
                error={touched && Boolean(weightError)}
                helperText={touched && weightError}
                sx={{ flex: "1 1 140px" }}
                slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>kg</Typography> } }}
              />
            </Stack>
            <Stack direction="row" gap={1.5} flexWrap="wrap">
              <TextField
                label="Age"
                value={age}
                onChange={(e) => setAge(digitsOnly(e.target.value))}
                error={touched && Boolean(ageError)}
                helperText={touched && ageError}
                sx={{ flex: "1 1 140px" }}
              />
              <TextField
                select
                label="Sex"
                value={sex}
                onChange={(e) => setSex(e.target.value as BiologicalSex)}
                sx={{ flex: "1 1 140px" }}
              >
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="male">Male</MenuItem>
              </TextField>
            </Stack>

            <Box
              sx={{
                p: 2.5,
                borderRadius: "18px",
                background: canComputeBmr ? "linear-gradient(165deg, #23263a 0%, #171a28 100%)" : "#f5f6fa",
                color: canComputeBmr ? "#fff" : "text.secondary",
              }}
            >
              {canComputeBmr ? (
                <Stack direction="row" alignItems="center" gap={1.75}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "14px",
                      bgcolor: "rgba(255,255,255,0.12)",
                      color: "#ffb35c",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <LocalFireDepartmentIcon />
                  </Box>
                  <Box>
                    <Typography fontSize={11} fontWeight={700} letterSpacing={0.6} textTransform="uppercase" sx={{ color: "rgba(255,255,255,0.6)" }}>
                      Estimated basal metabolic rate
                    </Typography>
                    <Typography fontFamily="Roboto Mono, monospace" fontSize={22} fontWeight={500} sx={{ mt: 0.25 }}>
                      {previewBmr} kcal/day
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                <Typography fontSize={13}>
                  Add your height, weight, age, and sex to estimate the calories your body burns at rest.
                </Typography>
              )}
            </Box>
          </Stack>
        </Card>
      </Box>

      {error && (
        <Alert severity="error" sx={{ borderRadius: "14px", mt: 2.5 }}>
          Couldn't save your settings. Please try again.
        </Alert>
      )}
      {isSuccess && !isPending && (
        <Alert severity="success" sx={{ borderRadius: "14px", mt: 2.5 }}>
          Settings saved.
        </Alert>
      )}

      <Button variant="contained" size="large" onClick={handleSave} disabled={isPending || !isDirty} sx={{ mt: 2.5, px: 3 }}>
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </Box>
  );
}
