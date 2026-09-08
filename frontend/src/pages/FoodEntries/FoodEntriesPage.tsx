import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, Typography, Card, CircularProgress, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import NoMealsIcon from "@mui/icons-material/NoMeals";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { CalorieRing } from "../../components/CalorieRing";
import { StatCard } from "../../components/StatCard";
import { DashboardFilterNav, type EntryFilterOption, type EntrySortMode } from "../../components/DashboardFilterNav";
import { EntryRow } from "../../components/EntryRow";
import { EntryDialog } from "../../components/EntryDialog";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useMyEntries, useMyEntryMutations } from "../../hooks/useMyEntries";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import LunchDiningIcon from "@mui/icons-material/LunchDining";
import DinnerDiningIcon from "@mui/icons-material/DinnerDining";
import CookieIcon from "@mui/icons-material/Cookie";
import type { FoodEntry, FoodEntryInput, MealType, User } from "../../types";
import { todayIso } from "../../utils/validation";

const MEAL_SECTIONS: { type: MealType; label: string; icon: React.ReactElement }[] = [
  { type: "breakfast", label: "Breakfast", icon: <WbSunnyIcon sx={{ fontSize: 14 }} /> },
  { type: "lunch", label: "Lunch", icon: <LunchDiningIcon sx={{ fontSize: 14 }} /> },
  { type: "snack", label: "Snack", icon: <CookieIcon sx={{ fontSize: 14 }} /> },
  { type: "dinner", label: "Dinner", icon: <DinnerDiningIcon sx={{ fontSize: 14 }} /> },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

const QUICK_RANGES = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "Custom", days: null },
];

const DAYS_PER_PAGE = 14;

interface FoodEntriesPageProps {
  currentUser: User;
}

