import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMyEntry,
  deleteMyEntry,
  fetchMyEntries,
  fetchMyEntriesCount,
  updateMyEntry,
  type DateRangeParams,
} from "../api/foodEntries";
import { queryKeys } from "../api/queryClient";
import type { FoodEntryInput } from "../types";

export function useMyEntries(params: DateRangeParams) {
  return useQuery({
    queryKey: queryKeys.myEntries(params),
    queryFn: () => fetchMyEntries(params),
    placeholderData: (previous) => previous,
  });
}

export function useMyEntriesCount(params: DateRangeParams) {
  return useQuery({
    queryKey: queryKeys.myEntriesCount(params),
    queryFn: () => fetchMyEntriesCount(params),
    placeholderData: (previous) => previous,
  });
}

export function useMyEntryMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["food-entries"] });

  const create = useMutation({
    mutationFn: (input: FoodEntryInput) => createMyEntry(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<FoodEntryInput> }) => updateMyEntry(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) => deleteMyEntry(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
