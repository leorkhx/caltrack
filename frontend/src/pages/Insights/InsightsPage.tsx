import { useMemo, useState } from "react";
import {
  Box,
  Card,
  CircularProgress,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import InsightsIcon from "@mui/icons-material/Insights";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { useMyEntries, useMyEntriesCount } from "../../hooks/useMyEntries";
import { localDateKey } from "../../utils/validation";
import type { FoodEntry, User } from "../../types";

interface InsightsPageProps {
  currentUser: User;
}

type RangeKey = "7d" | "14d" | "30d" | "6m" | "1y" | "2y" | "3y" | "5y" | "all";
type BucketUnit = "day" | "week" | "month";

interface RangeConfig {
  key: RangeKey;
  label: string;
  days: number | null;
  unit: BucketUnit;
}

const RANGE_OPTIONS: RangeConfig[] = [
  { key: "7d", label: "7 days", days: 7, unit: "day" },
  { key: "14d", label: "14 days", days: 14, unit: "day" },
  { key: "30d", label: "30 days", days: 30, unit: "day" },
  { key: "6m", label: "6 months", days: 182, unit: "week" },
  { key: "1y", label: "1 year", days: 365, unit: "month" },
  { key: "2y", label: "2 years", days: 730, unit: "month" },
  { key: "3y", label: "3 years", days: 1095, unit: "month" },
  { key: "5y", label: "5 years", days: 1825, unit: "month" },
  { key: "all", label: "All time", days: null, unit: "month" },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayIso(): string {
  return isoDaysAgo(0);
}

function parseIsoDay(day: string): Date {
  return new Date(day + "T00:00:00");
}

function mondayOf(date: Date): string {
  const d = new Date(date);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthOf(day: string): string {
  return day.slice(0, 7);
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card sx={{ p: 2.25, flex: 1, minWidth: 180 }}>
      <Stack direction="row" alignItems="center" gap={1.25} sx={{ mb: 1 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "12px",
            bgcolor: "rgba(79,79,208,0.1)",
            color: "primary.main",
            display: "grid",
            placeItems: "center",
          }}
        >
          {icon}
        </Box>
        <Typography fontSize={12.5} fontWeight={600} color="text.secondary">
          {label}
        </Typography>
      </Stack>
      <Typography fontSize={24} fontWeight={800} letterSpacing={-0.5}>
        {value}
      </Typography>
      {hint && (
        <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.25 }}>
          {hint}
        </Typography>
      )}
    </Card>
  );
}

