import { useQuery } from "@tanstack/react-query";
import { fetchReports } from "../api/admin";
import { queryKeys } from "../api/queryClient";

export function useReports() {
  return useQuery({
    queryKey: queryKeys.reports,
    queryFn: fetchReports,
  });
}
