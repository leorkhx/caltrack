import { useCallback, useEffect, useState } from "react";
import { fetchMe } from "../api/users";
import { getActiveToken } from "../auth/accounts";
import type { User } from "../types";

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!getActiveToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const me = await fetchMe();
      setUser(me);
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : "Failed to load user.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { user, loading, error, reload };
}
