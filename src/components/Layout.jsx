
import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    useMediaQuery,
    useTheme,
    Avatar,
    Chip,
    Divider,
    CssBaseline,
    Tooltip,
} from '@mui/material';

import {
    Menu as MenuIcon,
    UploadFile as UploadIcon,
    Edit as EditIcon,
    MapOutlined as MapIcon,
    DashboardOutlined as DashboardIcon,
    StorefrontOutlined as StorefrontIcon,
    Close as CloseIcon,
    SettingsOutlined as SettingsIcon,
    KeyboardArrowRight as ArrowIcon,
} from '@mui/icons-material';

import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';

const DRAWER_WIDTH = 260;
const MOBILE_DRAWER_WIDTH = 'min(290px, 86vw)';

const COLORS = {
    navy: '#0B1220',
    navyLight: '#111C30',
    green: '#10B981',
    greenDark: '#059669',
    text: '#172033',
    muted: '#718096',
    border: '#E7ECF2',
    background: '#F5F7FB',
    white: '#FFFFFF',
};

const menuItems = [
    {
        label: 'Dashboard',
        description: 'Ringkasan data',
        icon: <DashboardIcon />,
        path: '/',
    },
    {
        label: 'Kelola Outlet',
        description: 'Data dan penugasan',
        icon: <StorefrontIcon />,
        path: '/manage',
    },
    {
        label: 'Upload Data',
        description: 'Impor data outlet',
        icon: <UploadIcon />,
        path: '/upload',
    },
    {
        label: 'Edit Data',
        description: 'Perbarui data outlet',
        icon: <EditIcon />,
        path: '/edit',
    },
    {
        label: 'View Map',
        description: 'Peta sebaran outlet',
        icon: <MapIcon />,
        path: '/map',
    },
    {
        label: 'Settings',
        description: 'Pengaturan sistem',
        icon: <SettingsIcon />,
        path: '/settings',
    },
];

const isMenuActive = (pathname, path) =>
    path === '/'
        ? pathname === '/'
        : pathname === path || pathname.startsWith(`${path}/`);

