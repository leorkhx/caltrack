import type { ReactNode } from "react";
import { Box, CircularProgress, CssBaseline, ThemeProvider, Typography } from "@mui/material";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { RequireAdmin } from "./auth/RequireAdmin";
import { FoodEntriesPage } from "./pages/FoodEntries/FoodEntriesPage";
import { AllEntriesPage } from "./pages/Admin/AllEntriesPage";
import { ReportsPage } from "./pages/Admin/ReportsPage";
import { useCurrentUser } from "./hooks/useCurrentUser";
import { getActiveToken } from "./auth/accounts";
import { theme } from "./theme";

function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useCurrentUser();

  if (!getActiveToken()) {
    return (
      <Box sx={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <Typography color="error">
          VITE_AUTH_TOKEN is not set. Copy frontend/.env.example to frontend/.env and set it to one
          of the backend's predefined tokens.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar currentUser={user} />
      <Box sx={{ flex: 1, minWidth: 0, p: "34px 40px 90px 24px", maxWidth: 1240 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}>
            <CircularProgress />
          </Box>
        ) : !user ? (
          <Typography color="error">
            Could not resolve VITE_AUTH_TOKEN to a user. Check it matches a token in backend/.env.
          </Typography>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
}

function AppRoutes() {
  const { user, loading } = useCurrentUser();

  return (
    <Routes>
      <Route
        path="/"
        element={<AppShell>{user && <FoodEntriesPage currentUser={user} />}</AppShell>}
      />
      <Route
        path="/admin/entries"
        element={
          <AppShell>
            <RequireAdmin user={user} loading={loading}>
              {user && <AllEntriesPage currentUserId={user.id} />}
            </RequireAdmin>
          </AppShell>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <AppShell>
            <RequireAdmin user={user} loading={loading}>
              <ReportsPage />
            </RequireAdmin>
          </AppShell>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