export function InsightsPage({ currentUser }: InsightsPageProps) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const [rangeKey, setRangeKey] = useState<RangeKey>("14d");
  const rangeConfig = RANGE_OPTIONS.find((r) => r.key === rangeKey)!;

  const dateFrom = rangeConfig.days === null ? undefined : isoDaysAgo(rangeConfig.days - 1);
  const { data: entries = [], isLoading } = useMyEntries({ date_from: dateFrom, date_to: todayIso() });
  const { data: entriesTotal = 0 } = useMyEntriesCount({ date_from: dateFrom, date_to: todayIso() });

  const dailyTotals = useMemo(() => {
    const byDay = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();

    const earliestDay = entries.reduce<string | null>((min, e: FoodEntry) => {
      const day = localDateKey(e.consumed_at);
      return min === null || day < min ? day : min;
    }, null);
    const startDay = dateFrom ?? earliestDay ?? todayIso();

    for (let d = parseIsoDay(startDay); d <= parseIsoDay(todayIso()); d.setDate(d.getDate() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      byDay.set(key, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    }
    for (const entry of entries) {
      const day = localDateKey(entry.consumed_at);
      const bucket = byDay.get(day);
      if (!bucket) continue;
      bucket.calories += entry.calories;
      bucket.protein += entry.protein_g ?? 0;
      bucket.carbs += entry.carbs_g ?? 0;
      bucket.fat += entry.fat_g ?? 0;
    }
    return Array.from(byDay.entries())
      .map(([day, totals]) => ({ day, ...totals }))
      .sort((a, b) => (a.day < b.day ? -1 : 1));
  }, [entries, dateFrom]);

  const daysLogged = dailyTotals.filter((d) => d.calories > 0);
  const averageCalories = daysLogged.length
    ? Math.round(daysLogged.reduce((sum, d) => sum + d.calories, 0) / daysLogged.length)
    : 0;

  const limit = currentUser.daily_calorie_limit;
  const daysWithinLimit = daysLogged.filter((d) => d.calories <= limit).length;

  const streak = useMemo(() => {
    // Longest run of consecutive logged, within-limit days anywhere in the
    // range — not anchored to today, so an old streak still shows up even
    // if nothing's been logged recently.
    let best = 0;
    let current = 0;
    for (const d of dailyTotals) {
      if (d.calories > 0 && d.calories <= limit) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
    return best;
  }, [dailyTotals, limit]);

  const macroTotals = useMemo(() => {
    return dailyTotals.reduce(
      (acc, d) => ({ protein: acc.protein + d.protein, carbs: acc.carbs + d.carbs, fat: acc.fat + d.fat }),
      { protein: 0, carbs: 0, fat: 0 }
    );
  }, [dailyTotals]);

  const hasMacroData = macroTotals.protein + macroTotals.carbs + macroTotals.fat > 0;

  const chartBuckets = useMemo(() => {
    if (rangeConfig.unit === "day") {
      return dailyTotals.map((d) => ({
        key: d.day,
        label: parseIsoDay(d.day).toLocaleDateString([], { month: "short", day: "numeric" }),
        calories: d.calories,
      }));
    }

    const groups = new Map<string, { sum: number; loggedDays: number }>();
    for (const d of dailyTotals) {
      const key = rangeConfig.unit === "week" ? mondayOf(parseIsoDay(d.day)) : monthOf(d.day);
      const group = groups.get(key) ?? { sum: 0, loggedDays: 0 };
      if (d.calories > 0) {
        group.sum += d.calories;
        group.loggedDays += 1;
      }
      groups.set(key, group);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, group]) => ({
        key,
        label:
          rangeConfig.unit === "week"
            ? `Wk of ${parseIsoDay(key).toLocaleDateString([], { month: "short", day: "numeric" })}`
            : new Date(key + "-01T00:00:00").toLocaleDateString([], { month: "short", year: "2-digit" }),
        calories: group.loggedDays ? Math.round(group.sum / group.loggedDays) : 0,
      }));
  }, [dailyTotals, rangeConfig.unit]);

  return (
    <Box>
      <Stack direction="row" alignItems="flex-end" gap={1.5} sx={{ mb: 2, flexWrap: "wrap" }}>
        <Stack direction="row" alignItems="center" gap={1.25}>
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
            <InsightsIcon />
          </Box>
          <Box>
            <Typography fontSize={26} fontWeight={800} letterSpacing={-0.6}>
              Insights
            </Typography>
            <Typography fontSize={13.5} color="text.secondary">
              Track your calorie and macro trends over time
            </Typography>
          </Box>
        </Stack>
        {isSmall && (
          <Select
            size="small"
            value={rangeKey}
            onChange={(e) => setRangeKey(e.target.value as RangeKey)}
            sx={{ ml: "auto", minWidth: 140 }}
          >
            {RANGE_OPTIONS.map((r) => (
              <MenuItem key={r.key} value={r.key}>
                {r.label}
              </MenuItem>
            ))}
          </Select>
        )}
      </Stack>

      {!isSmall && (
        <Tabs
          value={rangeKey}
          onChange={(_, value) => setRangeKey(value)}
          variant="fullWidth"
          sx={{
            mb: 3,
            minHeight: 0,
            borderRadius: "16px",
            bgcolor: "#f2f3f8",
            p: 0.5,
            "& .MuiTabs-indicator": { display: "none" },
            "& .MuiTab-root": {
              minHeight: 36,
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: 13,
              color: "text.secondary",
            },
            "& .Mui-selected": {
              bgcolor: "background.paper",
              color: "primary.main",
              boxShadow: "0 1px 2px rgba(23,26,40,0.08)",
            },
          }}
        >
          {RANGE_OPTIONS.map((r) => (
            <Tab key={r.key} value={r.key} label={r.label} disableRipple />
          ))}
        </Tabs>
      )}
      {isSmall && <Box sx={{ mb: 3 }} />}

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={26} />
        </Stack>
      ) : (
        <Stack gap={2.5}>
          <Stack direction="row" gap={2} flexWrap="wrap">
            <StatCard
              icon={<LocalFireDepartmentIcon fontSize="small" />}
              label="Average calories / day"
              value={daysLogged.length ? `${averageCalories}` : "—"}
              hint={`Across ${daysLogged.length} logged day${daysLogged.length === 1 ? "" : "s"}`}
            />
            <StatCard
              icon={<CheckCircleIcon fontSize="small" />}
              label="Days within limit"
              value={`${daysWithinLimit}/${daysLogged.length}`}
              hint={`Limit: ${limit} kcal`}
            />
            <StatCard
              icon={<EmojiEventsIcon fontSize="small" />}
              label="Best streak"
              value={`${streak} day${streak === 1 ? "" : "s"}`}
              hint="Longest run of consecutive logged days within limit"
            />
            <StatCard
              icon={<TrendingUpIcon fontSize="small" />}
              label="Total entries"
              value={`${entriesTotal}`}
              hint={`In ${rangeConfig.label.toLowerCase()}`}
            />
          </Stack>

          <Card sx={{ p: 2.5 }}>
            <Typography fontSize={15} fontWeight={700} sx={{ mb: 1.5 }}>
              {rangeConfig.unit === "day" ? "Daily calories" : "Average calories"}
            </Typography>
            <LineChart
              height={280}
              series={[
                { data: chartBuckets.map((b) => b.calories), label: "Calories", color: "#4f4fd0", showMark: rangeConfig.unit === "day" },
                { data: chartBuckets.map(() => limit), label: "Daily limit", color: "#c93a3f", showMark: false },
              ]}
              xAxis={[{ scaleType: "point", data: chartBuckets.map((b) => b.label) }]}
              grid={{ horizontal: true }}
            />
          </Card>

          <Card sx={{ p: 2.5 }}>
            <Typography fontSize={15} fontWeight={700} sx={{ mb: 1.5 }}>
              Macro split
            </Typography>
            {hasMacroData ? (
              <PieChart
                height={260}
                series={[
                  {
                    data: [
                      { id: "protein", value: macroTotals.protein, label: "Protein", color: "#4f4fd0" },
                      { id: "carbs", value: macroTotals.carbs, label: "Carbs", color: "#c8790a" },
                      { id: "fat", value: macroTotals.fat, label: "Fat", color: "#c93a3f" },
                    ],
                    innerRadius: 55,
                    paddingAngle: 2,
                    cornerRadius: 4,
                  },
                ]}
              />
            ) : (
              <Typography fontSize={13.5} color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                No macro data logged in this range yet.
              </Typography>
            )}
          </Card>
        </Stack>
      )}
    </Box>
  );
}
