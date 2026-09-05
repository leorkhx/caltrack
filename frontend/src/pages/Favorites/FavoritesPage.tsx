import { useState } from "react";
import { Alert, Box, Button, Card, CircularProgress, IconButton, Stack, TextField, Typography } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFavoriteMutations, useFavorites } from "../../hooks/useFavorites";

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export function FavoritesPage() {
  const { data: favorites = [], isLoading } = useFavorites();
  const { create, remove } = useFavoriteMutations();

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [touched, setTouched] = useState(false);

  const nameError = touched && name.trim().length < 2 ? "Use at least 2 characters." : "";
  const caloriesError = touched && (!/^\d+$/.test(calories) || Number(calories) < 1) ? "Enter a positive whole number." : "";
  const hasErrors = Boolean(nameError || caloriesError);

  const handleAdd = async () => {
    setTouched(true);
    if (name.trim().length < 2 || !/^\d+$/.test(calories) || Number(calories) < 1) return;
    await create.mutateAsync({
      food_name: name.trim(),
      calories: Number(calories),
      protein_g: protein === "" ? null : Number(protein),
      carbs_g: carbs === "" ? null : Number(carbs),
      fat_g: fat === "" ? null : Number(fat),
      from_fdc: false,
    });
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setTouched(false);
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={1.25} sx={{ mb: 3 }}>
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
            Foods you log often — they show up first, starred, when you search
          </Typography>
        </Box>
      </Stack>

      <Card sx={{ p: 3, mb: 2.5 }}>
        <Typography fontWeight={700} fontSize={15} sx={{ mb: 2 }}>
          Add a favorite
        </Typography>
        <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="flex-start">
          <TextField
            label="Food name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={Boolean(nameError)}
            helperText={nameError}
            sx={{ flex: "2 1 220px" }}
          />
          <TextField
            label="Calories"
            value={calories}
            onChange={(e) => setCalories(digitsOnly(e.target.value))}
            error={Boolean(caloriesError)}
            helperText={caloriesError}
            sx={{ flex: "1 1 120px" }}
            slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>kcal</Typography> } }}
          />
          <TextField
            label="Protein"
            value={protein}
            onChange={(e) => setProtein(digitsOnly(e.target.value))}
            placeholder="optional"
            sx={{ flex: "1 1 100px" }}
            slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>g</Typography> } }}
          />
          <TextField
            label="Carbs"
            value={carbs}
            onChange={(e) => setCarbs(digitsOnly(e.target.value))}
            placeholder="optional"
            sx={{ flex: "1 1 100px" }}
            slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>g</Typography> } }}
          />
          <TextField
            label="Fat"
            value={fat}
            onChange={(e) => setFat(digitsOnly(e.target.value))}
            placeholder="optional"
            sx={{ flex: "1 1 100px" }}
            slotProps={{ input: { endAdornment: <Typography color="text.secondary" fontSize={13}>g</Typography> } }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={create.isPending || hasErrors}
            sx={{ flex: "0 0 auto", py: 1.4 }}
          >
            Add
          </Button>
        </Stack>
        {create.isError && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: "14px" }}>
            Couldn't add that favorite. Please try again.
          </Alert>
        )}
      </Card>

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={26} />
        </Stack>
      ) : favorites.length === 0 ? (
        <Card sx={{ p: 6, textAlign: "center" }}>
          <Typography fontSize={15} fontWeight={600} color="text.secondary">
            No favorites yet — add one above, or save a food from the log dialog next time.
          </Typography>
        </Card>
      ) : (
        <Card sx={{ p: 1.5 }}>
          {favorites.map((f) => (
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
                onClick={() => remove.mutate(f.id)}
                sx={{ border: "1px solid rgba(23,26,40,0.06)", borderRadius: "12px", "&:hover": { color: "error.main" } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
        </Card>
      )}
    </Box>
  );
}
