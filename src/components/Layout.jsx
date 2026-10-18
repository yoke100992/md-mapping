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
} from '@mui/material';

import {
    Menu as MenuIcon,
    UploadFile as UploadIcon,
    Edit as EditIcon,
    MapOutlined as MapIcon,
    DashboardOutlined as DashboardIcon,
    DownloadOutlined as DownloadIcon,
    StorefrontOutlined as StorefrontIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

// ✅ TAMBAHKAN Outlet
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';

const DRAWER_WIDTH = 252;
const MOBILE_DRAWER_WIDTH = 'min(280px, 86vw)';

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
        description: 'Edit data outlet',
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
        label: 'Download Template',
        description: 'Template data',
        icon: <DownloadIcon />,
        path: '/template',
    },
];

// ✅ HAPUS parameter { children }
const Layout = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [drawerOpen, setDrawerOpen] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    const { outlets = [] } = useData();

    const handleNavigate = (path) => {
        navigate(path);

        if (isMobile) {
            setDrawerOpen(false);
        }
    };

    const currentMenu = menuItems.find(
        (item) =>
            item.path === '/'
                ? location.pathname === '/'
                : location.pathname === item.path ||
                    location.pathname.startsWith(`${item.path}/`)
    );

    const drawerContent = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#172B4D',
                color: '#E2E8F0',
            }}
        >
            <Box
                sx={{
                    px: 2.5,
                    py: 2.6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                }}
            >
                <Box
                    sx={{
                        width: 42,
                        height: 42,
                        flexShrink: 0,
                        borderRadius: 2.5,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: '#0D9488',
                        color: '#fff',
                    }}
                >
                    <StorefrontIcon sx={{ fontSize: 25 }} />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        sx={{
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: 17,
                            letterSpacing: '-.02em',
                            lineHeight: 1.3,
                        }}
                    >
                        MD Mapping
                    </Typography>

                    <Typography
                        sx={{
                            color: '#AFC0D5',
                            fontSize: 11.5,
                            mt: 0.25,
                        }}
                    >
                        Marketing Distribution
                    </Typography>
                </Box>

                {isMobile && (
                    <IconButton
                        onClick={() => setDrawerOpen(false)}
                        sx={{ color: '#CBD5E1', ml: 'auto' }}
                        aria-label="Tutup menu"
                    >
                        <CloseIcon />
                    </IconButton>
                )}
            </Box>

            <Box sx={{ px: 2.5, pt: 1.5, pb: 1 }}>
                <Typography
                    sx={{
                        color: '#8FA4BF',
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '.12em',
                        textTransform: 'uppercase',
                    }}
                >
                    Menu utama
                </Typography>
            </Box>

            <List sx={{ px: 1.5, pt: 0.5, flex: 1 }}>
                {menuItems.map((item) => {
                    const selected =
                        item.path === '/'
                            ? location.pathname === '/'
                            : location.pathname === item.path ||
                                location.pathname.startsWith(`${item.path}/`);

                    return (
                        <ListItemButton
                            key={item.path}
                            selected={selected}
                            onClick={() => handleNavigate(item.path)}
                            sx={{
                                minHeight: 48,
                                borderRadius: 2,
                                mb: 0.5,
                                px: 1.5,
                                color: selected ? '#FFFFFF' : '#C4D0DF',
                                '& .MuiListItemIcon-root': {
                                    color: selected ? '#5EEAD4' : '#9FB0C5',
                                },
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(13,148,136,.2)',
                                },
                                '&.Mui-selected:hover': {
                                    bgcolor: 'rgba(13,148,136,.27)',
                                },
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,.06)',
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 38 }}>
                                {item.icon}
                            </ListItemIcon>

                            <ListItemText
                                primary={item.label}
                                secondary={item.description}
                                primaryTypographyProps={{
                                    fontSize: 13.5,
                                    fontWeight: selected ? 750 : 600,
                                    noWrap: true,
                                }}
                                secondaryTypographyProps={{
                                    fontSize: 10.5,
                                    color: selected ? '#A5F3E8' : '#8FA4BF',
                                    noWrap: true,
                                }}
                            />

                            {item.path === '/map' && outlets.length > 0 && (
                                <Chip
                                    label={outlets.length.toLocaleString('id-ID')}
                                    size="small"
                                    sx={{
                                        height: 22,
                                        bgcolor: 'rgba(255,255,255,.1)',
                                        color: '#E2E8F0',
                                        fontSize: 10,
                                        '& .MuiChip-label': { px: 0.8 },
                                    }}
                                />
                            )}
                        </ListItemButton>
                    );
                })}
            </List>

            <Box
                sx={{
                    mx: 2,
                    mb: 2,
                    p: 1.5,
                    borderRadius: 2.5,
                    bgcolor: 'rgba(255,255,255,.055)',
                    border: '1px solid rgba(255,255,255,.08)',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Avatar
                        sx={{
                            width: 34,
                            height: 34,
                            bgcolor: '#0D9488',
                            fontSize: 13,
                            fontWeight: 800,
                        }}
                    >
                        MD
                    </Avatar>

                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            sx={{
                                color: '#F8FAFC',
                                fontSize: 12.5,
                                fontWeight: 700,
                            }}
                        >
                            Administrator
                        </Typography>

                        <Typography sx={{ color: '#9FB0C5', fontSize: 11 }}>
                            MD Mapping System
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    zIndex: theme.zIndex.drawer + 1,
                    bgcolor: '#FFFFFF',
                    color: 'text.primary',
                    borderBottom: '1px solid #E2E8F0',
                    width: isMobile
                        ? '100%'
                        : `calc(100% - ${DRAWER_WIDTH}px)`,
                    ml: isMobile ? 0 : `${DRAWER_WIDTH}px`,
                }}
            >
                <Toolbar
                    sx={{
                        minHeight: '68px !important',
                        px: { xs: 1.5, sm: 3 },
                    }}
                >
                    <IconButton
                        edge="start"
                        onClick={() => setDrawerOpen(true)}
                        sx={{
                            mr: 1.5,
                            display: isMobile ? 'inline-flex' : 'none',
                            color: 'secondary.main',
                        }}
                        aria-label="Buka menu"
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                            sx={{
                                fontWeight: 750,
                                fontSize: { xs: 14, sm: 16 },
                                color: '#172B4D',
                                lineHeight: 1.35,
                            }}
                            noWrap
                        >
                            {currentMenu?.label || 'MD Mapping'}
                        </Typography>

                        <Typography
                            sx={{
                                color: '#64748B',
                                fontSize: 11.5,
                                display: { xs: 'none', sm: 'block' },
                            }}
                        >
                            Kelola sebaran dan aktivitas outlet dalam satu tempat
                        </Typography>
                    </Box>

                    <Divider
                        orientation="vertical"
                        flexItem
                        sx={{ my: 1.75, mx: { xs: 1, sm: 2 } }}
                    />

                    <Chip
                        icon={<StorefrontIcon sx={{ fontSize: '17px !important' }} />}
                        label={`${outlets.length.toLocaleString('id-ID')} Outlet`}
                        size="small"
                        sx={{
                            bgcolor: '#E6F7F5',
                            color: '#0F766E',
                            border: '1px solid #BCEAE4',
                            fontWeight: 750,
                            '& .MuiChip-icon': { color: '#0D9488' },
                        }}
                    />
                </Toolbar>
            </AppBar>

            <Drawer
                variant={isMobile ? 'temporary' : 'permanent'}
                open={isMobile ? drawerOpen : true}
                onClose={() => setDrawerOpen(false)}
                ModalProps={{ keepMounted: true }}
                sx={{
                    width: isMobile ? MOBILE_DRAWER_WIDTH : DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: isMobile ? MOBILE_DRAWER_WIDTH : DRAWER_WIDTH,
                        maxWidth: '86vw',
                        boxSizing: 'border-box',
                        borderRight: 0,
                        bgcolor: '#172B4D',
                        overflowX: 'hidden',
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            <Box
                component="main"
                sx={{
                    ml: isMobile ? 0 : `${DRAWER_WIDTH}px`,
                    pt: '68px',
                    minWidth: 0,
                    minHeight: '100vh',
                    width: isMobile
                        ? '100%'
                        : `calc(100% - ${DRAWER_WIDTH}px)`,
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: 1800,
                        mx: 'auto',
                        p: { xs: 1.75, sm: 2.5, lg: 3.5 },
                    }}
                >
                    {/* ✅ GANTI {children} DENGAN <Outlet /> */}
                    <Outlet />
                </Box>

                <Box
                    component="footer"
                    sx={{
                        px: { xs: 2, sm: 3.5 },
                        py: 2,
                        borderTop: '1px solid #E5EAF0',
                        color: '#94A3B8',
                        fontSize: 11,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 1,
                        flexWrap: 'wrap',
                    }}
                >
                    <span>MD Mapping · Marketing Distribution Tracker</span>
                    <span>Outlet management system</span>
                </Box>
            </Box>
        </Box>
    );
};

export default Layout;
