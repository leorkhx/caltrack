import { useCallback, useMemo, useState } from "react";
import { Box, Button, Stack, Typography, Card, CircularProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import NoMealsIcon from "@mui/icons-material/NoMeals";
import { CalorieRing } from "../../components/CalorieRing";
import { StatCard } from "../../components/StatCard";
import { FiltersBar } from "../../components/FiltersBar";
import { EntryRow } from "../../components/EntryRow";
import { EntryDialog } from "../../components/EntryDialog";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useMyEntries, useMyEntryMutations } from "../../hooks/useMyEntries";
import type { FoodEntry, FoodEntryInput, User } from "../../types";
import { todayIso } from "../../utils/validation";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

interface FoodEntriesPageProps {
  currentUser: User;
}

export function FoodEntriesPage({ currentUser }: FoodEntriesPageProps) {
  const [dateFrom, setDateFrom] = useState(isoDaysAgo(6));
  const [dateTo, setDateTo] = useState(todayIso());
  const [rangeDays, setRangeDays] = useState<number | null>(7);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FoodEntry | null>(null);

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

  const week = useMemo(() => {
    const arr: { date: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = isoDaysAgo(i);
      arr.push({ date: d, total: totalsByDay[d] || 0 });
    }
    return arr;
  }, [totalsByDay]);
  const weekAvg = Math.round(week.reduce((a, w) => a + w.total, 0) / 7);
  const overCount = week.filter((w) => w.total > limit).length;

  const dayGroups = useMemo(() => {
    const byDay: Record<string, FoodEntry[]> = {};
    entries.forEach((e) => {
      const key = dateKey(e.consumed_at);
      (byDay[key] = byDay[key] || []).push(e);
    });
    return Object.keys(byDay)
      .sort()
      .reverse()
      .map((date) => {
        const list = byDay[date].sort((a, b) => (a.consumed_at < b.consumed_at ? 1 : -1));
        const total = list.reduce((a, e) => a + e.calories, 0);
        const over = total > limit;
        const d = new Date(`${date}T00:00:00`);
        const label =
          date === today
            ? "Today"
            : date === isoDaysAgo(1)
              ? "Yesterday"
              : d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
        return { date, list, total, over, label };
      });
  }, [entries, limit, today]);

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

  const handleDelete = (id: number) => {
    remove.mutate(id);
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
        />
        <StatCard
          icon={<MonitorHeartIcon fontSize="small" />}
          label="7-day average"
          value={weekAvg}
          note={weekAvg > limit ? "Above your daily limit on average" : `${limit - weekAvg} kcal below your limit on average`}
        />
        <StatCard
          icon={<WarningAmberIcon fontSize="small" />}
          label="Days over limit"
          value={`${overCount}/7`}
          tint="rgba(229,72,77,0.12)"
          iconColor="#c93a3f"
          note={overCount === 0 ? "Clean week so far — keep it up" : "Highlighted in red below"}
        />
      </Box>

      <FiltersBar
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
        dayGroups.map((group) => (
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
            <Stack sx={{ p: "14px" }}>
              {group.list.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  onEdit={() => {
                    setEditing(entry);
                    setDialogOpen(true);
                  }}
                  onDelete={() => handleDelete(entry.id)}
                />
              ))}
            </Stack>
          </Card>
        ))
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
    </Box>
  );
}
