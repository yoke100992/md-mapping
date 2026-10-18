
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',

        primary: {
            main: '#0D9488',
            light: '#2DD4BF',
            dark: '#0F766E',
            contrastText: '#FFFFFF',
        },

        secondary: {
            main: '#172B4D',
            light: '#334766',
            dark: '#101F38',
            contrastText: '#FFFFFF',
        },

        background: {
            default: '#F5F7FB',
            paper: '#FFFFFF',
        },

        text: {
            primary: '#172033',
            secondary: '#64748B',
        },

        divider: '#E7ECF2',

        success: {
            main: '#059669',
            light: '#D1FAE5',
            dark: '#047857',
        },

        warning: {
            main: '#D97706',
            light: '#FEF3C7',
            dark: '#92400E',
        },

        error: {
            main: '#DC2626',
            light: '#FEE2E2',
            dark: '#B91C1C',
        },

        info: {
            main: '#2563EB',
            light: '#DBEAFE',
            dark: '#1D4ED8',
        },
    },

    typography: {
        fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

        h1: {
            fontSize: '2rem',
            fontWeight: 800,
            letterSpacing: '-0.045em',
            lineHeight: 1.2,
        },

        h2: {
            fontSize: '1.75rem',
            fontWeight: 750,
            letterSpacing: '-0.035em',
        },

        h3: {
            fontSize: '1.5rem',
            fontWeight: 750,
            letterSpacing: '-0.03em',
        },

        h4: {
            fontSize: '1.375rem',
            fontWeight: 750,
            letterSpacing: '-0.025em',
        },

        h5: {
            fontSize: '1.125rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
        },

        h6: {
            fontSize: '1rem',
            fontWeight: 700,
            letterSpacing: '-0.015em',
        },

        subtitle1: {
            fontSize: '0.9375rem',
            fontWeight: 600,
        },

        body1: {
            fontSize: '0.875rem',
            lineHeight: 1.65,
        },

        body2: {
            fontSize: '0.8125rem',
            lineHeight: 1.6,
        },

        caption: {
            fontSize: '0.6875rem',
            lineHeight: 1.5,
        },

        button: {
            fontWeight: 650,
            textTransform: 'none',
            letterSpacing: 0,
        },
    },

    shape: {
        borderRadius: 12,
    },

    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1536,
        },
    },

    components: {
        MuiCssBaseline: {
            styleOverrides: {
                html: {
                    width: '100%',
                    minHeight: '100%',
                    WebkitTextSizeAdjust: '100%',
                },

                body: {
                    margin: 0,
                    minWidth: 0,
                    minHeight: '100vh',
                    backgroundColor: '#F5F7FB',
                    color: '#172033',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                },

                '#root': {
                    minHeight: '100vh',
                    width: '100%',
                    minWidth: 0,
                },

                '*': {
                    boxSizing: 'border-box',
                },

                'button, input, textarea, select': {
                    font: 'inherit',
                },

                'img, svg': {
                    maxWidth: '100%',
                },

                '*::-webkit-scrollbar': {
                    width: 6,
                    height: 6,
                },

                '*::-webkit-scrollbar-thumb': {
                    backgroundColor: '#CBD5E1',
                    borderRadius: 8,
                },

                '*::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent',
                },
            },
        },

        MuiButton: {
            styleOverrides: {
                root: {
                    minHeight: 40,
                    borderRadius: 10,
                    padding: '8px 16px',
                    fontWeight: 650,
                    boxShadow: 'none',
                    transition: 'background-color 160ms ease',
                },

                contained: {
                    boxShadow: 'none',

                    '&:hover': {
                        boxShadow: 'none',
                    },
                },

                outlined: {
                    borderColor: '#D8E0E9',

                    '&:hover': {
                        borderColor: '#0D9488',
                        backgroundColor: '#F0FDFA',
                    },
                },

                sizeSmall: {
                    minHeight: 32,
                    padding: '5px 11px',
                },
            },
        },

        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 14,
                    border: '1px solid #E7ECF2',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.035)',
                    backgroundImage: 'none',
                    overflow: 'hidden',
                },
            },
        },

        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },

                rounded: {
                    borderRadius: 14,
                },

                elevation1: {
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.035)',
                },
            },
        },

        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                    backgroundImage: 'none',
                },
            },
        },

        MuiToolbar: {
            styleOverrides: {
                root: {
                    '@media (max-width: 599.95px)': {
                        minHeight: '60px',
                    },
                },
            },
        },

        MuiTableContainer: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    maxWidth: '100%',
                    WebkitOverflowScrolling: 'touch',
                },
            },
        },

        MuiTableCell: {
            styleOverrides: {
                head: {
                    backgroundColor: '#F8FAFC',
                    color: '#475569',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                },

                root: {
                    borderColor: '#E8EDF3',
                    padding: '12px 16px',
                },
            },
        },

        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    backgroundColor: '#FFFFFF',

                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#DCE4ED',
                    },

                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#94A3B8',
                    },

                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#0D9488',
                        borderWidth: 1.5,
                    },
                },

                input: {
                    minWidth: 0,
                    fontSize: 13,
                },
            },
        },

        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 650,
                },
            },
        },

        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    transition: 'background-color 150ms ease',
                },
            },
        },

        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 16,
                    backgroundImage: 'none',
                },
            },
        },

        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    fontSize: 11,
                    borderRadius: 8,
                },
            },
        },
    },
});

export default theme;
