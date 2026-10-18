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
    Tooltip,
} from '@mui/material';

import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Map as MapIcon,
    Store as StoreIcon,
    People as PeopleIcon,
    Inventory2 as InventoryIcon,
    Assessment as AssessmentIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    ChevronLeft as ChevronLeftIcon,
    LocationOn as LocationIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

import {
    NavLink,
    Outlet,
    useLocation,
    useNavigate,
} from 'react-router-dom';

import { useData } from '../context/DataContext';

const DRAWER_WIDTH = 258;
const MOBILE_DRAWER_WIDTH = 'min(290px, 86vw)';

const C = {
    navy: '#101828',
    navySoft: '#182438',
    teal: '#0D9488',
    tealLight: '#CCFBF1',
    white: '#FFFFFF',
    text: '#172033',
    muted: '#64748B',
    border: '#E7ECF2',
    background: '#F5F7FB',
};

const menuGroups = [
    {
        title: 'MENU UTAMA',
        items: [
            {
                label: 'Dashboard',
                path: '/',
                icon: DashboardIcon,
            },
            {
                label: 'Mapping Outlet',
                path: '/mapping',
                icon: MapIcon,
            },
            {
                label: 'Data Outlet',
                path: '/outlets',
                icon: StoreIcon,
            },
            {
                label: 'Data SPG',
                path: '/spg',
                icon: PeopleIcon,
            },
        ],
    },
    {
        title: 'MANAJEMEN DATA',
        items: [
            {
                label: 'Produk',
                path: '/products',
                icon: InventoryIcon,
            },
            {
                label: 'Laporan',
                path: '/reports',
                icon: AssessmentIcon,
            },
        ],
    },
    {
        title: 'PENGATURAN',
        items: [
            {
                label: 'Pengaturan',
                path: '/settings',
                icon: SettingsIcon,
            },
        ],
    },
];

