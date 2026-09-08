import { useQuery } from "@tanstack/react-query";
import { fetchTopFoods, type TopFoodsParams } from "../api/admin";
import { queryKeys } from "../api/queryClient";

export function useTopFoods(params: TopFoodsParams = {}) {
  return useQuery({
    queryKey: queryKeys.topFoods(params),
    queryFn: () => fetchTopFoods(params),
    placeholderData: (previous) => previous,
  });
}