const Layout = ({ children }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [drawerOpen, setDrawerOpen] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { outlets = [] } = useData();

    const currentMenu =
        menuItems.find((item) =>
            isMenuActive(location.pathname, item.path)
        );

    const handleNavigate = (path) => {
        navigate(path);

        if (isMobile) {
            setDrawerOpen(false);
        }
    };

    const drawerContent = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: COLORS.navy,
                color: '#E2E8F0',
                overflow: 'hidden',
            }}
        >
            {/* BRAND */}
            <Box
                sx={{
                    px: 2.5,
                    py: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    minHeight: 88,
                    boxSizing: 'border-box',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}
            >
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '14px',
                        color: '#FFFFFF',
                        background:
                            'linear-gradient(145deg, #34D399, #059669)',
                        boxShadow: '0 6px 20px rgba(16,185,129,0.2)',
                    }}
                >
                    <StorefrontIcon sx={{ fontSize: 24 }} />
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                        sx={{
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: 17,
                            letterSpacing: '-0.5px',
                            lineHeight: 1.3,
                        }}
                    >
                        MD Mapping
                    </Typography>

                    <Typography
                        sx={{
                            color: '#8492A8',
                            fontSize: 11,
                            mt: 0.4,
                            letterSpacing: '0.2px',
                        }}
                    >
                        Marketing Distribution
                    </Typography>
                </Box>

                {isMobile && (
                    <IconButton
                        onClick={() => setDrawerOpen(false)}
                        aria-label="Tutup menu"
                        sx={{
                            color: '#94A3B8',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.08)',
                            },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                )}
            </Box>

            {/* SECTION TITLE */}
            <Box sx={{ px: 2.5, pt: 3, pb: 1.25 }}>
                <Typography
                    sx={{
                        color: '#64748B',
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '1.4px',
                        textTransform: 'uppercase',
                    }}
                >
                    WORKSPACE
                </Typography>
            </Box>

            {/* NAVIGATION */}
            <List
                disablePadding
                sx={{
                    px: 1.5,
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    '&::-webkit-scrollbar': {
                        width: 4,
                    },
                    '&::-webkit-scrollbar-thumb': {
                        bgcolor: '#26344B',
                        borderRadius: 8,
                    },
                }}
            >
                {menuItems.map((item) => {
                    const selected = isMenuActive(
                        location.pathname,
                        item.path
                    );

                    return (
                        <ListItemButton
                            key={item.path}
                            selected={selected}
                            onClick={() => handleNavigate(item.path)}
                            sx={{
                                position: 'relative',
                                minHeight: 54,
                                px: 1.5,
                                py: 1,
                                mb: 0.6,
                                borderRadius: '12px',
                                color: selected
                                    ? '#FFFFFF'
                                    : '#94A3B8',
                                transition: 'all 180ms ease',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    left: 0,
                                    top: '22%',
                                    height: '56%',
                                    width: 3,
                                    borderRadius: '0 5px 5px 0',
                                    bgcolor: selected
                                        ? COLORS.green
                                        : 'transparent',
                                },
                                '& .MuiListItemIcon-root': {
                                    minWidth: 40,
                                    color: selected
                                        ? '#34D399'
                                        : '#718096',
                                    transition: 'color 180ms ease',
                                },
                                '&.Mui-selected': {
                                    bgcolor:
                                        'linear-gradient(90deg, rgba(16,185,129,0.18), rgba(16,185,129,0.06))',
                                    backgroundColor:
                                        'rgba(16,185,129,0.12)',
                                },
                                '&.Mui-selected:hover': {
                                    backgroundColor:
                                        'rgba(16,185,129,0.18)',
                                },
                                '&:hover': {
                                    bgcolor:
                                        'rgba(255,255,255,0.045)',
                                },
                            }}
                        >
                            <ListItemIcon>
                                {item.icon}
                            </ListItemIcon>

                            <ListItemText
                                primary={item.label}
                                secondary={item.description}
                                primaryTypographyProps={{
                                    fontSize: 13,
                                    fontWeight: selected ? 750 : 600,
                                    noWrap: true,
                                }}
                                secondaryTypographyProps={{
                                    fontSize: 10.5,
                                    noWrap: true,
                                    sx: {
                                        mt: 0.25,
                                        color: selected
                                            ? '#6EE7B7'
                                            : '#718096',
                                    },
                                }}
                            />

                            {item.path === '/map' &&
                                outlets.length > 0 && (
                                    <Chip
                                        label={outlets.length.toLocaleString(
                                            'id-ID'
                                        )}
                                        size="small"
                                        sx={{
                                            height: 23,
                                            maxWidth: 64,
                                            bgcolor: selected
                                                ? 'rgba(16,185,129,0.18)'
                                                : 'rgba(255,255,255,0.07)',
                                            color: selected
                                                ? '#6EE7B7'
                                                : '#CBD5E1',
                                            fontSize: 10,
                                            fontWeight: 800,
                                            '& .MuiChip-label': {
                                                px: 1,
                                            },
                                        }}
                                    />
                                )}

                            {selected && (
                                <ArrowIcon
                                    sx={{
                                        fontSize: 18,
                                        ml: 0.5,
                                        color: '#34D399',
                                        opacity: 0.9,
                                    }}
                                />
                            )}
                        </ListItemButton>
                    );
                })}
            </List>

            {/* OUTLET SUMMARY */}
            <Box
                sx={{
                    mx: 2,
                    mb: 2,
                    mt: 1.5,
                    p: 1.75,
                    borderRadius: '14px',
                    bgcolor: 'rgba(255,255,255,0.035)',
                    border: '1px solid rgba(255,255,255,0.075)',
                }}
            >
                <Typography
                    sx={{
                        color: '#8492A8',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.8px',
                        textTransform: 'uppercase',
                    }}
                >
                    Total outlet terdata
                </Typography>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 1,
                        mt: 0.75,
                    }}
                >
                    <Typography
                        sx={{
                            color: '#FFFFFF',
                            fontSize: 25,
                            fontWeight: 800,
                            lineHeight: 1.2,
                            letterSpacing: '-0.8px',
                        }}
                    >
                        {outlets.length.toLocaleString('id-ID')}
                    </Typography>

                    <Typography
                        sx={{
                            color: '#34D399',
                            fontSize: 11,
                            fontWeight: 600,
                        }}
                    >
                        outlet
                    </Typography>
                </Box>
            </Box>

            {/* ADMIN PROFILE */}
            <Box
                sx={{
                    p: 2,
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    bgcolor: 'rgba(0,0,0,0.08)',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                    }}
                >
                    <Avatar
                        sx={{
                            width: 38,
                            height: 38,
                            bgcolor: '#D1FAE5',
                            color: '#047857',
                            fontSize: 12,
                            fontWeight: 800,
                            border: '2px solid rgba(52,211,153,0.35)',
                        }}
                    >
                        MD
                    </Avatar>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                            sx={{
                                color: '#F8FAFC',
                                fontSize: 12.5,
                                fontWeight: 700,
                            }}
                        >
                            Administrator
                        </Typography>

                        <Typography
                            sx={{
                                color: '#8492A8',
                                fontSize: 10.5,
                                mt: 0.25,
                            }}
                        >
                            MD Mapping System
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            flexShrink: 0,
                            borderRadius: '50%',
                            bgcolor: '#34D399',
                            boxShadow:
                                '0 0 0 4px rgba(52,211,153,0.1)',
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box
            sx={{
                display: 'flex',
                minHeight: '100vh',
                bgcolor: COLORS.background,
            }}
        >
            <CssBaseline />

            {/* TOP BAR */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    zIndex: theme.zIndex.drawer + 1,
                    bgcolor: 'rgba(255,255,255,0.94)',
                    backdropFilter: 'blur(14px)',
                    color: COLORS.text,
                    borderBottom: `1px solid ${COLORS.border}`,
                    width: isMobile
                        ? '100%'
                        : `calc(100% - ${DRAWER_WIDTH}px)`,
                    ml: isMobile ? 0 : `${DRAWER_WIDTH}px`,
                    transition: theme.transitions.create(
                        ['width', 'margin'],
                        {
                            easing: theme.transitions.easing.sharp,
                            duration:
                                theme.transitions.duration.leavingScreen,
                        }
                    ),
                }}
            >
                <Toolbar
                    sx={{
                        minHeight: '72px !important',
                        px: { xs: 1.5, sm: 3 },
                        gap: { xs: 0.5, sm: 1 },
                    }}
                >
                    {isMobile && (
                        <IconButton
                            onClick={() => setDrawerOpen(true)}
                            aria-label="Buka menu"
                            sx={{
                                mr: 0.5,
                                color: '#475569',
                                borderRadius: '10px',
                                '&:hover': {
                                    bgcolor: '#F1F5F9',
                                },
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                            noWrap
                            sx={{
                                color: COLORS.text,
                                fontWeight: 800,
                                fontSize: { xs: 15, sm: 17 },
                                letterSpacing: '-0.4px',
                                lineHeight: 1.4,
                            }}
                        >
                            {currentMenu?.label || 'MD Mapping'}
                        </Typography>

                        <Typography
                            noWrap
                            sx={{
                                color: COLORS.muted,
                                fontSize: 11.5,
                                mt: 0.25,
                                display: { xs: 'none', sm: 'block' },
                            }}
                        >
                            {currentMenu?.description ||
                                'Kelola sebaran dan aktivitas outlet'}
                        </Typography>
                    </Box>

                    <Tooltip title="Jumlah outlet terdata">
                        <Chip
                            icon={
                                <StorefrontIcon
                                    sx={{
                                        fontSize: '17px !important',
                                    }}
                                />
                            }
                            label={`${outlets.length.toLocaleString(
                                'id-ID'
                            )} Outlet`}
                            size="small"
                            sx={{
                                height: 34,
                                flexShrink: 0,
                                borderRadius: '10px',
                                bgcolor: '#ECFDF5',
                                color: '#047857',
                                border: '1px solid #A7F3D0',
                                fontSize: 11.5,
                                fontWeight: 800,
                                '& .MuiChip-icon': {
                                    color: COLORS.greenDark,
                                    ml: 1,
                                },
                                '& .MuiChip-label': {
                                    px: 1,
                                },
                            }}
                        />
                    </Tooltip>
                </Toolbar>
            </AppBar>

            {/* SIDEBAR */}
            <Drawer
                variant={isMobile ? 'temporary' : 'permanent'}
                open={isMobile ? drawerOpen : true}
                onClose={() => setDrawerOpen(false)}
                ModalProps={{
                    keepMounted: true,
                }}
                sx={{
                    width: isMobile
                        ? MOBILE_DRAWER_WIDTH
                        : DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: isMobile
                            ? MOBILE_DRAWER_WIDTH
                            : DRAWER_WIDTH,
                        maxWidth: '86vw',
                        boxSizing: 'border-box',
                        border: 'none',
                        bgcolor: COLORS.navy,
                        overflowX: 'hidden',
                        boxShadow: isMobile
                            ? '12px 0 40px rgba(0,0,0,0.2)'
                            : 'none',
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* MAIN CONTENT */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    // Drawer permanent already occupies its own width.
                    // Do not add another desktop margin here.
                    minWidth: 0,
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    pt: '72px',
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: 1800,
                        mx: 'auto',
                        px: {
                            xs: 1.5,
                            sm: 3,
                            lg: 4,
                        },
                        py: {
                            xs: 2,
                            sm: 3,
                            lg: 3.5,
                        },
                        flex: 1,
                        boxSizing: 'border-box',
                    }}
                >
                    {children}
                </Box>

                {/* FOOTER */}
                <Box
                    component="footer"
                    sx={{
                        mt: 'auto',
                        px: { xs: 2, sm: 3, lg: 4 },
                        py: 2,
                        borderTop: `1px solid ${COLORS.border}`,
                        bgcolor: 'rgba(255,255,255,0.65)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        flexWrap: 'wrap',
                    }}
                >
                    <Typography
                        sx={{
                            color: '#8792A5',
                            fontSize: 10.5,
                        }}
                    >
                        © {new Date().getFullYear()} MD Mapping
                        {' · '}Marketing Distribution Tracker
                    </Typography>

                    <Typography
                        sx={{
                            color: '#8792A5',
                            fontSize: 10.5,
                        }}
                    >
                        Outlet Management System · v1.0
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default Layout;
