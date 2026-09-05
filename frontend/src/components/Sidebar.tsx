import { useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import LocalDiningIcon from "@mui/icons-material/LocalDining";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { AppBar, Box, Drawer, IconButton, Paper, Toolbar, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { SidebarContent } from "./SidebarContent";
import type { User } from "../types";

interface SidebarProps {
  currentUser: User | null;
  onSignOut: () => void;
}

const DRAWER_WIDTH = 280;
const SIDEBAR_WIDTH = 264;
const APP_NAME = import.meta.env.VITE_APP_NAME || "CalTrack";
const COLLAPSED_KEY = "calorie-tracker.sidebar-collapsed";

export function Sidebar({ currentUser, onSignOut }: SidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === "1");

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  };

  if (isMobile) {
    return (
      <>
        <AppBar
          position="sticky"
          elevation={0}
          color="transparent"
          sx={{
            bgcolor: "background.paper",
            borderBottom: "1px solid rgba(23,26,40,0.06)",
          }}
        >
          <Toolbar sx={{ gap: 1.25 }}>
            <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </IconButton>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: "10px",
                background: "linear-gradient(180deg, #6f6ff0 0%, #4f4fd0 100%)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
              }}
            >
              <LocalDiningIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography fontWeight={800} fontSize={15}>
              {APP_NAME}
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: DRAWER_WIDTH, borderRadius: "0 24px 24px 0" } }}
        >
          <SidebarContent currentUser={currentUser} onSignOut={onSignOut} onNavigate={() => setMobileOpen(false)} />
        </Drawer>
      </>
    );
  }

  return (
    <Box sx={{ display: "flex", flex: "none", position: "sticky", top: 0, height: "100vh" }}>
      <Box
        sx={{
          width: collapsed ? 0 : SIDEBAR_WIDTH,
          p: collapsed ? 0 : "22px 0 22px 22px",
          overflow: "hidden",
          transition: "width 0.22s ease, padding 0.22s ease",
          height: "100vh",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: SIDEBAR_WIDTH - 22,
            height: "100%",
            borderRadius: "26px",
            border: "1px solid rgba(23,26,40,0.05)",
            boxShadow:
              "0 1px 2px rgba(23,26,40,0.04), 0 18px 40px -18px rgba(23,26,40,0.28), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          <SidebarContent currentUser={currentUser} onSignOut={onSignOut} />
        </Paper>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", height: "100vh" }}>
        <IconButton
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
          sx={{
            width: 22,
            height: 44,
            borderRadius: "0 12px 12px 0",
            bgcolor: "background.paper",
            border: "1px solid rgba(23,26,40,0.06)",
            borderLeft: "none",
            color: "text.secondary",
            "&:hover": { bgcolor: "#f6f7fb", color: "primary.main" },
          }}
        >
          {collapsed ? <ChevronRightIcon sx={{ fontSize: 18 }} /> : <ChevronLeftIcon sx={{ fontSize: 18 }} />}
        </IconButton>
      </Box>
    </Box>
  );
}
