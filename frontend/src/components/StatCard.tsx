import { Box, Card, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tint?: string;
  iconColor?: string;
}

export function StatCard({ icon, label, value, note, tint = "rgba(79,79,208,0.1)", iconColor = "#4f4fd0" }: StatCardProps) {
  return (
    <Card sx={{ p: 2.75, display: "flex", flexDirection: "column" }}>
      <Stack direction="row" alignItems="center" gap={1.25}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "12px",
            bgcolor: tint,
            color: iconColor,
            display: "grid",
            placeItems: "center",
          }}
        >
          {icon}
        </Box>
        <Typography fontSize={12.5} fontWeight={700} color="text.secondary">
          {label}
        </Typography>
      </Stack>
      <Typography fontFamily="Roboto Mono, monospace" fontSize={30} fontWeight={500} letterSpacing={-1.2} sx={{ my: "12px" }}>
        {value}
      </Typography>
      {note && (
        <Typography fontSize={12.5} fontWeight={500} color="text.secondary" sx={{ lineHeight: 1.4 }}>
          {note}
        </Typography>
      )}
    </Card>
  );
}
