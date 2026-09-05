import LocalDiningIcon from "@mui/icons-material/LocalDining";
import ShieldPersonIcon from "@mui/icons-material/Shield";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ListAltIcon from "@mui/icons-material/ListAlt";
import BarChartIcon from "@mui/icons-material/BarChart";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import { Box, ButtonBase, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchAllEntries, fetchAllUsers, fetchReports } from "../api/admin";
import { queryKeys } from "../api/queryClient";
import type { User } from "../types";

const ADMIN_ENTRIES_DEFAULT_PARAMS = { page: 1, page_size: 10 };
const APP_NAME = import.meta.env.VITE_APP_NAME || "CalTrack";
const TEXT_TRANSITION = "max-width 0.22s ease, opacity 0.15s ease, margin 0.22s ease";
const RAIL_HOVER_SX = {
  borderRadius: "10px",
  color: "text.secondary",
  "&:hover": { bgcolor: "rgba(23,26,40,0.04)", color: "primary.main" },
};

interface SidebarContentProps {
  currentUser: User | null;
  onSignOut: () => void;
  /** Called after navigating to a route — used to close the mobile drawer. */
  onNavigate?: () => void;
  /** Omit for the mobile drawer, which is never shown collapsed. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/** Shrinks its content away via max-width/opacity instead of unmounting it,
 * so it animates in step with the sidebar's own width transition rather than
 * popping in/out and reflowing. */
function Collapsible({ collapsed, width, children }: { collapsed: boolean; width: number; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        maxWidth: collapsed ? 0 : width,
        opacity: collapsed ? 0 : 1,
        overflow: "hidden",
        whiteSpace: "nowrap",
        transition: TEXT_TRANSITION,
      }}
    >
      {children}
    </Box>
  );
}

export function SidebarContent({ currentUser, onSignOut, onNavigate, collapsed = false, onToggleCollapse }: SidebarContentProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isAdmin = currentUser?.role === "admin";

  const navItems = [
    { label: "My day", icon: <RestaurantIcon fontSize="small" />, path: "/", visible: true, onHover: undefined },
    {
      label: "All entries",
      icon: <ListAltIcon fontSize="small" />,
      path: "/admin/entries",
      visible: isAdmin,
      onHover: () => {
        queryClient.prefetchQuery({ queryKey: queryKeys.adminUsers, queryFn: fetchAllUsers });
        queryClient.prefetchQuery({
          queryKey: queryKeys.adminEntries(ADMIN_ENTRIES_DEFAULT_PARAMS),
          queryFn: () => fetchAllEntries(ADMIN_ENTRIES_DEFAULT_PARAMS),
        });
      },
    },
    {
      label: "Reports",
      icon: <BarChartIcon fontSize="small" />,
      path: "/admin/reports",
      visible: isAdmin,
      onHover: () => {
        queryClient.prefetchQuery({ queryKey: queryKeys.reports, queryFn: fetchReports });
      },
    },
  ].filter((n) => n.visible);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        px: collapsed ? "8px" : "16px",
        py: "22px",
        transition: "padding 0.22s ease",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent={collapsed ? "center" : "flex-start"} sx={{ px: collapsed ? 0 : 1, pb: 3 }}>
        {collapsed ? (
          onToggleCollapse && (
            <Tooltip title="Open sidebar">
              <IconButton size="small" onClick={onToggleCollapse} sx={RAIL_HOVER_SX}>
                <MenuIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          )
        ) : (
          <>
            <Box
              sx={{
                width: 42,
                height: 42,
                flex: "none",
                borderRadius: "14px",
                background: "linear-gradient(180deg, #6f6ff0 0%, #4f4fd0 100%)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 6px 14px -4px rgba(79,79,208,0.7)",
              }}
            >
              <LocalDiningIcon />
            </Box>
            <Box sx={{ pl: 1.25, flex: 1, minWidth: 0 }}>
              <Typography fontWeight={800} fontSize={16} lineHeight={1.2} noWrap>
                {APP_NAME}
              </Typography>
              <Typography fontSize={12} color="text.secondary" fontWeight={500} noWrap>
                calorie tracker
              </Typography>
            </Box>
            {onToggleCollapse && (
              <Tooltip title="Close sidebar">
                <IconButton size="small" onClick={onToggleCollapse} sx={{ flex: "none", borderRadius: "10px" }}>
                  <ChevronLeftIcon sx={{ fontSize: 19 }} />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      </Stack>

      <Stack gap={0.75} alignItems={collapsed ? "center" : "stretch"}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Tooltip key={item.path} title={collapsed ? item.label : ""} placement="right">
              <ButtonBase
                onMouseEnter={item.onHover}
                onClick={() => {
                  navigate(item.path);
                  onNavigate?.();
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: collapsed ? 0 : 1.5,
                  px: 1.75,
                  py: 1.4,
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: 14.5,
                  color: active ? "primary.main" : "text.secondary",
                  bgcolor: active ? "rgba(79,79,208,0.1)" : "transparent",
                  "&:hover": {
                    bgcolor: active ? "rgba(79,79,208,0.14)" : "rgba(23,26,40,0.04)",
                    color: active ? "primary.main" : "primary.main",
                  },
                }}
              >
                {item.icon}
                <Collapsible collapsed={collapsed} width={160}>
                  {item.label}
                </Collapsible>
              </ButtonBase>
            </Tooltip>
          );
        })}
      </Stack>

      {collapsed ? (
        <Stack gap={0.75} alignItems="center" sx={{ mt: "auto" }}>
          <Tooltip title="Settings" placement="right">
            <IconButton
              size="small"
              onClick={() => {
                navigate("/settings");
                onNavigate?.();
              }}
              sx={RAIL_HOVER_SX}
            >
              <SettingsIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sign out" placement="right">
            <IconButton size="small" onClick={onSignOut} sx={RAIL_HOVER_SX}>
              <LogoutIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      ) : (
        <Box sx={{ mt: "auto" }}>
          <Box sx={{ p: 1.75, borderRadius: "18px", bgcolor: "#f5f6fa", border: "1px solid rgba(23,26,40,0.05)" }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={0.5}>
              <Typography fontWeight={700} fontSize={14} noWrap sx={{ minWidth: 0 }}>
                {currentUser ? currentUser.name : "—"}
              </Typography>
              <Stack direction="row" gap={0.5}>
                <Tooltip title="Settings">
                  <IconButton
                    size="small"
                    onClick={() => {
                      navigate("/settings");
                      onNavigate?.();
                    }}
                    sx={{ borderRadius: "10px" }}
                  >
                    <SettingsIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sign out">
                  <IconButton size="small" onClick={onSignOut} sx={{ borderRadius: "10px" }}>
                    <LogoutIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
            <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 1 }}>
              <ShieldPersonIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography fontSize={10.5} fontWeight={700} letterSpacing={0.4} textTransform="uppercase" color="text.secondary" noWrap>
                {currentUser?.role ?? "—"}
              </Typography>
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
}
