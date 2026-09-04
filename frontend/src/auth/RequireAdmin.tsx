import { Navigate } from "react-router-dom";
import type { User } from "../types";
import type { ReactNode } from "react";
import { Box, CircularProgress } from "@mui/material";

interface RequireAdminProps {
  user: User | null;
  loading: boolean;
  children: ReactNode;
}

/** Client-side route guard: redirects non-admins away from admin screens.
 * This is UX only — the backend independently enforces 403 on every
 * admin-only endpoint regardless of what the frontend renders. */
export function RequireAdmin({ user, loading, children }: RequireAdminProps) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
