import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFavorite, deleteFavorite, fetchFavorites } from "../api/favorites";
import { queryKeys } from "../api/queryClient";
import type { FavoriteFoodInput } from "../types";

export function useFavorites() {
  return useQuery({
    queryKey: queryKeys.favorites,
    queryFn: fetchFavorites,
  });
}

export function useFavoriteMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.favorites });

  const create = useMutation({
    mutationFn: (input: FavoriteFoodInput) => createFavorite(input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) => deleteFavorite(id),
    onSuccess: invalidate,
  });

  return { create, remove };
}
