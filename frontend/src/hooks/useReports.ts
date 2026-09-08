import { useQuery } from "@tanstack/react-query";
import { fetchReports, type ReportsParams } from "../api/admin";
import { queryKeys } from "../api/queryClient";

export function useReports(params: ReportsParams = {}) {
  return useQuery({
    queryKey: queryKeys.reports(params),
    queryFn: () => fetchReports(params),
    placeholderData: (previous) => previous,
  });
}
