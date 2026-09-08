import { QueryClient } from "@tanstack/react-query";

/**
 * A shared cache means switching between pages (or coming back to one) shows
 * the last-known data instantly while a background refetch confirms it's
 * still current — no more full loading-spinner flash on every navigation.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  me: ["me"] as const,
  myEntries: (params: { date_from?: string; date_to?: string }) => ["food-entries", params] as const,
  adminUsers: ["admin-users"] as const,
  adminEntries: (params: {
    user_id?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }) => ["admin-entries", params] as const,
  reports: (params: { days?: number; all?: boolean; user_id?: number }) => ["reports", params] as const,
  topFoods: (params: { days?: number; all?: boolean; page?: number; page_size?: number }) => ["top-foods", params] as const,
  favorites: ["favorites"] as const,
};
