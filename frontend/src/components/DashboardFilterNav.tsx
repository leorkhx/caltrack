import { useState } from "react";
import { Button, Checkbox, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Stack, TextField, Tooltip } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs, { type Dayjs } from "dayjs";
import DateRangeIcon from "@mui/icons-material/DateRange";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import CheckIcon from "@mui/icons-material/Check";

export type EntryFilterOption = "all" | "over" | "within";
export type EntrySortMode = "date_desc" | "date_asc" | "calories_desc" | "calories_asc";

interface DashboardFilterNavProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  quickRanges: { label: string; days: number | null }[];
  onQuickRange: (days: number | null) => void;
  activeRangeDays: number | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterOptions: EntryFilterOption[];
  onToggleFilterOption: (option: EntryFilterOption) => void;
  sortMode: EntrySortMode;
  onSortModeChange: (mode: EntrySortMode) => void;
}

const DATE_FIELD_SX = {
  width: 150,
  "& .MuiInputBase-root": { fontSize: 13.5, fontWeight: 600 },
  "& .MuiPickersSectionList-sectionContent": { fontSize: 13.5, fontWeight: 600 },
};

const FILTER_OPTIONS: { value: EntryFilterOption; label: string }[] = [
  { value: "all", label: "All days" },
  { value: "over", label: "Over limit" },
  { value: "within", label: "Within limit" },
];

const SORT_OPTIONS: { value: EntrySortMode; label: string }[] = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "calories_desc", label: "Highest calories" },
  { value: "calories_asc", label: "Lowest calories" },
];

/**
 * Sub-navigation bar for the "My day" screen: date-range presets/picker,
 * a food-name search, a day filter, and a sort order — all acting on the
 * entries list below.
 */
export function DashboardFilterNav({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  quickRanges,
  onQuickRange,
  activeRangeDays,
  searchValue,
  onSearchChange,
  filterOptions,
  onToggleFilterOption,
  sortMode,
  onSortModeChange,
}: DashboardFilterNavProps) {
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1.5,
        p: 1.25,
        mb: 2.5,
        width: "100%",
        borderRadius: "20px",
        border: "1px solid rgba(23,26,40,0.05)",
        boxShadow: "0 1px 2px rgba(23,26,40,0.04), 0 18px 36px -22px rgba(23,26,40,0.4)",
      }}
    >
      <Stack direction="row" gap={0.5} sx={{ p: 0.5, bgcolor: "#e7e9f0", borderRadius: "15px" }}>
        {quickRanges.map((r) => (
          <Button
            key={r.label}
            size="small"
            onClick={() => onQuickRange(r.days)}
            sx={{
              borderRadius: "11px",
              px: 1.75,
              minWidth: 0,
              color: activeRangeDays === r.days ? "#fff" : "text.secondary",
              bgcolor: activeRangeDays === r.days ? "primary.main" : "transparent",
              "&:hover": { bgcolor: activeRangeDays === r.days ? "primary.dark" : "rgba(23,26,40,0.06)" },
            }}
          >
            {r.label}
          </Button>
        ))}
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{ px: 1.5, py: 0.5, bgcolor: "#fff", borderRadius: "15px", border: "1px solid rgba(23,26,40,0.06)" }}
      >
        <DateRangeIcon sx={{ fontSize: 18, color: "text.secondary", flex: "none" }} />
        <DatePicker
          value={dateFrom ? dayjs(dateFrom) : null}
          onChange={(value: Dayjs | null) => onDateFromChange(value ? value.format("YYYY-MM-DD") : "")}
          maxDate={dayjs()}
          disabled={activeRangeDays !== null}
          slotProps={{ textField: { variant: "standard", sx: DATE_FIELD_SX } }}
        />
        <span style={{ color: "#c3c7d4", fontWeight: 700 }}>-</span>
        <DatePicker
          value={dateTo ? dayjs(dateTo) : null}
          onChange={(value: Dayjs | null) => onDateToChange(value ? value.format("YYYY-MM-DD") : "")}
          maxDate={dayjs()}
          disabled={activeRangeDays !== null}
          slotProps={{ textField: { variant: "standard", sx: DATE_FIELD_SX } }}
        />
      </Stack>

      <TextField
        placeholder="Search food..."
        size="small"
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ minWidth: 180, flex: "1 1 180px" }}
        slotProps={{ input: { startAdornment: <SearchIcon sx={{ fontSize: 19, mr: 1, color: "text.secondary" }} /> } }}
      />

      <Tooltip title="Filter">
        <IconButton
          onClick={(e) => setFilterAnchor(e.currentTarget)}
          sx={{
            borderRadius: "13px",
            border: "1px solid rgba(23,26,40,0.06)",
            color: !filterOptions.includes("all") ? "primary.main" : "text.secondary",
            bgcolor: !filterOptions.includes("all") ? "rgba(79,79,208,0.08)" : "#fff",
          }}
        >
          <FilterListIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={() => setFilterAnchor(null)}>
        {FILTER_OPTIONS.map((opt) => {
          const checked = filterOptions.includes(opt.value);
          return (
            <MenuItem key={opt.value} onClick={() => onToggleFilterOption(opt.value)} selected={checked}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple size="small" />
              </ListItemIcon>
              <ListItemText>{opt.label}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>

      <Tooltip title="Sort">
        <IconButton
          onClick={(e) => setSortAnchor(e.currentTarget)}
          sx={{ borderRadius: "13px", border: "1px solid rgba(23,26,40,0.06)", color: "text.secondary", bgcolor: "#fff" }}
        >
          <SwapVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}>
        {SORT_OPTIONS.map((opt) => (
          <MenuItem
            key={opt.value}
            selected={sortMode === opt.value}
            onClick={() => {
              onSortModeChange(opt.value);
              setSortAnchor(null);
            }}
          >
            {sortMode === opt.value && (
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CheckIcon fontSize="small" />
              </ListItemIcon>
            )}
            <ListItemText inset={sortMode !== opt.value}>{opt.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
}
