import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEntryAsAdmin,
  deleteEntryAsAdmin,
  fetchAllEntries,
  fetchAllUsers,
  updateEntryAsAdmin,
  type AdminListParams,
} from "../api/admin";
import { queryKeys } from "../api/queryClient";
import type { FoodEntryInput } from "../types";

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: fetchAllUsers,
  });
}

export function useAdminEntries(params: AdminListParams) {
  return useQuery({
    queryKey: queryKeys.adminEntries(params),
    queryFn: () => fetchAllEntries(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminEntryMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-entries"] });

  const create = useMutation({
    mutationFn: (input: FoodEntryInput) => createEntryAsAdmin(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<FoodEntryInput> }) => updateEntryAsAdmin(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) => deleteEntryAsAdmin(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
