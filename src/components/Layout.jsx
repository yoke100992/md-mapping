import React, { useState } from 'react';
import {
    AppBar, Toolbar, Typography, IconButton, Drawer, List,
    ListItemButton, ListItemIcon, ListItemText, Box,
    useMediaQuery, useTheme, Avatar, Chip, Divider, CssBaseline
} from '@mui/material';
import {
    Menu as MenuIcon, UploadFile as UploadIcon, Edit as EditIcon,
    MapOutlined as MapIcon, DashboardOutlined as DashboardIcon,
    StorefrontOutlined as StorefrontIcon, Close as CloseIcon, Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';

const DRAWER_WIDTH = 260;
const MOBILE_DRAWER_WIDTH = 'min(280px, 85vw)';

const menuItems = [
    { label: 'Dashboard', description: 'Ringkasan data', icon: <DashboardIcon />, path: '/' },
    { label: 'Kelola Outlet', description: 'Data dan penugasan', icon: <StorefrontIcon />, path: '/manage' },
    { label: 'Upload Data', description: 'Impor data outlet', icon: <UploadIcon />, path: '/upload' },
    { label: 'Edit Data', description: 'Edit data outlet', icon: <EditIcon />, path: '/edit' },
    { label: 'View Map', description: 'Peta sebaran outlet', icon: <MapIcon />, path: '/map' },
    { label: 'Settings', description: 'Pengaturan sistem', icon: <SettingsIcon />, path: '/settings' },
];

const Layout = ({ children }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { outlets = [] } = useData();

    const handleNavigate = (path) => {
        navigate(path);
        if (isMobile) setDrawerOpen(false);
    };

    const currentMenu = menuItems.find(
        (item) => item.path === '/' ? location.pathname === '/' : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
    );

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0F172A', color: '#E2E8F0' }}>
            <Box sx={{ px: 2.5, py: 3, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Box sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: '#10B981', color: '#fff' }}>
                    <StorefrontIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', lineHeight: 1.2 }}>MD Mapping</Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: 11, mt: 0.25 }}>Marketing Distribution</Typography>
                </Box>
                {isMobile && (
                    <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: '#CBD5E1', ml: 'auto' }} aria-label="Tutup menu">
                        <CloseIcon />
                    </IconButton>
                )}
            </Box>
            
            <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
                <Typography sx={{ color: '#64748B', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Menu Utama</Typography>
            </Box>

            <List sx={{ px: 1.5, pt: 0.5, flex: 1, overflowY: 'auto' }}>
                {menuItems.map((item) => {
                    const selected = item.path === '/' ? location.pathname === '/' : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                    return (
                        <ListItemButton 
                            key={item.path} 
                            selected={selected} 
                            onClick={() => handleNavigate(item.path)}
                            sx={{
                                minHeight: 48, borderRadius: 2, mb: 0.5, px: 1.5, py: 1,
                                color: selected ? '#FFFFFF' : '#94A3B8',
                                '& .MuiListItemIcon-root': { color: selected ? '#10B981' : '#64748B', minWidth: 36 },
                                '&.Mui-selected': { bgcolor: 'rgba(16, 185, 129, 0.15)' },
                                '&.Mui-selected:hover': { bgcolor: 'rgba(16, 185, 129, 0.25)' },
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                                transition: 'all 0.2s ease-in-out'
                            }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText 
                                primary={item.label} 
                                secondary={item.description}
                                primaryTypographyProps={{ fontSize: 13.5, fontWeight: selected ? 700 : 600, noWrap: true }}
                                secondaryTypographyProps={{ fontSize: 10.5, color: selected ? '#6EE7B7' : '#64748B', noWrap: true }}
                            />
                            {item.path === '/map' && outlets.length > 0 && (
                                <Chip label={outlets.length} size="small" sx={{ height: 20, bgcolor: 'rgba(255,255,255,0.1)', color: '#E2E8F0', fontSize: 10, fontWeight: 700, '& .MuiChip-label': { px: 1 } }} />
                            )}
                        </ListItemButton>
                    );
                })}
            </List>

            <Box sx={{ mx: 2, mb: 3, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#10B981', fontSize: 12, fontWeight: 800 }}>MD</Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: '#F8FAFC', fontSize: 12.5, fontWeight: 700 }}>Administrator</Typography>
                        <Typography sx={{ color: '#94A3B8', fontSize: 11 }}>MD Mapping System</Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F1F5F9' }}>
            <CssBaseline />
            <AppBar position="fixed" elevation={0} sx={{ 
                zIndex: theme.zIndex.drawer + 1, 
                bgcolor: '#FFFFFF', 
                color: 'text.primary', 
                borderBottom: '1px solid #E2E8F0',
                width: isMobile ? '100%' : `calc(100% - ${DRAWER_WIDTH}px)`,
                ml: isMobile ? 0 : `${DRAWER_WIDTH}px`,
                transition: theme.transitions.create(['width', 'margin'], { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.leavingScreen })
            }}>
                <Toolbar sx={{ minHeight: '64px !important', px: { xs: 2, sm: 3 } }}>
                    <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 2, display: { md: 'none' }, color: '#475569' }} aria-label="Buka menu">
                        <MenuIcon />
                    </IconButton>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: { xs: 15, sm: 16 }, color: '#0F172A', lineHeight: 1.3 }} noWrap>
                            {currentMenu?.label || 'MD Mapping'}
                        </Typography>
                        <Typography sx={{ color: '#64748B', fontSize: 12, display: { xs: 'none', sm: 'block' } }}>
                            {currentMenu?.description || 'Kelola sebaran dan aktivitas outlet'}
                        </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ my: 1.5, mx: { xs: 1, sm: 2 }, borderColor: '#E2E8F0' }} />
                    <Chip 
                        icon={<StorefrontIcon sx={{ fontSize: '16px !important' }} />} 
                        label={`${outlets.length.toLocaleString('id-ID')} Outlet`} 
                        size="small" 
                        sx={{ bgcolor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: 700, '& .MuiChip-icon': { color: '#10B981' } }} 
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
                        maxWidth: '85vw',
                        boxSizing: 'border-box',
                        borderRight: '1px solid rgba(255,255,255,0.05)',
                        bgcolor: '#0F172A',
                        overflowX: 'hidden',
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            <Box component="main" sx={{ 
                flexGrow: 1, 
                ml: isMobile ? 0 : `${DRAWER_WIDTH}px`, 
                pt: '64px', 
                minWidth: 0, 
                minHeight: '100vh',
                transition: theme.transitions.create(['margin', 'width'], { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.leavingScreen })
            }}>
                <Box sx={{ width: '100%', maxWidth: 1600, mx: 'auto', p: { xs: 2, sm: 3, lg: 4 } }}>
                    {/* ✅ RENDER CHILDREN DI SINI */}
                    {children}
                </Box>
                
                <Box component="footer" sx={{ px: { xs: 2, sm: 4 }, py: 2.5, borderTop: '1px solid #E2E8F0', color: '#94A3B8', fontSize: 11, display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
                    <span>© {new Date().getFullYear()} MD Mapping · Marketing Distribution Tracker</span>
                    <span>Outlet Management System v1.0</span>
                </Box>
            </Box>
        </Box>
    );
};

export default Layout;
