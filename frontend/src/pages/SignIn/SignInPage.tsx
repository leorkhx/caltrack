import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LocalDiningIcon from "@mui/icons-material/LocalDining";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { fetchMe } from "../../api/users";
import { clearActiveToken, setActiveToken } from "../../auth/accounts";

const APP_NAME = import.meta.env.VITE_APP_NAME || "CalTrack";

interface SignInPageProps {
  onSignedIn: () => void;
}

/**
 * Looks like a normal username/password login, but there is no signup and
 * no server session underneath — per the assignment, auth is a predefined
 * per-user bearer token (see backend/.env). The password field's value is
 * that token; "username" is just the account's email, checked against what
 * the token actually resolves to so a mismatched pair reads as invalid
 * credentials rather than exposing which field was wrong.
 */
export function SignInPage({ onSignedIn }: SignInPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = username.trim().toLowerCase();
    const token = password.trim();
    if (!email || !token) return;
    setSubmitting(true);
    setError(null);
    setActiveToken(token);
    try {
      const me = await fetchMe();
      if (me.email.toLowerCase() !== email) {
        clearActiveToken();
        setError("Invalid username or password.");
        return;
      }
      onSignedIn();
    } catch {
      clearActiveToken();
      setError("Invalid username or password.");
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
            <LocalDiningIcon fontSize="large" />
          </Box>
          <Typography fontSize={22} fontWeight={800} letterSpacing={-0.4}>
            Sign in to {APP_NAME}
          </Typography>
          <Typography fontSize={13.5} color="text.secondary" textAlign="center">
            Enter your account details to continue.
          </Typography>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack gap={2}>
            <TextField
              label="Username"
              placeholder="you@example.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              fullWidth
              autoComplete="username"
              slotProps={{
                input: {
                  startAdornment: <PersonOutlineIcon sx={{ mr: 1, fontSize: 20, color: "text.secondary" }} />,
                },
              }}
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              autoComplete="current-password"
              slotProps={{
                input: {
                  startAdornment: <LockOutlinedIcon sx={{ mr: 1, fontSize: 20, color: "text.secondary" }} />,
                  endAdornment: (
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  ),
                },
              }}
            />
            {error && (
              <Alert severity="error" sx={{ borderRadius: "14px" }}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting || !username.trim() || !password.trim()}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </Stack>
        </form>
      </Card>
    </Box>
  );
}
