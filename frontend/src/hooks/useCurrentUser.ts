import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "../api/users";
import { getActiveToken } from "../auth/accounts";
import { queryKeys } from "../api/queryClient";

export function useCurrentUser() {
  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    enabled: Boolean(getActiveToken()),
  });

  return {
    user: query.data ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    reload: query.refetch,
  };
}
