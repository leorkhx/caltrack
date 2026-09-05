import { useMemo, useState } from "react";
import { Box, Button, Card, CircularProgress, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Typography } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useFavoriteMutations, useFavorites } from "../../hooks/useFavorites";
import { FavoriteDialog } from "./FavoriteDialog";
import { FavoritesFilterNav, type FavoriteFilterOption, type FavoriteSortMode } from "./FavoritesFilterNav";
import type { FavoriteFood } from "../../types";

export function FavoritesPage() {
  const { data: favorites = [], isLoading } = useFavorites();
  const { remove } = useFavoriteMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState<FavoriteFood | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuFavorite, setMenuFavorite] = useState<FavoriteFood | null>(null);
  const [search, setSearch] = useState("");
  const [filterOptions, setFilterOptions] = useState<FavoriteFilterOption[]>(["all"]);
  const [sortMode, setSortMode] = useState<FavoriteSortMode>("newest");

  const toggleFilterOption = (option: FavoriteFilterOption) => {
    setFilterOptions((prev) => {
      if (option === "all") return ["all"];
      const withoutAll = prev.filter((o) => o !== "all");
      const next = withoutAll.includes(option) ? withoutAll.filter((o) => o !== option) : [...withoutAll, option];
      return next.length === 0 ? ["all"] : next;
    });
  };

  const visibleFavorites = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = query ? favorites.filter((f) => f.food_name.toLowerCase().includes(query)) : favorites;

    if (!filterOptions.includes("all")) {
      list = list.filter((f) => {
        const hasMacros = f.protein_g !== null || f.carbs_g !== null || f.fat_g !== null;
        return (
          (filterOptions.includes("fdc") && f.from_fdc) ||
          (filterOptions.includes("manual") && !f.from_fdc) ||
          (filterOptions.includes("with_macros") && hasMacros) ||
          (filterOptions.includes("without_macros") && !hasMacros)
        );
      });
    }

    list = [...list];
    switch (sortMode) {
      case "name_asc":
        list.sort((a, b) => a.food_name.localeCompare(b.food_name));
        break;
      case "name_desc":
        list.sort((a, b) => b.food_name.localeCompare(a.food_name));
        break;
      case "calories_desc":
        list.sort((a, b) => b.calories - a.calories);
        break;
      case "calories_asc":
        list.sort((a, b) => a.calories - b.calories);
        break;
      case "oldest":
        list.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
        break;
      case "newest":
      default:
        list.sort((a, b) => (a.created_at > b.created_at ? -1 : 1));
        break;
    }
    return list;
  }, [favorites, search, filterOptions, sortMode]);

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuFavorite(null);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingFavorite(null);
  };

  return (
    <Box>
      <Stack direction="row" alignItems="flex-end" gap={3} sx={{ mb: 3.5 }}>
        <Stack direction="row" alignItems="center" gap={1.25}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "14px",
              bgcolor: "rgba(217,138,15,0.14)",
              color: "#a9690a",
              display: "grid",
              placeItems: "center",
            }}
          >
            <StarIcon />
          </Box>
          <Box>
            <Typography fontSize={26} fontWeight={800} letterSpacing={-0.6}>
              Favorites
            </Typography>
            <Typography fontSize={13.5} color="text.secondary">
              Foods you log often — starred first when you search
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ ml: "auto", py: 1.5, px: 2.75 }}
          onClick={() => setDialogOpen(true)}
        >
          Add favorite
        </Button>
      </Stack>

      <FavoritesFilterNav
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={filterOptions}
        onToggleFilterOption={toggleFilterOption}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
      />

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={26} />
        </Stack>
      ) : visibleFavorites.length === 0 ? (
        <Card sx={{ p: 6, textAlign: "center" }}>
          <Typography fontSize={15} fontWeight={600} color="text.secondary">
            {favorites.length === 0
              ? "No favorites yet — add one above, or save a food from the log dialog next time."
              : "No favorites match your search or filters."}
          </Typography>
        </Card>
      ) : (
        <Card sx={{ p: 1.5 }}>
          {visibleFavorites.map((f) => (
            <Stack
              key={f.id}
              direction="row"
              alignItems="center"
              gap={1.5}
              sx={{ p: "12px 14px", borderRadius: "16px", "&:hover": { bgcolor: "#f6f7fb" } }}
            >
              <StarIcon sx={{ fontSize: 20, color: "#d98a0f", flex: "none" }} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography fontSize={14.5} fontWeight={600} noWrap>
                  {f.food_name}
                </Typography>
                {(f.protein_g !== null || f.carbs_g !== null || f.fat_g !== null) && (
                  <Typography fontSize={11.5} color="text.secondary">
                    {f.protein_g ?? 0}g protein · {f.carbs_g ?? 0}g carbs · {f.fat_g ?? 0}g fat
                  </Typography>
                )}
              </Box>
              <Typography
                fontFamily="Roboto Mono, monospace"
                fontSize={14}
                fontWeight={500}
                sx={{ px: 1.5, py: 0.6, borderRadius: "11px", bgcolor: "#f2f3f8" }}
              >
                {f.calories} kcal
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => {
                  setMenuAnchor(e.currentTarget);
                  setMenuFavorite(f);
                }}
                sx={{ border: "1px solid rgba(23,26,40,0.06)", borderRadius: "12px" }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
        </Card>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            if (menuFavorite) {
              setEditingFavorite(menuFavorite);
              setDialogOpen(true);
            }
            closeMenu();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuFavorite) remove.mutate(menuFavorite.id);
            closeMenu();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <FavoriteDialog open={dialogOpen} onClose={closeDialog} initialFavorite={editingFavorite} />
    </Box>
  );
}
