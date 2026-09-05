import { Box, Stack, Typography } from "@mui/material";
import { caloriesFromMacros } from "./dietPresets";

interface MacroBarProps {
  proteinG: number;
  carbsG: number;
  fatG: number;
  dailyCalorieLimit: number;
}

const COLORS = {
  protein: "#4f4fd0",
  carbs: "#c8790a",
  fat: "#c93a3f",
};

const RADIUS = 62;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const RING_SIZE = 156;

export function MacroBar({ proteinG, carbsG, fatG, dailyCalorieLimit }: MacroBarProps) {
  const proteinKcal = proteinG * 4;
  const carbsKcal = carbsG * 4;
  const fatKcal = fatG * 9;
  const totalKcal = caloriesFromMacros(proteinG, carbsG, fatG);

  if (totalKcal === 0) {
    return (
      <Box sx={{ p: 2.5, borderRadius: "16px", bgcolor: "#f5f6fa", textAlign: "center" }}>
        <Typography fontSize={13} color="text.secondary">
          Set protein, carbs, or fat targets to see the breakdown.
        </Typography>
      </Box>
    );
  }

  const segments = [
    { key: "protein", label: "Protein", grams: proteinG, kcal: proteinKcal, color: COLORS.protein },
    { key: "carbs", label: "Carbs", grams: carbsG, kcal: carbsKcal, color: COLORS.carbs },
    { key: "fat", label: "Fat", grams: fatG, kcal: fatKcal, color: COLORS.fat },
  ];

  let cumulative = 0;
  const arcs = segments.map((s) => {
    const length = (s.kcal / totalKcal) * CIRCUMFERENCE;
    const offset = cumulative;
    cumulative += length;
    return { ...s, length, offset };
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems="center"
        justifyContent="space-between"
        gap={{ xs: 2, sm: 0 }}
        sx={{ width: "100%" }}
      >
        <Box sx={{ position: "relative", width: RING_SIZE, height: RING_SIZE, flex: "none" }}>
          <svg viewBox="0 0 156 156" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
            <circle cx={78} cy={78} r={RADIUS} fill="none" stroke="#eceef4" strokeWidth={18} />
            {arcs.map(
              (a) =>
                a.length > 0 && (
                  <circle
                    key={a.key}
                    cx={78}
                    cy={78}
                    r={RADIUS}
                    fill="none"
                    stroke={a.color}
                    strokeWidth={18}
                    strokeDasharray={`${a.length} ${CIRCUMFERENCE - a.length}`}
                    strokeDashoffset={-a.offset}
                  />
                )
            )}
          </svg>
          <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <Typography fontFamily="Roboto Mono, monospace" fontSize={24} fontWeight={500} lineHeight={1.1}>
              {totalKcal}
            </Typography>
            <Typography fontSize={12} color="text.secondary" fontWeight={600}>
              kcal
            </Typography>
          </Box>
        </Box>

        <Stack gap={1.75} sx={{ flex: 1, width: "100%", pl: { xs: 0, sm: 3 } }}>
          {segments.map((s) => (
            <Stack key={s.key} direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
              <Stack direction="row" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, borderRadius: "50%", flex: "none", bgcolor: s.color }} />
                <Typography fontSize={13.5} fontWeight={600}>
                  {s.label}
                </Typography>
              </Stack>
              <Stack alignItems="flex-end">
                <Typography fontFamily="Roboto Mono, monospace" fontSize={13.5} fontWeight={600}>
                  {s.grams}g
                </Typography>
                <Typography fontSize={11} color="text.secondary">
                  {s.kcal} kcal
                </Typography>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Stack>
      <Typography fontSize={12} color="text.secondary" sx={{ mt: "auto", pt: 1.75 }}>
        {totalKcal} kcal from macros · {dailyCalorieLimit} kcal daily limit
        {Math.abs(totalKcal - dailyCalorieLimit) > 50 &&
          (totalKcal > dailyCalorieLimit
            ? ` — ${totalKcal - dailyCalorieLimit} kcal over your limit`
            : ` — ${dailyCalorieLimit - totalKcal} kcal under your limit`)}
      </Typography>
    </Box>
  );
}