export function FoodEntriesPage({ currentUser }: FoodEntriesPageProps) {
  const [dateFrom, setDateFrom] = useState(isoDaysAgo(6));
  const [dateTo, setDateTo] = useState(todayIso());
  const [rangeDays, setRangeDays] = useState<number | null>(7);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FoodEntry | null>(null);
  const [search, setSearch] = useState("");
  const [filterOptions, setFilterOptions] = useState<EntryFilterOption[]>(["all"]);
  const [sortMode, setSortMode] = useState<EntrySortMode>("date_desc");
  const [page, setPage] = useState(1);

  const toggleFilterOption = (option: EntryFilterOption) => {
    setFilterOptions((prev) => {
      if (option === "all") return ["all"];
      const withoutAll = prev.filter((o) => o !== "all");
      const next = withoutAll.includes(option) ? withoutAll.filter((o) => o !== option) : [...withoutAll, option];
      return next.length === 0 ? ["all"] : next;
    });
  };

  const { data: entries = [], isLoading: loading } = useMyEntries({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });
  const { create, update, remove } = useMyEntryMutations();

  const limit = currentUser.daily_calorie_limit;

  const totalsByDay = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach((e) => {
      const key = dateKey(e.consumed_at);
      map[key] = (map[key] || 0) + e.calories;
    });
    return map;
  }, [entries]);

  const today = todayIso();
  const todayTotal = totalsByDay[today] || 0;
  const todayMacros = useMemo(() => {
    return entries
      .filter((e) => dateKey(e.consumed_at) === today)
      .reduce(
        (acc, e) => ({
          protein: acc.protein + (e.protein_g ?? 0),
          carbs: acc.carbs + (e.carbs_g ?? 0),
          fat: acc.fat + (e.fat_g ?? 0),
        }),
        { protein: 0, carbs: 0, fat: 0 }
      );
  }, [entries, today]);

  const rangeSpan = useMemo(() => {
    const from = dateFrom || today;
    const to = dateTo || today;
    const arr: { date: string; total: number }[] = [];
    for (let d = new Date(`${from}T00:00:00`); d <= new Date(`${to}T00:00:00`); d.setDate(d.getDate() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      arr.push({ date: key, total: totalsByDay[key] || 0 });
    }
    return arr;
  }, [totalsByDay, dateFrom, dateTo, today]);
  const rangeDayCount = rangeSpan.length;
  const rangeAvg = rangeDayCount ? Math.round(rangeSpan.reduce((a, w) => a + w.total, 0) / rangeDayCount) : 0;

  const overStats = useMemo(() => {
    if (rangeDays !== null) {
      // 7d/14d: same bounded range as the average card, shown as "X/N".
      const count = rangeSpan.filter((w) => w.total > limit).length;
      return { bounded: true as const, count, total: rangeDayCount };
    }
    // Custom: unbounded by default (all entries), or the chosen custom dates once set.
    let earliest: string | null = null;
    Object.keys(totalsByDay).forEach((key) => {
      if (earliest === null || key < earliest) earliest = key;
    });
    const count = Object.values(totalsByDay).filter((t) => t > limit).length;
    return { bounded: false as const, count, since: dateFrom || earliest || today };
  }, [rangeDays, rangeSpan, rangeDayCount, totalsByDay, dateFrom, today, limit]);

  const dayGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filteredEntries = query ? entries.filter((e) => e.food_name.toLowerCase().includes(query)) : entries;

    const byDay: Record<string, FoodEntry[]> = {};
    filteredEntries.forEach((e) => {
      const key = dateKey(e.consumed_at);
      (byDay[key] = byDay[key] || []).push(e);
    });

    let groups = Object.keys(byDay)
      .sort()
      .reverse()
      .map((date) => {
        const list = [...byDay[date]].sort((a, b) => (a.consumed_at < b.consumed_at ? 1 : -1));
        const total = list.reduce((a, e) => a + e.calories, 0);
        const over = total > limit;
        const d = new Date(`${date}T00:00:00`);
        const label =
          date === today
            ? "Today"
            : date === isoDaysAgo(1)
              ? "Yesterday"
              : d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
        const hasMacros = list.some((e) => e.protein_g !== null || e.carbs_g !== null || e.fat_g !== null);
        const macroTotals = hasMacros
          ? {
              protein: list.reduce((a, e) => a + (e.protein_g ?? 0), 0),
              carbs: list.reduce((a, e) => a + (e.carbs_g ?? 0), 0),
              fat: list.reduce((a, e) => a + (e.fat_g ?? 0), 0),
            }
          : null;
        return { date, list, total, over, label, macroTotals };
      });

    if (!filterOptions.includes("all")) {
      groups = groups.filter((g) => (filterOptions.includes("over") && g.over) || (filterOptions.includes("within") && !g.over));
    }

    if (sortMode === "date_asc") {
      groups = [...groups].reverse();
    } else if (sortMode === "calories_desc") {
      groups = [...groups].sort((a, b) => b.total - a.total);
    } else if (sortMode === "calories_asc") {
      groups = [...groups].sort((a, b) => a.total - b.total);
    }

    return groups;
  }, [entries, limit, today, search, filterOptions, sortMode]);

  useEffect(() => {
    setPage(1);
  }, [search, filterOptions, sortMode, dateFrom, dateTo]);

  const totalDayPages = Math.max(1, Math.ceil(dayGroups.length / DAYS_PER_PAGE));
  const visibleDayGroups = dayGroups.slice((page - 1) * DAYS_PER_PAGE, page * DAYS_PER_PAGE);

  const computeExistingTotal = useCallback(
    (_userId: number, dateIso: string, excludeEntryId: number | null) => {
      return entries
        .filter((e) => dateKey(e.consumed_at) === dateIso && e.id !== excludeEntryId)
        .reduce((a, e) => a + e.calories, 0);
    },
    [entries]
  );

  const handleSave = async (input: FoodEntryInput) => {
    if (editing) {
      await update.mutateAsync({ id: editing.id, input });
    } else {
      await create.mutateAsync(input);
    }
  };

  const handleDelete = (entry: FoodEntry) => {
    setDeleteTarget(entry);
  };

  const confirmDelete = () => {
    if (deleteTarget) remove.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const setQuickRange = (days: number | null) => {
    setRangeDays(days);
    if (days === null) {
      setDateFrom("");
      setDateTo("");
    } else {
      setDateFrom(isoDaysAgo(days - 1));
      setDateTo(today);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="flex-end" gap={3} sx={{ mb: 3.5 }}>
        <Box>
          <Typography fontSize={13} fontWeight={600} color="text.secondary">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </Typography>
          <Typography fontSize={34} fontWeight={800} letterSpacing={-1} sx={{ mt: 0.5 }}>
            Hey {currentUser.name.split(" ")[0]}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ ml: "auto", py: 1.5, px: 2.75 }}
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Log food
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 2.5,
          mb: 3.5,
        }}
      >
        <CalorieRing
          total={todayTotal}
          limit={limit}
          headline={todayTotal > limit ? "You're over today's limit" : `${limit - todayTotal} kcal still available`}
          macros={{
            protein: todayMacros.protein,
            carbs: todayMacros.carbs,
            fat: todayMacros.fat,
            proteinTarget: currentUser.protein_target_g,
            carbsTarget: currentUser.carbs_target_g,
            fatTarget: currentUser.fat_target_g,
          }}
        />
        <StatCard
          icon={<MonitorHeartIcon fontSize="small" />}
          label={`${rangeDayCount}-day average`}
          value={rangeAvg}
          note={rangeAvg > limit ? "Above your daily limit on average" : `${limit - rangeAvg} kcal below your limit on average`}
        />
        <StatCard
          icon={<WarningAmberIcon fontSize="small" />}
          label="Days over limit"
          value={overStats.bounded ? `${overStats.count}/${overStats.total}` : overStats.count}
          tint="rgba(229,72,77,0.12)"
          iconColor="#c93a3f"
          note={
            overStats.count === 0
              ? "Clean streak so far — keep it up"
              : overStats.bounded
                ? "Highlighted in red below"
                : `Since ${new Date(`${overStats.since}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
          }
        />
      </Box>

      <DashboardFilterNav
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={(v) => {
          setDateFrom(v);
          setRangeDays(null);
        }}
        onDateToChange={(v) => {
          setDateTo(v);
          setRangeDays(null);
        }}
        onQuickRange={setQuickRange}
        activeRangeDays={rangeDays}
        quickRanges={QUICK_RANGES}
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={filterOptions}
        onToggleFilterOption={toggleFilterOption}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
      />

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : dayGroups.length === 0 ? (
        <Card sx={{ p: 8, textAlign: "center" }}>
          <Box
            sx={{
              width: 62,
              height: 62,
              mx: "auto",
              borderRadius: "20px",
              bgcolor: "#f2f3f8",
              color: "#a5aabb",
              display: "grid",
              placeItems: "center",
            }}
          >
            <NoMealsIcon />
          </Box>
          <Typography fontSize={18} fontWeight={700} sx={{ mt: 2.25 }}>
            Nothing logged in this range
          </Typography>
          <Typography fontSize={14} color="text.secondary" sx={{ mt: 0.75 }}>
            Widen the date filter, or log your first food entry.
          </Typography>
        </Card>
      ) : (
        visibleDayGroups.map((group) => (
          <Card key={group.date} sx={{ mb: 2.5, overflow: "hidden" }}>
            <Stack direction="row" alignItems="center" gap={2} sx={{ p: "20px 24px 18px" }}>
              <Box>
                <Typography fontSize={17} fontWeight={700} letterSpacing={-0.3}>
                  {group.label}
                </Typography>
                <Typography fontSize={12.5} color="text.secondary" sx={{ mt: 0.4 }}>
                  {group.list.length} {group.list.length === 1 ? "entry" : "entries"}
                </Typography>
              </Box>
              <Box sx={{ ml: "auto", textAlign: "right" }}>
                <Typography fontFamily="Roboto Mono, monospace" fontSize={17} fontWeight={500}>
                  {group.total} kcal
                </Typography>
                <Typography
                  fontSize={12}
                  fontWeight={700}
                  sx={{ mt: 0.4, color: group.over ? "#c93a3f" : "#0f8f60" }}
                >
                  {group.over ? `Over by ${group.total - limit}` : "Within limit"}
                </Typography>
              </Box>
            </Stack>
            <Box sx={{ mx: 3, height: 9, borderRadius: "6px", bgcolor: "#eceef4", overflow: "hidden" }}>
              <Box
                sx={{
                  height: 9,
                  width: `${Math.min(100, Math.round((group.total / limit) * 100))}%`,
                  background: group.over
                    ? "linear-gradient(90deg, #f0787c 0%, #e5484d 100%)"
                    : "linear-gradient(90deg, #34d399 0%, #12a56a 100%)",
                }}
              />
            </Box>
            {group.macroTotals && (
              <Stack direction="row" gap={2.5} sx={{ px: 3, pt: 1.5 }} flexWrap="wrap">
                {[
                  { label: "Protein", grams: group.macroTotals.protein, target: currentUser.protein_target_g, color: "#4f4fd0" },
                  { label: "Carbs", grams: group.macroTotals.carbs, target: currentUser.carbs_target_g, color: "#c8790a" },
                  { label: "Fat", grams: group.macroTotals.fat, target: currentUser.fat_target_g, color: "#c93a3f" },
                ].map((m) => {
                  const pct = m.target ? Math.min(m.grams / m.target, 1) * 100 : 100;
                  return (
                    <Stack key={m.label} sx={{ flex: "1 1 140px", minWidth: 120 }} gap={0.5}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography fontSize={11.5} fontWeight={700} sx={{ color: m.color }}>
                          {m.label}
                        </Typography>
                        <Typography fontSize={11.5} fontWeight={600} color="text.secondary">
                          {m.grams}g{m.target ? ` / ${m.target}g` : ""}
                        </Typography>
                      </Stack>
                      <Box sx={{ height: 6, borderRadius: "4px", bgcolor: "#eceef4", overflow: "hidden" }}>
                        <Box
                          sx={{
                            height: "100%",
                            width: `${pct}%`,
                            borderRadius: "4px",
                            bgcolor: m.target ? m.color : "#c3c7d4",
                          }}
                        />
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            )}
            <Stack sx={{ p: "14px" }} gap={1}>
              {MEAL_SECTIONS.map((section) => {
                const items = group.list.filter((e) => e.meal_type === section.type);
                if (items.length === 0) return null;
                return (
                  <Box key={section.type}>
                    <Stack direction="row" alignItems="center" gap={0.75} sx={{ px: 1, pt: 1, pb: 0.5 }}>
                      <Box sx={{ color: "text.secondary", display: "flex" }}>{section.icon}</Box>
                      <Typography fontSize={11.5} fontWeight={700} letterSpacing={0.4} textTransform="uppercase" color="text.secondary">
                        {section.label}
                      </Typography>
                    </Stack>
                    {items.map((entry) => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        onEdit={() => {
                          setEditing(entry);
                          setDialogOpen(true);
                        }}
                        onDelete={() => handleDelete(entry)}
                      />
                    ))}
                  </Box>
                );
              })}
            </Stack>
          </Card>
        ))
      )}

      {!loading && dayGroups.length > 0 && totalDayPages > 1 && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 1.5 }}>
          <Typography fontSize={13} fontWeight={600} color="text.secondary">
            Page {page} of {totalDayPages}
          </Typography>
          <Stack direction="row" gap={1}>
            <IconButton size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeftIcon />
            </IconButton>
            <IconButton size="small" disabled={page >= totalDayPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRightIcon />
            </IconButton>
          </Stack>
        </Stack>
      )}

      <EntryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        isAdmin={false}
        currentUserId={currentUser.id}
        initialEntry={editing}
        getUserLimit={() => limit}
        computeExistingTotal={computeExistingTotal}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this entry?"
        description={deleteTarget ? `"${deleteTarget.food_name}" will be permanently removed.` : undefined}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
