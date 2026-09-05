import { useEffect, useState } from "react";
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Stack, TextField, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import { useFavoriteMutations } from "../../hooks/useFavorites";
import type { FavoriteFood } from "../../types";

interface FavoriteDialogProps {
  open: boolean;
  onClose: () => void;
  initialFavorite?: FavoriteFood | null;
}

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function toText(value: number | null): string {
  return value === null ? "" : String(value);
}

export function FavoriteDialog({ open, onClose, initialFavorite }: FavoriteDialogProps) {
  const isEdit = Boolean(initialFavorite);
  const { create, update } = useFavoriteMutations();
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialFavorite) {
      setName(initialFavorite.food_name);
      setCalories(String(initialFavorite.calories));
      setProtein(toText(initialFavorite.protein_g));
      setCarbs(toText(initialFavorite.carbs_g));
      setFat(toText(initialFavorite.fat_g));
    } else {
      setName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
    }
    setTouched(false);
  }, [open, initialFavorite]);

  const nameError = touched && name.trim().length < 2 ? "Use at least 2 characters." : "";
  const caloriesError =
    touched && (!/^\d+$/.test(calories) || Number(calories) < 1) ? "Enter a positive whole number." : "";
  const hasErrors = Boolean(nameError || caloriesError);
  const mutation = isEdit ? update : create;

  const handleSubmit = async () => {
    setTouched(true);
    if (name.trim().length < 2 || !/^\d+$/.test(calories) || Number(calories) < 1) return;
    const input = {
      food_name: name.trim(),
      calories: Number(calories),
      protein_g: protein === "" ? null : Number(protein),
      carbs_g: carbs === "" ? null : Number(carbs),
      fat_g: fat === "" ? null : Number(fat),
      from_fdc: initialFavorite?.from_fdc ?? false,
    };
    if (isEdit && initialFavorite) {
      await update.mutateAsync({ id: initialFavorite.id, input });
    } else {
      await create.mutateAsync(input);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.75, pb: 1 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "15px",
            bgcolor: "rgba(217,138,15,0.14)",
            color: "#a9690a",
            display: "grid",
            placeItems: "center",
          }}
        >
          <StarIcon />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography fontSize={20} fontWeight={800} letterSpacing={-0.4}>
            {isEdit ? "Edit favorite" : "Add a favorite"}
          </Typography>
          <Typography fontSize={13} fontWeight={500} color="text.secondary">
            {isEdit ? "Update this saved food" : "Save a food you log often for quick reuse later"}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 0.5 }}>
          <TextField
            label="Food name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={Boolean(nameError)}
            helperText={nameError}
            fullWidth
            autoFocus
          />
          <TextField
            label="Calories"
            value={calories}
            onChange={(e) => setCalories(digitsOnly(e.target.value))}
            error={Boolean(caloriesError)}
            helperText={caloriesError}
            fullWidth
            slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>kcal</Typography> } }}
          />
          <Stack direction="row" gap={1.5}>
            <TextField
              label="Protein"
              value={protein}
              onChange={(e) => setProtein(digitsOnly(e.target.value))}
              placeholder="optional"
              sx={{ flex: 1 }}
              slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>g</Typography> } }}
            />
            <TextField
              label="Carbs"
              value={carbs}
              onChange={(e) => setCarbs(digitsOnly(e.target.value))}
              placeholder="optional"
              sx={{ flex: 1 }}
              slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>g</Typography> } }}
            />
            <TextField
              label="Fat"
              value={fat}
              onChange={(e) => setFat(digitsOnly(e.target.value))}
              placeholder="optional"
              sx={{ flex: 1 }}
              slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>g</Typography> } }}
            />
          </Stack>
          {mutation.isError && (
            <Alert severity="error" sx={{ borderRadius: "14px" }}>
              Couldn't save that favorite. Please try again.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <Stack direction="row" justifyContent="flex-end" gap={1.5} sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={mutation.isPending || hasErrors}>
          {isEdit ? "Save changes" : "Add favorite"}
        </Button>
      </Stack>
    </Dialog>
  );
}
