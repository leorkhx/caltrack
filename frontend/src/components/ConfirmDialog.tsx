import { Box, Button, Dialog, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.75, pb: 1 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            flex: "none",
            borderRadius: "15px",
            bgcolor: danger ? "rgba(229,72,77,0.13)" : "rgba(79,79,208,0.1)",
            color: danger ? "#e5484d" : "primary.main",
            display: "grid",
            placeItems: "center",
          }}
        >
          <WarningAmberIcon />
        </Box>
        <Typography fontSize={18} fontWeight={800} letterSpacing={-0.3}>
          {title}
        </Typography>
      </DialogTitle>
      {description && (
        <DialogContent sx={{ pt: 0.5 }}>
          <Typography fontSize={14} color="text.secondary">
            {description}
          </Typography>
        </DialogContent>
      )}
      <Stack direction="row" justifyContent="flex-end" gap={1.5} sx={{ p: 3, pt: description ? 1 : 2.5 }}>
        <Button onClick={onCancel} color="inherit">
          {cancelLabel}
        </Button>
        <Button variant="contained" color={danger ? "error" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </Stack>
    </Dialog>
  );
}
