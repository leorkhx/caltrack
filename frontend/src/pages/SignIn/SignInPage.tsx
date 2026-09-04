import { useState } from "react";
import { Alert, Box, Button, Card, Stack, TextField, Typography } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { fetchMe } from "../../api/users";
import { setActiveToken } from "../../auth/accounts";

interface SignInPageProps {
  onSignedIn: () => void;
}

/**
 * Not a real login: there is no signup, no password, no server session.
 * This just lets you paste one of the backend's predefined bearer tokens
 * (USER_TOKEN / USER2_TOKEN / ADMIN_TOKEN) instead of editing an env var.
 * The token is validated by calling /api/users/me before being stored.
 */
export function SignInPage({ onSignedIn }: SignInPageProps) {
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    setActiveToken(trimmed);
    try {
      await fetchMe();
      onSignedIn();
    } catch {
      setError("That token isn't recognized. Check it against backend/.env and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", p: 3 }}>
      <Card sx={{ width: 420, maxWidth: "100%", p: 4 }}>
        <Stack alignItems="center" gap={1.5} sx={{ mb: 3 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "16px",
              background: "linear-gradient(180deg, #6f6ff0 0%, #4f4fd0 100%)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 8px 18px -8px rgba(79,79,208,0.8)",
            }}
          >
            <BoltIcon fontSize="large" />
          </Box>
          <Typography fontSize={22} fontWeight={800} letterSpacing={-0.4}>
            Sign in to Kcal
          </Typography>
          <Typography fontSize={13.5} color="text.secondary" textAlign="center">
            Paste your predefined bearer token below. No signup — tokens are
            issued and changed on the backend.
          </Typography>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack gap={2}>
            <TextField
              label="Bearer token"
              placeholder="user-token-luiza"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoFocus
              fullWidth
              slotProps={{
                input: {
                  startAdornment: <VpnKeyIcon sx={{ mr: 1, fontSize: 20, color: "text.secondary" }} />,
                },
              }}
              sx={{ "& input": { fontFamily: "Roboto Mono, monospace", fontSize: 14 } }}
            />
            {error && (
              <Alert severity="error" sx={{ borderRadius: "14px" }}>
                {error}
              </Alert>
            )}
            <Button type="submit" variant="contained" size="large" disabled={submitting || !token.trim()}>
              {submitting ? "Checking…" : "Sign in"}
            </Button>
          </Stack>
        </form>
      </Card>
    </Box>
  );
}
