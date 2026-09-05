import { useState } from "react";
import { Checkbox, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper, TextField, Tooltip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import FilterListIcon from "@mui/icons-material/FilterList";
import CheckIcon from "@mui/icons-material/Check";

export type FavoriteSortMode = "name_asc" | "name_desc" | "calories_desc" | "calories_asc" | "newest" | "oldest";
export type FavoriteFilterOption = "all" | "fdc" | "manual" | "with_macros" | "without_macros";

interface FavoritesFilterNavProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterOptions: FavoriteFilterOption[];
  onToggleFilterOption: (option: FavoriteFilterOption) => void;
  sortMode: FavoriteSortMode;
  onSortModeChange: (mode: FavoriteSortMode) => void;
}

const SORT_OPTIONS: { value: FavoriteSortMode; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "calories_desc", label: "Highest calories" },
  { value: "calories_asc", label: "Lowest calories" },
];

const FILTER_OPTIONS: { value: FavoriteFilterOption; label: string }[] = [
  { value: "all", label: "All favorites" },
  { value: "fdc", label: "From FDC" },
  { value: "manual", label: "Manually added" },
  { value: "with_macros", label: "Has macros" },
  { value: "without_macros", label: "No macros" },
];

export function FavoritesFilterNav({
  searchValue,
  onSearchChange,
  filterOptions,
  onToggleFilterOption,
  sortMode,
  onSortModeChange,
}: FavoritesFilterNavProps) {
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);

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
      <TextField
        placeholder="Search favorites..."
        size="small"
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ minWidth: 200, flex: "1 1 200px" }}
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
