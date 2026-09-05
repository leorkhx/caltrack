import type { ReactNode } from "react";
import { Box, CircularProgress, CssBaseline, ThemeProvider, Typography } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { RequireAdmin } from "./auth/RequireAdmin";
import { SignInPage } from "./pages/SignIn/SignInPage";
import { FoodEntriesPage } from "./pages/FoodEntries/FoodEntriesPage";
import { AllEntriesPage } from "./pages/Admin/AllEntriesPage";
import { ReportsPage } from "./pages/Admin/ReportsPage";
import { SettingsPage } from "./pages/Settings/SettingsPage";
import { FavoritesPage } from "./pages/Favorites/FavoritesPage";
import { useCurrentUser } from "./hooks/useCurrentUser";
import { clearActiveToken, getActiveToken } from "./auth/accounts";
import { queryClient } from "./api/queryClient";
import { theme } from "./theme";
import type { User } from "./types";

interface AppShellProps {
  user: User | null;
  loading: boolean;
  onSignOut: () => void;
  children: ReactNode;
}

function AppShell({ user, loading, onSignOut, children }: AppShellProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, minHeight: "100vh" }}>
      <Sidebar currentUser={user} onSignOut={onSignOut} />
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          p: { xs: "20px 16px 48px", sm: "28px 28px 64px", md: "34px 40px 90px 24px" },
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}>
            <CircularProgress />
          </Box>
        ) : !user ? (
          <Typography color="error">
            Could not resolve the active token to a user. Check it matches a token in backend/.env.
          </Typography>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
}

function AppRoutes() {
  const { user, loading, reload } = useCurrentUser();

  if (!getActiveToken()) {
    return <SignInPage onSignedIn={reload} />;
  }

  const handleSignOut = () => {
    clearActiveToken();
    queryClient.clear();
    reload();
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <AppShell user={user} loading={loading} onSignOut={handleSignOut}>
            {user && <FoodEntriesPage currentUser={user} />}
          </AppShell>
        }
      />
      <Route
        path="/admin/entries"
        element={
          <AppShell user={user} loading={loading} onSignOut={handleSignOut}>
            <RequireAdmin user={user} loading={loading}>
              {user && <AllEntriesPage currentUserId={user.id} />}
            </RequireAdmin>
          </AppShell>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <AppShell user={user} loading={loading} onSignOut={handleSignOut}>
            <RequireAdmin user={user} loading={loading}>
              <ReportsPage />
            </RequireAdmin>
          </AppShell>
        }
      />
      <Route
        path="/favorites"
        element={
          <AppShell user={user} loading={loading} onSignOut={handleSignOut}>
            <FavoritesPage />
          </AppShell>
        }
      />
      <Route
        path="/settings"
        element={
          <AppShell user={user} loading={loading} onSignOut={handleSignOut}>
            {user && <SettingsPage currentUser={user} />}
          </AppShell>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
