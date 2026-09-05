import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, Chip, Stack, TextField, Typography } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { useUpdateMe } from "../../hooks/useUpdateMe";
import type { User } from "../../types";

const MIN_LIMIT = 800;
const MAX_LIMIT = 10000;
const MAX_MACRO = 1000;

interface SettingsPageProps {
  currentUser: User;
}

function toText(value: number | null): string {
  return value === null ? "" : String(value);
}

export function SettingsPage({ currentUser }: SettingsPageProps) {
  const [dailyLimit, setDailyLimit] = useState(toText(currentUser.daily_calorie_limit));
  const [protein, setProtein] = useState(toText(currentUser.protein_target_g));
  const [carbs, setCarbs] = useState(toText(currentUser.carbs_target_g));
  const [fat, setFat] = useState(toText(currentUser.fat_target_g));
  const [touched, setTouched] = useState(false);
  const { mutate, isPending, isSuccess, error, reset } = useUpdateMe();

  useEffect(() => {
    setDailyLimit(toText(currentUser.daily_calorie_limit));
    setProtein(toText(currentUser.protein_target_g));
    setCarbs(toText(currentUser.carbs_target_g));
    setFat(toText(currentUser.fat_target_g));
  }, [currentUser]);

  const limitNum = Number(dailyLimit);
  const limitError =
    dailyLimit === ""
      ? "Required."
      : !/^\d+$/.test(dailyLimit) || limitNum < MIN_LIMIT || limitNum > MAX_LIMIT
        ? `Must be between ${MIN_LIMIT} and ${MAX_LIMIT} kcal.`
        : "";

  const macroError = (value: string) => {
    if (value === "") return "";
    const n = Number(value);
    return !/^\d+$/.test(value) || n > MAX_MACRO ? `0–${MAX_MACRO}g.` : "";
  };
  const proteinError = macroError(protein);
  const carbsError = macroError(carbs);
  const fatError = macroError(fat);

  const hasErrors = Boolean(limitError || proteinError || carbsError || fatError);

  const handleSave = () => {
    setTouched(true);
    if (hasErrors) return;
    reset();
    mutate({
      daily_calorie_limit: limitNum,
      protein_target_g: protein === "" ? null : Number(protein),
      carbs_target_g: carbs === "" ? null : Number(carbs),
      fat_target_g: fat === "" ? null : Number(fat),
    });
  };

  return (
    <Box sx={{ maxWidth: 560 }}>
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
            Your daily calorie limit and macro targets
          </Typography>
        </Box>
      </Stack>

      <Card sx={{ p: 3 }}>
        <Stack gap={2.5}>
          <TextField
            label="Daily calorie limit"
            value={dailyLimit}
            onChange={(e) => setDailyLimit(e.target.value.replace(/[^\d]/g, ""))}
            onBlur={() => setTouched(true)}
            error={touched && Boolean(limitError)}
            helperText={
              (touched && limitError) ||
              `We'll flag any day you go over this. Default is 2100 kcal.`
            }
            fullWidth
            slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>kcal</Typography> } }}
          />

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
                onChange={(e) => setProtein(e.target.value.replace(/[^\d]/g, ""))}
                onBlur={() => setTouched(true)}
                error={touched && Boolean(proteinError)}
                helperText={touched && proteinError}
                sx={{ flex: "1 1 140px" }}
                slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>g</Typography> } }}
              />
              <TextField
                label="Carbs"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value.replace(/[^\d]/g, ""))}
                onBlur={() => setTouched(true)}
                error={touched && Boolean(carbsError)}
                helperText={touched && carbsError}
                sx={{ flex: "1 1 140px" }}
                slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>g</Typography> } }}
              />
              <TextField
                label="Fat"
                value={fat}
                onChange={(e) => setFat(e.target.value.replace(/[^\d]/g, ""))}
                onBlur={() => setTouched(true)}
                error={touched && Boolean(fatError)}
                helperText={touched && fatError}
                sx={{ flex: "1 1 140px" }}
                slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>g</Typography> } }}
              />
            </Stack>
          </Box>

          {error && (
            <Alert severity="error" sx={{ borderRadius: "14px" }}>
              Couldn't save your settings. Please try again.
            </Alert>
          )}
          {isSuccess && !isPending && (
            <Alert severity="success" sx={{ borderRadius: "14px" }}>
              Settings saved.
            </Alert>
          )}

          <Button variant="contained" size="large" onClick={handleSave} disabled={isPending} sx={{ alignSelf: "flex-start", px: 3 }}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
