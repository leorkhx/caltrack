import { useCallback, useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import ShieldIcon from "@mui/icons-material/Shield";
import PersonIcon from "@mui/icons-material/Person";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useAdminEntries, useAdminEntryMutations, useAdminUsers } from "../../hooks/useAdminEntries";
import { DashboardFilterNav, type EntryFilterOption, type EntrySortMode } from "../../components/DashboardFilterNav";
import { EntryRow } from "../../components/EntryRow";
import { EntryDialog } from "../../components/EntryDialog";
import { todayIso } from "../../utils/validation";
import type { AdminFoodEntry, FoodEntryInput } from "../../types";

const PAGE_SIZE = 10;

const QUICK_RANGES = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "All", days: null },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = ["#4f4fd0", "#0f8f60", "#c8790a", "#e5484d", "#0891b2"];
function colorFor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

interface AllEntriesPageProps {
  currentUserId: number;
}

export function AllEntriesPage({ currentUserId }: AllEntriesPageProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rangeDays, setRangeDays] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AdminFoodEntry | null>(null);
  const [search, setSearch] = useState("");
  const [filterOptions, setFilterOptions] = useState<EntryFilterOption[]>(["all"]);
  const [sortMode, setSortMode] = useState<EntrySortMode>("date_desc");

  const { data: users = [] } = useAdminUsers();
  const loggableUsers = useMemo(() => users.filter((u) => u.role !== "admin"), [users]);

  const {
    data: entriesData,
    isLoading: loading,
    isError,
  } = useAdminEntries({
    user_id: selectedUserId ?? undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    page_size: PAGE_SIZE,
  });
  const { create, update, remove } = useAdminEntryMutations();

  const rawEntries = entriesData?.items ?? [];
  const total = entriesData?.total ?? 0;

  const toggleFilterOption = (option: EntryFilterOption) => {
    setFilterOptions((prev) => {
      if (option === "all") return ["all"];
      const withoutAll = prev.filter((o) => o !== "all");
      const next = withoutAll.includes(option) ? withoutAll.filter((o) => o !== option) : [...withoutAll, option];
      return next.length === 0 ? ["all"] : next;
    });
  };

  const entries = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = query ? rawEntries.filter((e) => e.food_name.toLowerCase().includes(query)) : rawEntries;

    if (!filterOptions.includes("all")) {
      list = list.filter((e) => {
        const over = e.day_total > e.user_daily_limit;
        return (filterOptions.includes("over") && over) || (filterOptions.includes("within") && !over);
      });
    }

    list = [...list];
    switch (sortMode) {
      case "date_asc":
        list.sort((a, b) => (a.consumed_at < b.consumed_at ? -1 : 1));
        break;
      case "calories_desc":
        list.sort((a, b) => b.calories - a.calories);
        break;
      case "calories_asc":
        list.sort((a, b) => a.calories - b.calories);
        break;
      case "date_desc":
      default:
        list.sort((a, b) => (a.consumed_at > b.consumed_at ? -1 : 1));
        break;
    }
    return list;
  }, [rawEntries, search, filterOptions, sortMode]);

  const userLimitMap = useMemo(() => {
    const map = new Map<number, number>();
    users.forEach((u) => map.set(u.id, u.daily_calorie_limit));
    return map;
  }, [users]);

  const computeExistingTotal = useCallback(
    (userId: number, dateIso: string, excludeEntryId: number | null) => {
      // Best-effort using the currently loaded page; admin dataset can be large,
      // so this is an approximation for the dialog's "projected total" preview.
      // The per-row over/under-limit indicator below uses the backend's exact
      // day_total instead.
      return rawEntries
        .filter(
          (e) => e.user_id === userId && e.consumed_at.slice(0, 10) === dateIso && e.id !== excludeEntryId
        )
        .reduce((sum, e) => sum + e.calories, 0);
    },
    [rawEntries]
  );

  const handleSave = async (input: FoodEntryInput) => {
    if (editingEntry) {
      await update.mutateAsync({ id: editingEntry.id, input });
    } else {
      await create.mutateAsync(input);
    }
  };

  const handleDelete = (entry: AdminFoodEntry) => {
    if (!window.confirm(`Delete "${entry.food_name}" for ${entry.user_name}?`)) return;
    remove.mutate(entry.id);
  };

  const setQuickRange = (days: number | null) => {
    setRangeDays(days);
    setPage(1);
    if (days === null) {
      setDateFrom("");
      setDateTo("");
    } else {
      setDateFrom(isoDaysAgo(days - 1));
      setDateTo(todayIso());
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Box>
      <Stack direction="row" alignItems="flex-end" gap={2.5} flexWrap="wrap" sx={{ mb: 3.5 }}>
        <Box>
          <Chip
            size="small"
            icon={<ShieldIcon sx={{ fontSize: "15px !important" }} />}
            label="ADMIN"
            sx={{ bgcolor: "rgba(79,79,208,0.1)", color: "primary.main", fontWeight: 700 }}
          />
          <Typography variant="h4" sx={{ mt: 1.25 }}>
            All food entries
          </Typography>
          <Typography fontSize={14} color="text.secondary" sx={{ mt: 0.5 }}>
            {total} {total === 1 ? "entry" : "entries"} across all users
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ ml: "auto", px: 2.75, py: 1.4 }}
          onClick={() => {
            setEditingEntry(null);
            setDialogOpen(true);
          }}
        >
          New entry
        </Button>
      </Stack>

      <DashboardFilterNav
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={(v) => {
          setDateFrom(v);
          setPage(1);
        }}
        onDateToChange={(v) => {
          setDateTo(v);
          setPage(1);
        }}
        quickRanges={QUICK_RANGES}
        onQuickRange={setQuickRange}
        activeRangeDays={rangeDays}
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={filterOptions}
        onToggleFilterOption={toggleFilterOption}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
        extraControl={
          <Select
            size="small"
            value={selectedUserId ?? "all"}
            onChange={(e) => {
              setSelectedUserId(e.target.value === "all" ? null : Number(e.target.value));
              setPage(1);
            }}
            startAdornment={<PersonIcon sx={{ fontSize: 18, color: "text.secondary", mr: 0.75 }} />}
            sx={{ minWidth: 170, bgcolor: "#fff", borderRadius: "15px" }}
          >
            <MenuItem value="all">All users</MenuItem>
            {loggableUsers.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.name}
              </MenuItem>
            ))}
          </Select>
        }
      />

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}
      {isError && <Alert severity="error">Failed to load entries.</Alert>}

      {!loading && !isError && (
        <Card sx={{ p: 1.5, overflowX: "auto" }}>
          {entries.length === 0 && (
            <Typography sx={{ p: 4, textAlign: "center" }} color="text.secondary">
              No entries match these filters.
            </Typography>
          )}
          <Box sx={{ minWidth: 640 }}>
          {entries.map((entry) => {
            const over = entry.day_total > entry.user_daily_limit;
            return (
              <EntryRow
                key={entry.id}
                entry={entry}
                onEdit={() => {
                  setEditingEntry(entry);
                  setDialogOpen(true);
                }}
                onDelete={() => handleDelete(entry)}
                rightExtra={
                  <Stack direction="row" alignItems="center" gap={1.25} sx={{ width: 190 }}>
                    <Avatar sx={{ width: 30, height: 30, fontSize: 11.5, bgcolor: colorFor(entry.user_id) }}>
                      {initials(entry.user_name)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontSize={13.5} fontWeight={600} noWrap>
                        {entry.user_name}
                      </Typography>
                      <Typography fontSize={11.5} color="text.secondary" noWrap>
                        limit {entry.user_daily_limit}
                      </Typography>
                    </Box>
                    <Chip size="small" color={over ? "error" : "success"} label={over ? "Over" : "OK"} variant="outlined" />
                  </Stack>
                }
              />
            );
          })}
          </Box>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2, pt: 2, pb: 1, borderTop: "1px solid rgba(23,26,40,0.06)", mt: 1 }}
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
        </Card>
      )}

      <EntryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        isAdmin
        users={loggableUsers}
        currentUserId={editingEntry ? editingEntry.user_id : (loggableUsers[0]?.id ?? currentUserId)}
        initialEntry={editingEntry}
        getUserLimit={(uid) => userLimitMap.get(uid) ?? 2100}
        computeExistingTotal={computeExistingTotal}
      />
    </Box>
  );
}
