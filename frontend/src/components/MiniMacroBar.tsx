import { Box, Stack, Tooltip, Typography } from "@mui/material";

interface MiniMacroBarProps {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const COLORS = {
  protein: "#4f4fd0",
  carbs: "#c8790a",
  fat: "#c93a3f",
};

export function MiniMacroBar({ proteinG, carbsG, fatG }: MiniMacroBarProps) {
  const proteinKcal = proteinG * 4;
  const carbsKcal = carbsG * 4;
  const fatKcal = fatG * 9;
  const total = proteinKcal + carbsKcal + fatKcal;

  const segments = [
    { key: "protein", kcal: proteinKcal, color: COLORS.protein, grams: proteinG, label: "Protein", short: "P" },
    { key: "carbs", kcal: carbsKcal, color: COLORS.carbs, grams: carbsG, label: "Carbs", short: "C" },
    { key: "fat", kcal: fatKcal, color: COLORS.fat, grams: fatG, label: "Fat", short: "F" },
  ];

  return (
    <Tooltip
      title={
        <Stack gap={0.25}>
          {segments.map((s) => (
            <Typography key={s.key} fontSize={11}>
              {s.label}: {s.grams}g
            </Typography>
          ))}
        </Stack>
      }
    >
      <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 110, width: "100%" }}>
        <Stack
          direction="row"
          sx={{
            width: { xs: 56, sm: 140, md: 200 },
            height: 8,
            borderRadius: "5px",
            overflow: "hidden",
            flex: "none",
          }}
        >
          {segments.map((s) => (s.kcal > 0 ? <Box key={s.key} sx={{ flex: s.kcal, bgcolor: s.color }} /> : null))}
          {total === 0 && <Box sx={{ flex: 1, bgcolor: "#eceef4" }} />}
        </Stack>
        <Stack direction="row" gap={0.9}>
          {segments.map((s) => (
            <Typography key={s.key} fontSize={11} fontWeight={600} sx={{ color: s.color }}>
              {s.short} {s.grams}g
            </Typography>
          ))}
        </Stack>
      </Stack>
    </Tooltip>
  );
}
