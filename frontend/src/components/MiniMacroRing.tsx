import { Box, Stack, Tooltip, Typography } from "@mui/material";

interface MiniMacroRingProps {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const COLORS = {
  protein: "#4f4fd0",
  carbs: "#c8790a",
  fat: "#c93a3f",
};

const SIZE = 30;
const RADIUS = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MiniMacroRing({ proteinG, carbsG, fatG }: MiniMacroRingProps) {
  const proteinKcal = proteinG * 4;
  const carbsKcal = carbsG * 4;
  const fatKcal = fatG * 9;
  const total = proteinKcal + carbsKcal + fatKcal;

  const segments = [
    { key: "protein", kcal: proteinKcal, color: COLORS.protein, grams: proteinG, label: "Protein" },
    { key: "carbs", kcal: carbsKcal, color: COLORS.carbs, grams: carbsG, label: "Carbs" },
    { key: "fat", kcal: fatKcal, color: COLORS.fat, grams: fatG, label: "Fat" },
  ];

  let cumulative = 0;
  const arcs = segments.map((s) => {
    const length = total > 0 ? (s.kcal / total) * CIRCUMFERENCE : 0;
    const offset = cumulative;
    cumulative += length;
    return { ...s, length, offset };
  });

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
      <Stack direction="row" alignItems="center" gap={0.9}>
        <Box sx={{ position: "relative", width: SIZE, height: SIZE, flex: "none" }}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#eceef4" strokeWidth={5} />
            {arcs.map(
              (a) =>
                a.length > 0 && (
                  <circle
                    key={a.key}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={a.color}
                    strokeWidth={5}
                    strokeDasharray={`${a.length} ${CIRCUMFERENCE - a.length}`}
                    strokeDashoffset={-a.offset}
                  />
                )
            )}
          </svg>
        </Box>
        <Stack direction="row" gap={0.75}>
          {segments.map((s) => (
            <Typography key={s.key} fontSize={11} fontWeight={600} sx={{ color: s.color }}>
              {s.grams}g
            </Typography>
          ))}
        </Stack>
      </Stack>
    </Tooltip>
  );
}
