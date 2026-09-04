import { useEffect, useState } from "react";
import { Box, Card, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import ShieldPersonIcon from "@mui/icons-material/Shield";
import EventNoteIcon from "@mui/icons-material/EventNote";
import PercentIcon from "@mui/icons-material/Percent";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { fetchReports } from "../../api/admin";
import type { ReportsData } from "../../types";

const AV = ["#5b5bd6", "#9333a8", "#0f8f7a", "#c02a63", "#c07a2a"];

export function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }
  if (!data) return null;

  const { week_comparison: wk, per_user_averages: avgRows, overall_average_daily_calories: allAvg } = data;
  const delta = wk.last_7_days_count - wk.previous_7_days_count;
  const deltaPct = wk.previous_7_days_count
    ? Math.round((delta / wk.previous_7_days_count) * 100)
    : 0;
  const maxWeek = Math.max(wk.last_7_days_count, wk.previous_7_days_count, 1);
  const maxAvg = Math.max(...avgRows.map((r) => r.average_daily_calories), 1);

  return (
    <Box>
      <Box sx={{ mb: 3.25 }}>
        <Chip
          size="small"
          icon={<ShieldPersonIcon sx={{ fontSize: "15px !important" }} />}
          label="Admin only"
          sx={{ bgcolor: "rgba(79,79,208,0.1)", color: "primary.main", fontSize: 11.5 }}
        />
        <Typography fontSize={32} fontWeight={800} letterSpacing={-0.9} sx={{ mt: 1.25 }}>
          Reports
        </Typography>
        <Typography fontSize={14} color="text.secondary" sx={{ mt: 0.6 }}>
          {wk.last_7_days_from} → {wk.last_7_days_to} · regular users cannot access this screen
        </Typography>
      </Box>

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
              Entries · last 7 days
            </Typography>
          </Stack>
          <Typography fontFamily="Roboto Mono, monospace" fontSize={44} fontWeight={500} letterSpacing={-2} sx={{ my: 2.5 }}>
            {wk.last_7_days_count}
          </Typography>
          <Stack direction="row" alignItems="center" gap={0.75} sx={{ color: delta >= 0 ? "#6ee7b7" : "#ffb4b6" }}>
            {delta >= 0 ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
            <Typography fontSize={13} fontWeight={600}>
              {delta >= 0 ? "+" : ""}
              {delta} vs. previous 7 ({wk.previous_7_days_count})
            </Typography>
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" gap={1.25}>
            <Box sx={{ width: 36, height: 36, borderRadius: "13px", bgcolor: "rgba(79,79,208,0.1)", color: "primary.main", display: "grid", placeItems: "center" }}>
              <PercentIcon fontSize="small" />
            </Box>
            <Typography fontSize={12.5} fontWeight={700} color="text.secondary">
              Change vs. week before
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
              Avg kcal / user / day
            </Typography>
          </Stack>
          <Typography fontFamily="Roboto Mono, monospace" fontSize={44} fontWeight={500} letterSpacing={-2} sx={{ my: 2.5 }}>
            {allAvg}
          </Typography>
          <Typography fontSize={13} fontWeight={600} color="text.secondary">
            Across {avgRows.length} users
          </Typography>
        </Card>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 2.5, mt: 2.5 }}>
        <Card sx={{ p: 3 }}>
          <Typography fontSize={17} fontWeight={700} letterSpacing={-0.3}>
            Entries added
          </Typography>
          <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.5 }}>
            Last 7 days vs. the week before · current day included
          </Typography>
          <Stack direction="row" alignItems="flex-end" gap={4.5} sx={{ height: 232, p: "26px 18px 0" }}>
            {[
              { label: "Previous 7 days", value: wk.previous_7_days_count, color: "linear-gradient(180deg, #cfd0f7 0%, #b4b5ef 100%)" },
              { label: "Last 7 days", value: wk.last_7_days_count, color: "linear-gradient(180deg, #7a7af2 0%, #4f4fd0 100%)" },
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
                    height: Math.max(6, Math.round((b.value / maxWeek) * 150)),
                  }}
                />
                <Typography fontSize={12.5} fontWeight={600} color="text.secondary" textAlign="center">
                  {b.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography fontSize={17} fontWeight={700} letterSpacing={-0.3}>
            Average calories per user
          </Typography>
          <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
            Daily average over the last 7 days
          </Typography>
          <Stack gap={1}>
            {avgRows.map((r, i) => (
              <Stack
                key={r.user_id}
                direction="row"
                alignItems="center"
                gap={1.75}
                sx={{ p: 1.5, borderRadius: "18px", bgcolor: "#f8f9fc", border: "1px solid rgba(23,26,40,0.04)" }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    flex: "none",
                    borderRadius: "13px",
                    bgcolor: AV[i % AV.length],
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {r.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </Box>
                <Box sx={{ width: 128, minWidth: 0 }}>
                  <Typography fontSize={14} fontWeight={600} noWrap>
                    {r.name}
                  </Typography>
                  <Typography fontSize={11.5} color="text.secondary" sx={{ mt: 0.25 }}>
                    {r.entries_count} entries
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, height: 10, borderRadius: "6px", bgcolor: "#e7e9f0", overflow: "hidden" }}>
                  <Box
                    sx={{
                      height: 10,
                      borderRadius: "6px",
                      width: `${Math.round((r.average_daily_calories / maxAvg) * 100)}%`,
                      background: `linear-gradient(90deg, rgba(91,91,214,0.65) 0%, ${AV[i % AV.length]} 100%)`,
                    }}
                  />
                </Box>
                <Typography fontFamily="Roboto Mono, monospace" fontSize={14.5} sx={{ width: 92, textAlign: "right" }}>
                  {r.average_daily_calories} kcal
                </Typography>
              </Stack>
            ))}
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2.25, pt: 2, borderTop: "1px solid rgba(23,26,40,0.06)" }}>
            <Typography fontSize={13.5} fontWeight={600} color="text.secondary">
              All users average
            </Typography>
            <Typography fontFamily="Roboto Mono, monospace" fontSize={16}>
              {allAvg} kcal
            </Typography>
          </Stack>
        </Card>
      </Box>
    </Box>
  );
}
