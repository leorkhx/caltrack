import { Button, Stack, TextField } from "@mui/material";
import DateRangeIcon from "@mui/icons-material/DateRange";

interface FiltersBarProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onReset?: () => void;
  quickRanges?: { label: string; days: number | null }[];
  onQuickRange?: (days: number | null) => void;
  activeRangeDays?: number | null;
}

const DEFAULT_RANGES = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "All", days: null },
];

export function FiltersBar({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onReset,
  quickRanges = DEFAULT_RANGES,
  onQuickRange,
  activeRangeDays,
}: FiltersBarProps) {
  return (
    <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap" sx={{ mb: 2.5 }}>
      {onQuickRange && (
        <Stack direction="row" gap={0.5} sx={{ p: 0.5, bgcolor: "#e7e9f0", borderRadius: "15px" }}>
          {quickRanges.map((r) => (
            <Button
              key={r.label}
              size="small"
              onClick={() => onQuickRange(r.days)}
              sx={{
                borderRadius: "11px",
                px: 1.75,
                minWidth: 0,
                color: activeRangeDays === r.days ? "#fff" : "text.secondary",
                bgcolor: activeRangeDays === r.days ? "primary.main" : "transparent",
                "&:hover": { bgcolor: activeRangeDays === r.days ? "primary.dark" : "rgba(23,26,40,0.06)" },
              }}
            >
              {r.label}
            </Button>
          ))}
        </Stack>
      )}
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{ px: 1.5, py: 0.5, bgcolor: "#fff", borderRadius: "15px", border: "1px solid rgba(23,26,40,0.06)" }}
      >
        <DateRangeIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        <TextField
          type="date"
          variant="standard"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          slotProps={{ input: { disableUnderline: true } }}
          sx={{ width: 132 }}
        />
        <span style={{ color: "#c3c7d4", fontWeight: 700 }}>-</span>
        <TextField
          type="date"
          variant="standard"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          slotProps={{ input: { disableUnderline: true } }}
          sx={{ width: 132 }}
        />
      </Stack>
      {onReset && (
        <Button variant="outlined" size="small" onClick={onReset} sx={{ borderColor: "rgba(23,26,40,0.1)", color: "text.secondary" }}>
          Reset
        </Button>
      )}
    </Stack>
  );
}