export default function Layout({ children }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const location = useLocation();
    const navigate = useNavigate();

    const { outlets = [] } = useData();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);

    const drawerWidth = desktopCollapsed ? 82 : DRAWER_WIDTH;

    const currentPage =
        menuGroups
            .flatMap((group) => group.items)
            .find((item) => {
                if (item.path === '/') {
                    return location.pathname === '/';
                }

                return (
                    location.pathname === item.path ||
                    location.pathname.startsWith(`${item.path}/`)
                );
            })?.label || 'MD Mapping System';

    const handleDrawerToggle = () => {
        setMobileOpen((previous) => !previous);
    };

    const handleNavigate = () => {
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    const sidebarContent = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: C.navy,
                color: C.white,
                overflowX: 'hidden',
            }}
        >
            {/* Logo */}
            <Box
                sx={{
                    minHeight: 76,
                    px: desktopCollapsed && !isMobile ? 2 : 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                        desktopCollapsed && !isMobile
                            ? 'center'
                            : 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    gap: 1.5,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        minWidth: 0,
                    }}
                >
                    <Box
                        sx={{
                            width: 42,
                            height: 42,
                            flexShrink: 0,
                            borderRadius: 2.5,
                            bgcolor: C.teal,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 14px rgba(13,148,136,0.25)',
                        }}
                    >
                        <LocationIcon
                            sx={{
                                fontSize: 25,
                                color: C.white,
                            }}
                        />
                    </Box>

                    {(!desktopCollapsed || isMobile) && (
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                sx={{
                                    fontWeight: 800,
                                    fontSize: 15,
                                    letterSpacing: 0.2,
                                    color: C.white,
                                    lineHeight: 1.4,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                MD Mapping
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize: 10,
                                    color: '#98A6B9',
                                    letterSpacing: 1.2,
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                MANAGEMENT SYSTEM
                            </Typography>
                        </Box>
                    )}
                </Box>

                {isMobile && (
                    <IconButton
                        onClick={handleDrawerToggle}
                        aria-label="Tutup menu"
                        sx={{ color: '#CBD5E1' }}
                    >
                        <CloseIcon />
                    </IconButton>
                )}
            </Box>

            {/* Ringkasan */}
            {(!desktopCollapsed || isMobile) && (
                <Box
                    sx={{
                        mx: 2,
                        mt: 2.5,
                        mb: 1.5,
                        p: 1.75,
                        borderRadius: 2.5,
                        bgcolor: 'rgba(255,255,255,0.045)',
                        border: '1px solid rgba(255,255,255,0.07)',
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 11,
                            color: '#98A6B9',
                            mb: 0.75,
                        }}
                    >
                        Total outlet terdaftar
                    </Typography>

                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: 25,
                                fontWeight: 800,
                                color: C.white,
                                lineHeight: 1.2,
                            }}
                        >
                            {outlets.length.toLocaleString('id-ID')}
                        </Typography>

                        <StoreIcon
                            sx={{
                                color: C.teal,
                                fontSize: 25,
                            }}
                        />
                    </Box>
                </Box>
            )}

            {/* Navigasi */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    px: 1.5,
                    py: 1,
                    '&::-webkit-scrollbar': {
                        width: 4,
                    },
                    '&::-webkit-scrollbar-thumb': {
                        bgcolor: 'rgba(255,255,255,0.16)',
                        borderRadius: 10,
                    },
                }}
            >
                {menuGroups.map((group) => (
                    <Box key={group.title} sx={{ mb: 2 }}>
                        {(!desktopCollapsed || isMobile) && (
                            <Typography
                                sx={{
                                    px: 1.25,
                                    pt: 1.5,
                                    pb: 1,
                                    fontSize: 9,
                                    fontWeight: 800,
                                    color: '#718096',
                                    letterSpacing: 1.3,
                                }}
                            >
                                {group.title}
                            </Typography>
                        )}

                        <List disablePadding>
                            {group.items.map((item) => {
                                const Icon = item.icon;

                                const active =
                                    item.path === '/'
                                        ? location.pathname === '/'
                                        : location.pathname === item.path ||
                                          location.pathname.startsWith(
                                              `${item.path}/`
                                          );

                                const button = (
                                    <ListItemButton
                                        component={NavLink}
                                        to={item.path}
                                        onClick={handleNavigate}
                                        selected={active}
                                        sx={{
                                            minHeight: 45,
                                            px:
                                                desktopCollapsed && !isMobile
                                                    ? 0
                                                    : 1.5,
                                            mb: 0.5,
                                            borderRadius: 2,
                                            justifyContent:
                                                desktopCollapsed && !isMobile
                                                    ? 'center'
                                                    : 'flex-start',
                                            color: active
                                                ? C.white
                                                : '#AAB5C5',
                                            bgcolor: active
                                                ? `${C.teal} !important`
                                                : 'transparent',
                                            transition:
                                                'background-color 0.2s ease, color 0.2s ease',
                                            '&:hover': {
                                                bgcolor: active
                                                    ? `${C.teal} !important`
                                                    : 'rgba(255,255,255,0.07)',
                                                color: C.white,
                                            },
                                            '& .MuiListItemIcon-root': {
                                                minWidth:
                                                    desktopCollapsed && !isMobile
                                                        ? 0
                                                        : 38,
                                                color: 'inherit',
                                                justifyContent: 'center',
                                            },
                                            '& .MuiListItemText-primary': {
                                                fontSize: 13,
                                                fontWeight: active ? 700 : 500,
                                                whiteSpace: 'nowrap',
                                            },
                                        }}
                                    >
                                        <ListItemIcon>
                                            <Icon sx={{ fontSize: 20 }} />
                                        </ListItemIcon>

                                        {(!desktopCollapsed || isMobile) && (
                                            <ListItemText
                                                primary={item.label}
                                            />
                                        )}

                                        {active &&
                                            (!desktopCollapsed || isMobile) && (
                                                <Box
                                                    sx={{
                                                        width: 5,
                                                        height: 5,
                                                        borderRadius: '50%',
                                                        bgcolor: C.white,
                                                        ml: 1,
                                                    }}
                                                />
                                            )}
                                    </ListItemButton>
                                );

                                return (
                                    <React.Fragment key={item.path}>
                                        {desktopCollapsed && !isMobile ? (
                                            <Tooltip
                                                title={item.label}
                                                placement="right"
                                                arrow
                                            >
                                                {button}
                                            </Tooltip>
                                        ) : (
                                            button
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </List>
                    </Box>
                ))}
            </Box>

            {/* Footer sidebar */}
            <Divider
                sx={{
                    borderColor: 'rgba(255,255,255,0.09)',
                }}
            />

            <Box
                sx={{
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                        desktopCollapsed && !isMobile
                            ? 'center'
                            : 'space-between',
                    gap: 1,
                }}
            >
                {(!desktopCollapsed || isMobile) && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                            minWidth: 0,
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 34,
                                height: 34,
                                bgcolor: '#26384F',
                                color: '#CCFBF1',
                                fontSize: 13,
                                fontWeight: 700,
                            }}
                        >
                            MD
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                sx={{
                                    color: C.white,
                                    fontSize: 12,
                                    fontWeight: 700,
                                }}
                            >
                                Mapping Team
                            </Typography>

                            <Typography
                                sx={{
                                    color: '#98A6B9',
                                    fontSize: 10,
                                }}
                            >
                                Administrator
                            </Typography>
                        </Box>
                    </Box>
                )}

                {!isMobile && (
                    <Tooltip
                        title={
                            desktopCollapsed
                                ? 'Perlebar sidebar'
                                : 'Perkecil sidebar'
                        }
                        placement="right"
                    >
                        <IconButton
                            onClick={() =>
                                setDesktopCollapsed((previous) => !previous)
                            }
                            size="small"
                            aria-label="Ubah ukuran sidebar"
                            sx={{
                                color: '#98A6B9',
                                '&:hover': {
                                    color: C.white,
                                    bgcolor: 'rgba(255,255,255,0.08)',
                                },
                            }}
                        >
                            <ChevronLeftIcon
                                sx={{
                                    transform: desktopCollapsed
                                        ? 'rotate(180deg)'
                                        : 'none',
                                    transition: 'transform 0.2s ease',
                                }}
                            />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        </Box>
    );

    return (
        <Box
            sx={{
                display: 'flex',
                minHeight: '100vh',
                bgcolor: theme.palette.background.default || C.background,
                color: theme.palette.text.primary || C.text,
            }}
        >
            {/* Topbar */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1,
                    ml: { md: `${drawerWidth}px` },
                    width: {
                        md: `calc(100% - ${drawerWidth}px)`,
                    },
                    bgcolor: 'rgba(255,255,255,0.94)',
                    color: theme.palette.text.primary || C.text,
                    backdropFilter: 'blur(12px)',
                    borderBottom: `1px solid ${
                        theme.palette.divider || C.border
                    }`,
                    transition: theme.transitions.create(
                        ['width', 'margin'],
                        {
                            duration: theme.transitions.duration.shorter,
                        }
                    ),
                }}
            >
                <Toolbar
                    sx={{
                        minHeight: { xs: 60, md: 68 },
                        px: { xs: 2, md: 3 },
                        gap: 1.5,
                    }}
                >
                    {isMobile ? (
                        <IconButton
                            edge="start"
                            onClick={handleDrawerToggle}
                            aria-label="Buka menu"
                            sx={{
                                color: theme.palette.text.primary || C.text,
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                    ) : (
                        <Box
                            sx={{
                                width: 4,
                                height: 26,
                                borderRadius: 4,
                                bgcolor: C.teal,
                            }}
                        />
                    )}

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            sx={{
                                fontSize: { xs: 15, md: 17 },
                                fontWeight: 800,
                                lineHeight: 1.4,
                                color: theme.palette.text.primary || C.text,
                            }}
                        >
                            {currentPage}
                        </Typography>

                        <Typography
                            sx={{
                                display: { xs: 'none', sm: 'block' },
                                fontSize: 11,
                                color: theme.palette.text.secondary || C.muted,
                            }}
                        >
                            MD Mapping System
                        </Typography>
                    </Box>

                    <Chip
                        icon={
                            <Box
                                component="span"
                                sx={{
                                    display: 'inline-block',
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    bgcolor: '#22C55E',
                                    ml: 1,
                                }}
                            />
                        }
                        label="Online"
                        size="small"
                        sx={{
                            bgcolor: '#F0FDF4',
                            color: '#15803D',
                            fontSize: 11,
                            fontWeight: 700,
                            border: '1px solid #DCFCE7',
                            '& .MuiChip-icon': {
                                mr: -0.5,
                            },
                        }}
                    />
                </Toolbar>
            </AppBar>

            {/* Sidebar desktop */}
            <Box
                component="nav"
                sx={{
                    width: { md: drawerWidth },
                    flexShrink: { md: 0 },
                }}
                aria-label="Navigasi utama"
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            width: MOBILE_DRAWER_WIDTH,
                            boxSizing: 'border-box',
                            border: 0,
                        },
                    }}
                >
                    {sidebarContent}
                </Drawer>

                <Drawer
                    variant="permanent"
                    open
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        width: drawerWidth,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            border: 0,
                            overflowX: 'hidden',
                            transition: theme.transitions.create('width', {
                                duration:
                                    theme.transitions.duration.shorter,
                            }),
                        },
                    }}
                >
                    {sidebarContent}
                </Drawer>
            </Box>

            {/* Konten halaman */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    minHeight: '100vh',
                    bgcolor: theme.palette.background.default || C.background,
                    transition: theme.transitions.create(
                        ['width', 'margin'],
                        {
                            duration: theme.transitions.duration.shorter,
                        }
                    ),
                }}
            >
                <Toolbar
                    sx={{
                        minHeight: { xs: 60, md: 68 },
                    }}
                />

                <Box
                    sx={{
                        width: '100%',
                        maxWidth: 1800,
                        mx: 'auto',
                        p: {
                            xs: 2,
                            sm: 2.5,
                            md: 3,
                            lg: 3.5,
                        },
                    }}
                >
                    {children || <Outlet />}
                </Box>

                {/* Footer */}
                <Box
                    component="footer"
                    sx={{
                        mt: 'auto',
                        px: { xs: 2, md: 3 },
                        py: 2,
                        borderTop: `1px solid ${
                            theme.palette.divider || C.border
                        }`,
                        bgcolor: theme.palette.background.paper || C.white,
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 11,
                            textAlign: 'center',
                            color: theme.palette.text.secondary || C.muted,
                        }}
                    >
                        © {new Date().getFullYear()} MD Mapping System
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
                    }
