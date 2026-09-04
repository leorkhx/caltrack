import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#4f4fd0",
      light: "#6f6ff0",
      dark: "#3d3dab",
      contrastText: "#ffffff",
    },
    success: { main: "#0f8f60" },
    error: { main: "#e5484d" },
    warning: { main: "#c8790a" },
    background: {
      default: "#eef0f4",
      paper: "#ffffff",
    },
    text: {
      primary: "#171a28",
      secondary: "#7a8096",
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: [
      "Plus Jakarta Sans",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "sans-serif",
    ].join(","),
    fontWeightBold: 800,
    h1: { fontWeight: 800, letterSpacing: -1 },
    h2: { fontWeight: 800, letterSpacing: -0.9 },
    h4: { fontWeight: 800, letterSpacing: -0.5 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(1200px 600px at 12% -10%, #ffffff 0%, #eef0f4 55%, #e9ebf1 100%)",
          backgroundAttachment: "fixed",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 26,
          border: "1px solid rgba(23,26,40,0.05)",
          boxShadow:
            "0 1px 2px rgba(23,26,40,0.04), 0 22px 44px -26px rgba(23,26,40,0.45), inset 0 1px 0 rgba(255,255,255,0.9)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          textTransform: "none",
          fontWeight: 700,
        },
        containedPrimary: {
          backgroundImage: "linear-gradient(180deg, #6f6ff0 0%, #4f4fd0 100%)",
          boxShadow:
            "0 10px 22px -8px rgba(79,79,208,0.85), inset 0 1px 0 rgba(255,255,255,0.35)",
          "&:hover": {
            backgroundImage: "linear-gradient(180deg, #6f6ff0 0%, #4f4fd0 100%)",
            boxShadow:
              "0 16px 28px -10px rgba(79,79,208,0.9), inset 0 1px 0 rgba(255,255,255,0.4)",
            transform: "translateY(-1px)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 10,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: "#fbfbfe",
        },
        notchedOutline: {
          borderColor: "rgba(23,26,40,0.1)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 30,
          boxShadow: "0 40px 90px -30px rgba(15,17,26,0.75)",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 13,
        },
      },
    },
  },
});
