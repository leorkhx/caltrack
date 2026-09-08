import { useEffect, useState } from "react";
import { Box, Button, Card, Chip, CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useTopFoods } from "../../hooks/useTopFoods";
import type { TopFoodsParams } from "../../api/admin";

const AV = ["#5b5bd6", "#9333a8", "#0f8f7a", "#c02a63", "#c07a2a"];
const PAGE_SIZE = 20;

type RangeKey = "7d" | "14d" | "30d" | "6m" | "1y" | "2y" | "5y" | "all";

const RANGE_OPTIONS: { key: RangeKey; label: string; params: TopFoodsParams }[] = [
  { key: "7d", label: "7d", params: { days: 7 } },
  { key: "14d", label: "14d", params: { days: 14 } },
  { key: "30d", label: "30d", params: { days: 30 } },
  { key: "6m", label: "6 months", params: { days: 182 } },
  { key: "1y", label: "1 year", params: { days: 365 } },
  { key: "2y", label: "2 years", params: { days: 730 } },
  { key: "5y", label: "5 years", params: { days: 1825 } },
  { key: "all", label: "All time", params: { all: true } },
];

export function TopFoodsPage() {
  const [rangeKey, setRangeKey] = useState<RangeKey>("all");
  const [page, setPage] = useState(1);
  const rangeConfig = RANGE_OPTIONS.find((r) => r.key === rangeKey)!;
  const { data, isLoading: loading } = useTopFoods({ ...rangeConfig.params, page, page_size: PAGE_SIZE });

  useEffect(() => {
    setPage(1);
  }, [rangeKey]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const maxCount = Math.max(...items.map((i) => i.entries_count), 1);

  return (
    <Box>
      <Stack direction="row" alignItems="flex-end" gap={2.5} flexWrap="wrap" sx={{ mb: 3.25 }}>
        <Box>
          <Chip
            size="small"
            icon={<ShieldIcon sx={{ fontSize: "15px !important" }} />}
            label="ADMIN"
            sx={{ bgcolor: "rgba(79,79,208,0.1)", color: "primary.main", fontWeight: 700 }}
          />
          <Typography fontSize={32} fontWeight={800} letterSpacing={-0.9} sx={{ mt: 1.25 }}>
            Most added foods
          </Typography>
          <Typography fontSize={14} color="text.secondary" sx={{ mt: 0.6 }}>
            Which foods your users log most often, across all regular users
          </Typography>
        </Box>
        <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ ml: "auto", p: 0.5, bgcolor: "#e7e9f0", borderRadius: "15px" }}>
          {RANGE_OPTIONS.map((r) => (
            <Button
              key={r.key}
              size="small"
              onClick={() => setRangeKey(r.key)}
              sx={{
                borderRadius: "11px",
                px: 1.75,
                minWidth: 0,
                color: rangeKey === r.key ? "#fff" : "text.secondary",
                bgcolor: rangeKey === r.key ? "primary.main" : "transparent",
                "&:hover": { bgcolor: rangeKey === r.key ? "primary.dark" : "rgba(23,26,40,0.06)" },
              }}
            >
              {r.label}
            </Button>
          ))}
        </Stack>
      </Stack>

      {loading && !data ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : items.length === 0 ? (
        <Card sx={{ p: 6, textAlign: "center" }}>
          <Typography fontSize={15} fontWeight={600} color="text.secondary">
            No food entries logged in this range yet.
          </Typography>
        </Card>
      ) : (
        <Card sx={{ p: 3 }}>
          <Stack gap={1}>
            {items.map((item, i) => {
              const rank = (page - 1) * PAGE_SIZE + i + 1;
              return (
                <Stack
                  key={item.food_name}
                  direction="row"
                  alignItems="center"
                  gap={1.75}
                  sx={{ p: 1.5, borderRadius: "18px", bgcolor: "#f8f9fc", border: "1px solid rgba(23,26,40,0.04)" }}
                >
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      flex: "none",
                      borderRadius: "12px",
                      bgcolor: rank <= 3 ? AV[i % AV.length] : "rgba(23,26,40,0.06)",
                      color: rank <= 3 ? "#fff" : "text.secondary",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {rank}
                  </Box>
                  <Box sx={{ width: 220, minWidth: 0 }}>
                    <Typography fontSize={14} fontWeight={600} noWrap>
                      {item.food_name}
                    </Typography>
                    <Typography fontSize={11.5} color="text.secondary" sx={{ mt: 0.25 }}>
                      {item.average_calories} kcal avg
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, height: 10, borderRadius: "6px", bgcolor: "#e7e9f0", overflow: "hidden" }}>
                    <Box
                      sx={{
                        height: 10,
                        borderRadius: "6px",
                        width: `${Math.round((item.entries_count / maxCount) * 100)}%`,
                        background: `linear-gradient(90deg, rgba(91,91,214,0.65) 0%, ${AV[i % AV.length]} 100%)`,
                      }}
                    />
                  </Box>
                  <Typography fontFamily="Roboto Mono, monospace" fontSize={14.5} sx={{ width: 130, textAlign: "right" }}>
                    {item.entries_count} {item.entries_count === 1 ? "entry" : "entries"}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>

          {totalPages > 1 && (
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ px: 1, pt: 2, mt: 1, borderTop: "1px solid rgba(23,26,40,0.06)" }}
            >
              <Typography fontSize={13} fontWeight={600} color="text.secondary">
                Page {page} of {totalPages}
              </Typography>
              <Stack direction="row" gap={1}>
                <IconButton size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton size="small" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRightIcon />
                </IconButton>
              </Stack>
            </Stack>
          )}
        </Card>
      )}
    </Box>
  );
}
