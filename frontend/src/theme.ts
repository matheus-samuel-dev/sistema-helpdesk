import { alpha, createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#1769d2' },
    success: { main: '#1b9850' },
    warning: { main: '#f0a51c' },
    error: { main: '#d94b4b' },
    background: {
      default: '#eef3f9',
      paper: '#ffffff',
    },
    text: {
      primary: '#172033',
      secondary: '#687386',
    },
    divider: '#dde5ef',
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          colorScheme: 'light',
        },
        body: {
          background:
            'radial-gradient(circle at top right, rgba(23, 105, 210, 0.08), transparent 28%), #eef3f9',
        },
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: '#b7c7dc transparent',
        },
        '*:focus-visible': {
          outline: '3px solid rgba(23, 105, 210, 0.34)',
          outlineOffset: '2px',
        },
        '@keyframes dashboardEnter': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes dashboardRise': {
          from: { opacity: 0, transform: 'scaleY(0.35)', transformOrigin: 'bottom' },
          to: { opacity: 1, transform: 'scaleY(1)', transformOrigin: 'bottom' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e6edf5',
          boxShadow: '0 12px 36px rgba(20, 34, 60, 0.07)',
          backdropFilter: 'blur(10px)',
          transition: 'transform .2s ease, box-shadow .2s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 42,
          borderRadius: 12,
          transition: 'transform .18s ease, box-shadow .18s ease, background-color .18s ease',
        },
        contained: {
          boxShadow: '0 12px 24px rgba(23, 105, 210, 0.18)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 16px 30px rgba(23, 105, 210, 0.24)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: alpha('#ffffff', 0.92),
          transition: 'box-shadow .18s ease, border-color .18s ease',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha('#1769d2', 0.5),
          },
          '&.Mui-focused': {
            boxShadow: `0 0 0 4px ${alpha('#1769d2', 0.1)}`,
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
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'background-color .18s ease, transform .18s ease',
          '&:hover': {
            backgroundColor: alpha('#1769d2', 0.08),
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color .18s ease',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 10,
          backgroundColor: '#172033',
          fontSize: 12,
        },
      },
    },
  },
});
