import { Box, Card, Chip, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface MacroProgress {
  label: string;
  grams: number;
  targetGrams: number | null;
  color: string;
}

interface CalorieRingProps {
  total: number;
  limit: number;
  headline: string;
  macros?: {
    protein: number;
    carbs: number;
    fat: number;
    proteinTarget: number | null;
    carbsTarget: number | null;
    fatTarget: number | null;
  };
}

const RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CalorieRing({ total, limit, headline, macros }: CalorieRingProps) {
  const pct = limit > 0 ? Math.min(total / limit, 1) : 0;
  const overLimit = total > limit;
  const offset = CIRCUMFERENCE * (1 - pct);
  const ringColor = overLimit ? "#e5484d" : "#7c7cf5";

  const macroRows: MacroProgress[] | null = macros
    ? [
        { label: "Protein", grams: macros.protein, targetGrams: macros.proteinTarget, color: "#9d9dfa" },
        { label: "Carbs", grams: macros.carbs, targetGrams: macros.carbsTarget, color: "#ffb35c" },
        { label: "Fat", grams: macros.fat, targetGrams: macros.fatTarget, color: "#ff9a9d" },
      ]
    : null;
  const hasAnyMacroData = macroRows?.some((m) => m.grams > 0 || m.targetGrams !== null) ?? false;

  return (
    <Card
      sx={{
        p: 3,
        display: "flex",
        alignItems: "center",
        gap: 2.75,
        flexWrap: "wrap",
        background: "linear-gradient(165deg, #23263a 0%, #171a28 100%)",
        color: "#fff",
        boxShadow: "0 2px 4px rgba(23,26,40,0.1), 0 26px 46px -22px rgba(23,26,40,0.7)",
      }}
    >
      <Box sx={{ position: "relative", width: 132, height: 132, flex: "0 1 132px", minWidth: 104 }}>
        <svg viewBox="0 0 132 132" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
          <circle cx={66} cy={66} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth={13} />
          <circle
            cx={66}
            cy={66}
            r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth={13}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography fontFamily="Roboto Mono, monospace" fontSize={27} fontWeight={500} letterSpacing={-1}>
            {total}
          </Typography>
          <Typography fontSize={11} fontWeight={600} sx={{ color: "rgba(255,255,255,0.55)" }}>
            of {limit}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
        <Typography fontSize={11} fontWeight={700} letterSpacing={1} textTransform="uppercase" sx={{ color: "rgba(255,255,255,0.5)" }}>
          Today
        </Typography>
        <Typography fontSize={21} fontWeight={700} letterSpacing={-0.4} sx={{ mt: 1, lineHeight: 1.25 }}>
          {headline}
        </Typography>
        <Stack direction="row" sx={{ mt: 1.75 }}>
          <Chip
            size="small"
            icon={overLimit ? <WarningAmberIcon /> : <CheckCircleIcon />}
            label={overLimit ? "Over your limit" : "Within limit"}
            sx={{
              bgcolor: overLimit ? "rgba(229,72,77,0.18)" : "rgba(18,165,106,0.18)",
              color: overLimit ? "#ff9a9d" : "#5fe3ac",
              "& .MuiChip-icon": { color: "inherit" },
            }}
          />
        </Stack>
        {hasAnyMacroData && macroRows && (
          <Stack gap={0.9} sx={{ mt: 1.75 }}>
            {macroRows.map((m) => {
              const macroPct = m.targetGrams ? Math.min(m.grams / m.targetGrams, 1) : 0;
              return (
                <Stack key={m.label} direction="row" alignItems="center" gap={1}>
                  <Typography fontSize={11.5} fontWeight={600} sx={{ width: 52, color: "rgba(255,255,255,0.7)" }}>
                    {m.label}
                  </Typography>
                  <Box sx={{ flex: 1, height: 6, borderRadius: "4px", bgcolor: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
                    <Box sx={{ height: "100%", width: `${m.targetGrams ? macroPct * 100 : 0}%`, bgcolor: m.color, borderRadius: "4px" }} />
                  </Box>
                  <Typography fontFamily="Roboto Mono, monospace" fontSize={11.5} fontWeight={500} sx={{ color: "rgba(255,255,255,0.85)", minWidth: 62, textAlign: "right" }}>
                    {m.grams}g{m.targetGrams ? ` / ${m.targetGrams}g` : ""}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Box>
    </Card>
  );
}
