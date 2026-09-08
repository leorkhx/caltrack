import { useMemo, useState } from "react";
import { Box, Card, Chip, CircularProgress, MenuItem, Select, Stack, Tab, Tabs, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ShieldPersonIcon from "@mui/icons-material/Shield";
import PersonIcon from "@mui/icons-material/Person";
import EventNoteIcon from "@mui/icons-material/EventNote";
import PercentIcon from "@mui/icons-material/Percent";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { LineChart } from "@mui/x-charts/LineChart";
import { useReports } from "../../hooks/useReports";
import { useAdminUsers } from "../../hooks/useAdminEntries";
import type { ReportsParams } from "../../api/admin";

type RangeKey = "7d" | "14d" | "30d" | "6m" | "1y" | "2y" | "3y" | "5y" | "all";

const RANGE_OPTIONS: { key: RangeKey; label: string; params: ReportsParams }[] = [
  { key: "7d", label: "7 days", params: { days: 7 } },
  { key: "14d", label: "14 days", params: { days: 14 } },
  { key: "30d", label: "30 days", params: { days: 30 } },
  { key: "6m", label: "6 months", params: { days: 182 } },
  { key: "1y", label: "1 year", params: { days: 365 } },
  { key: "2y", label: "2 years", params: { days: 730 } },
  { key: "3y", label: "3 years", params: { days: 1095 } },
  { key: "5y", label: "5 years", params: { days: 1825 } },
  { key: "all", label: "All time", params: { all: true } },
];

export function ReportsPage() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const [rangeKey, setRangeKey] = useState<RangeKey>("7d");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const rangeConfig = RANGE_OPTIONS.find((r) => r.key === rangeKey)!;
  const { data: users = [] } = useAdminUsers();
  const loggableUsers = useMemo(() => users.filter((u) => u.role !== "admin"), [users]);
  const { data, isLoading: loading } = useReports({ ...rangeConfig.params, user_id: selectedUserId ?? undefined });

  if (loading && !data) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }
  if (!data) return null;

  const { period_comparison: period, per_user_averages: avgRows, overall_average_daily_calories: allAvg, daily_totals: dailyTotals } = data;
  const delta = period.current_count - period.previous_count;
  const deltaPct = period.previous_count ? Math.round((delta / period.previous_count) * 100) : 0;
  const maxPeriod = Math.max(period.current_count, period.previous_count, 1);
  const periodLabel = rangeConfig.key === "all" ? "all time" : `last ${data.period_days} days`;
  const selectedUserName = selectedUserId ? loggableUsers.find((u) => u.id === selectedUserId)?.name : null;
  const scopeLabel = selectedUserName ? `for ${selectedUserName}` : "across all users";

  return (
    <Box>
      <Stack direction="row" alignItems="flex-end" gap={1.5} flexWrap="wrap" sx={{ mb: 2 }}>
        <Box>
          <Chip
            size="small"
            icon={<ShieldPersonIcon sx={{ fontSize: "15px !important" }} />}
            label="ADMIN"
            sx={{ bgcolor: "rgba(79,79,208,0.1)", color: "primary.main", fontWeight: 700 }}
          />
          <Typography fontSize={32} fontWeight={800} letterSpacing={-0.9} sx={{ mt: 1.25 }}>
            Reports
          </Typography>
        </Box>
        <Select
          size="small"
          value={selectedUserId ?? "all"}
          onChange={(e) => setSelectedUserId(e.target.value === "all" ? null : Number(e.target.value))}
          startAdornment={<PersonIcon sx={{ fontSize: 18, color: "text.secondary", mr: 0.75 }} />}
          sx={{ ml: isSmall ? 0 : "auto", minWidth: 170 }}
        >
          <MenuItem value="all">All users</MenuItem>
          {loggableUsers.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              {u.name}
            </MenuItem>
          ))}
        </Select>
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

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(268px, 1fr))", gap: 2.5 }}>
        <Card
          sx={{
            p: 3,
            background: "linear-gradient(165deg, #23263a 0%, #171a28 100%)",
            color: "#fff",
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.25}>
            <Box sx={{ width: 36, height: 36, borderRadius: "13px", bgcolor: "rgba(255,255,255,0.12)", color: "#c7c7ff", display: "grid", placeItems: "center" }}>
              <EventNoteIcon fontSize="small" />
            </Box>
            <Typography fontSize={12.5} fontWeight={700} sx={{ color: "rgba(255,255,255,0.6)" }}>
              Entries · {periodLabel}
            </Typography>
          </Stack>
          <Typography fontFamily="Roboto Mono, monospace" fontSize={44} fontWeight={500} letterSpacing={-2} sx={{ my: 2.5 }}>
            {period.current_count}
          </Typography>
          <Stack direction="row" alignItems="center" gap={0.75} sx={{ color: delta >= 0 ? "#6ee7b7" : "#ffb4b6" }}>
            {delta >= 0 ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
            <Typography fontSize={13} fontWeight={600}>
              {delta >= 0 ? "+" : ""}
              {delta} vs. previous period ({period.previous_count})
            </Typography>
          </Stack>
          <Typography fontSize={11.5} sx={{ mt: 1, color: "rgba(255,255,255,0.5)" }}>
            {period.current_from} → {period.current_to}
          </Typography>
        </Card>

        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" gap={1.25}>
            <Box sx={{ width: 36, height: 36, borderRadius: "13px", bgcolor: "rgba(79,79,208,0.1)", color: "primary.main", display: "grid", placeItems: "center" }}>
              <PercentIcon fontSize="small" />
            </Box>
            <Typography fontSize={12.5} fontWeight={700} color="text.secondary">
              Change vs. period before
            </Typography>
          </Stack>
          <Typography fontFamily="Roboto Mono, monospace" fontSize={44} fontWeight={500} letterSpacing={-2} sx={{ my: 2.5 }}>
            {deltaPct >= 0 ? "+" : ""}
            {deltaPct}%
          </Typography>
          <Typography fontSize={13} fontWeight={600} color="text.secondary">
            Current day included
          </Typography>
        </Card>

        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" gap={1.25}>
            <Box sx={{ width: 36, height: 36, borderRadius: "13px", bgcolor: "rgba(18,165,106,0.13)", color: "#0f8f60", display: "grid", placeItems: "center" }}>
              <RestaurantIcon fontSize="small" />
            </Box>
            <Typography fontSize={12.5} fontWeight={700} color="text.secondary">
              {selectedUserName ? "Avg kcal / day" : "Avg kcal / user / day"}
            </Typography>
          </Stack>
          <Typography fontFamily="Roboto Mono, monospace" fontSize={44} fontWeight={500} letterSpacing={-2} sx={{ my: 2.5 }}>
            {allAvg}
          </Typography>
          <Typography fontSize={13} fontWeight={600} color="text.secondary">
            {selectedUserName ? `For ${selectedUserName}` : `Across ${avgRows.length} users`}
          </Typography>
        </Card>
      </Box>

      <Card sx={{ p: 3, mt: 2.5 }}>
        <Typography fontSize={17} fontWeight={700} letterSpacing={-0.3}>
          Entries added
        </Typography>
        <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.5 }}>
          {periodLabel} vs. the period before · current day included
        </Typography>
        <Stack direction="row" alignItems="flex-end" gap={4.5} sx={{ height: 232, p: "26px 18px 0" }}>
          {[
            {
              label: "Previous period",
              dates: `${period.previous_from} → ${period.previous_to}`,
              value: period.previous_count,
              color: "linear-gradient(180deg, #cfd0f7 0%, #b4b5ef 100%)",
            },
            {
              label: "Current period",
              dates: `${period.current_from} → ${period.current_to}`,
              value: period.current_count,
              color: "linear-gradient(180deg, #7a7af2 0%, #4f4fd0 100%)",
            },
          ].map((b) => (
            <Stack key={b.label} alignItems="center" gap={1.5} sx={{ flex: 1, height: "100%", justifyContent: "flex-end" }}>
              <Typography fontFamily="Roboto Mono, monospace" fontSize={20} fontWeight={500}>
                {b.value}
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 104,
                  borderRadius: "16px 16px 10px 10px",
                  background: b.color,
                  height: Math.max(6, Math.round((b.value / maxPeriod) * 150)),
                }}
              />
              <Typography fontSize={12.5} fontWeight={600} color="text.secondary" textAlign="center">
                {b.label}
              </Typography>
              <Typography fontSize={11} color="text.secondary" textAlign="center">
                {b.dates}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Card>

      <Card sx={{ p: 3, mt: 2.5 }}>
        <Typography fontSize={17} fontWeight={700} letterSpacing={-0.3}>
          Calories logged over time
        </Typography>
        <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
          Combined total {scopeLabel} · {periodLabel}
        </Typography>
        <LineChart
          height={280}
          series={[
            {
              data: dailyTotals.map((d) => d.total_calories),
              label: "Total calories",
              color: "#4f4fd0",
              showMark: dailyTotals.length <= 31,
              area: true,
            },
          ]}
          xAxis={[
            {
              scaleType: "point",
              data: dailyTotals.map((d) => new Date(d.date + "T00:00:00").toLocaleDateString([], { month: "short", day: "numeric" })),
            },
          ]}
          grid={{ horizontal: true }}
        />
      </Card>
    </Box>
  );
}
