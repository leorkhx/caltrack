import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMe } from "../api/users";
import { queryKeys } from "../api/queryClient";
import type { UserSettingsInput } from "../types";

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UserSettingsInput) => updateMe(input),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user);
    },
  });
}
