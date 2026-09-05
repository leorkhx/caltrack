import { Box, IconButton, Stack, Typography, Chip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VerifiedIcon from "@mui/icons-material/Verified";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import LunchDiningIcon from "@mui/icons-material/LunchDining";
import DinnerDiningIcon from "@mui/icons-material/DinnerDining";
import CookieIcon from "@mui/icons-material/Cookie";
import { MiniMacroRing } from "./MiniMacroRing";
import type { FoodEntry, MealType } from "../types";

interface EntryRowProps {
  entry: FoodEntry;
  onEdit: () => void;
  onDelete: () => void;
  rightExtra?: React.ReactNode;
}

const MEAL_ICONS: Record<MealType, React.ReactElement> = {
  breakfast: <WbSunnyIcon sx={{ fontSize: 12 }} />,
  lunch: <LunchDiningIcon sx={{ fontSize: 12 }} />,
  dinner: <DinnerDiningIcon sx={{ fontSize: 12 }} />,
  snack: <CookieIcon sx={{ fontSize: 12 }} />,
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export function EntryRow({ entry, onEdit, onDelete, rightExtra }: EntryRowProps) {
  const time = new Date(entry.consumed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const hasMacros = entry.protein_g !== null || entry.carbs_g !== null || entry.fat_g !== null;

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1.75}
      sx={{ p: 1.5, borderRadius: "18px", "&:hover": { bgcolor: "#f6f7fb" } }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          flex: "none",
          borderRadius: "15px",
          bgcolor: "rgba(79,79,208,0.1)",
          color: "primary.main",
          display: "grid",
          placeItems: "center",
        }}
      >
        <RestaurantMenuIcon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography fontSize={15.5} fontWeight={600} noWrap>
          {entry.food_name}
        </Typography>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          <Typography fontSize={12.5} fontWeight={500} color="text.secondary">
            {time}
          </Typography>
          <Chip
            size="small"
            icon={MEAL_ICONS[entry.meal_type]}
            label={MEAL_LABELS[entry.meal_type]}
            sx={{ height: 20, fontSize: 11, color: "text.secondary", bgcolor: "rgba(23,26,40,0.05)" }}
          />
          {entry.from_fdc && (
            <Chip
              size="small"
              icon={<VerifiedIcon sx={{ fontSize: "13px !important" }} />}
              label="FDC"
              sx={{ height: 20, fontSize: 11, color: "#0f8f60", bgcolor: "rgba(18,165,106,0.11)" }}
            />
          )}
        </Stack>
        {hasMacros && (
          <Box sx={{ mt: 0.5 }}>
            <MiniMacroRing proteinG={entry.protein_g ?? 0} carbsG={entry.carbs_g ?? 0} fatG={entry.fat_g ?? 0} />
          </Box>
        )}
      </Box>
      {rightExtra}
      <Typography
        fontFamily="Roboto Mono, monospace"
        fontSize={15}
        fontWeight={500}
        sx={{ px: 1.5, py: 0.75, borderRadius: "12px", bgcolor: "#f2f3f8" }}
      >
        {entry.calories}
      </Typography>
      <IconButton size="small" onClick={onEdit} sx={{ border: "1px solid rgba(23,26,40,0.06)", borderRadius: "13px" }}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={onDelete}
        sx={{ border: "1px solid rgba(23,26,40,0.06)", borderRadius: "13px", "&:hover": { color: "error.main" } }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}
