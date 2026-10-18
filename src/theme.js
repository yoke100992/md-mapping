import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0D9488', light: '#2DD4BF', dark: '#0F766E', contrastText: '#FFFFFF' },
    secondary: { main: '#172B4D', light: '#334766', dark: '#101F38', contrastText: '#FFFFFF' },
    background: { default: '#F4F7FA', paper: '#FFFFFF' },
    text: { primary: '#1E293B', secondary: '#64748B' },
    divider: '#E2E8F0',
    success: { main: '#15803D' }, warning: { main: '#B45309' }, error: { main: '#DC2626' },
  },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 750, letterSpacing: '-0.035em', fontSize: '1.75rem' },
    h5: { fontWeight: 700, letterSpacing: '-0.025em' },
    h6: { fontWeight: 700, letterSpacing: '-0.015em' },
    button: { fontWeight: 650, textTransform: 'none' },
    body2: { lineHeight: 1.55 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: { styleOverrides: { body: { backgroundColor: '#F4F7FA' } } },
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 650, borderRadius: 9, boxShadow: 'none', minHeight: 38 }, contained: { '&:hover': { boxShadow: 'none' } } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 14, border: '1px solid #E7EDF3', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.035)', backgroundImage: 'none' } } },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 14 } } },
    MuiAppBar: { styleOverrides: { root: { boxShadow: '0 1px 0 rgba(15,23,42,.08)', backgroundImage: 'none' } } },
    MuiTableCell: { styleOverrides: { head: { backgroundColor: '#F8FAFC', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap' }, root: { borderColor: '#E8EDF3' } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 9, backgroundColor: '#FFFFFF' } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
  },
});

export default theme;
