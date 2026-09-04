import BoltIcon from "@mui/icons-material/Bolt";
import ShieldPersonIcon from "@mui/icons-material/Shield";
import LogoutIcon from "@mui/icons-material/Logout";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ListAltIcon from "@mui/icons-material/ListAlt";
import BarChartIcon from "@mui/icons-material/BarChart";
import { Box, ButtonBase, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import type { User } from "../types";

interface SidebarProps {
  currentUser: User | null;
  onSignOut: () => void;
}

export function Sidebar({ currentUser, onSignOut }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = currentUser?.role === "admin";

  const navItems = [
    { label: "My day", icon: <RestaurantIcon fontSize="small" />, path: "/", visible: true },
    { label: "All entries", icon: <ListAltIcon fontSize="small" />, path: "/admin/entries", visible: isAdmin },
    { label: "Reports", icon: <BarChartIcon fontSize="small" />, path: "/admin/reports", visible: isAdmin },
  ].filter((n) => n.visible);

  return (
    <Box sx={{ width: 264, flex: "none", p: "22px 16px 22px 22px", position: "sticky", top: 0, height: "100vh" }}>
      <Paper
        elevation={0}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: "26px",
          p: "22px 16px",
          border: "1px solid rgba(23,26,40,0.05)",
          boxShadow:
            "0 1px 2px rgba(23,26,40,0.04), 0 18px 40px -18px rgba(23,26,40,0.28), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ px: 1, pb: 3 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "14px",
              background: "linear-gradient(180deg, #6f6ff0 0%, #4f4fd0 100%)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 6px 14px -4px rgba(79,79,208,0.7)",
            }}
          >
            <BoltIcon />
          </Box>
          <Box>
            <Typography fontWeight={800} fontSize={16} lineHeight={1.2}>
              Kcal
            </Typography>
            <Typography fontSize={12} color="text.secondary" fontWeight={500}>
              calorie tracker
            </Typography>
          </Box>
        </Stack>

        <Stack gap={0.75}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <ButtonBase
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 1.75,
                  py: 1.4,
                  borderRadius: "14px",
                  justifyContent: "flex-start",
                  fontWeight: 700,
                  fontSize: 14.5,
                  color: active ? "primary.main" : "text.secondary",
                  bgcolor: active ? "rgba(79,79,208,0.1)" : "transparent",
                  "&:hover": { bgcolor: active ? "rgba(79,79,208,0.14)" : "rgba(23,26,40,0.04)" },
                }}
              >
                {item.icon}
                {item.label}
              </ButtonBase>
            );
          })}
        </Stack>

        <Box sx={{ mt: "auto" }}>
          <Box sx={{ p: 1.75, borderRadius: "18px", bgcolor: "#f5f6fa", border: "1px solid rgba(23,26,40,0.05)" }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  fontSize={11}
                  fontWeight={700}
                  letterSpacing={0.8}
                  textTransform="uppercase"
                  color="text.secondary"
                >
                  Signed in as
                </Typography>
                <Typography fontWeight={700} fontSize={14} sx={{ mt: 0.75 }} noWrap>
                  {currentUser ? currentUser.name : "—"}
                </Typography>
              </Box>
              <Tooltip title="Sign out">
                <IconButton size="small" onClick={onSignOut} sx={{ borderRadius: "10px" }}>
                  <LogoutIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Stack>
            <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 1, overflow: "hidden" }}>
              <ShieldPersonIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography fontSize={10.5} fontWeight={700} letterSpacing={0.4} textTransform="uppercase" color="text.secondary" noWrap>
                {currentUser?.role ?? "—"}
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
