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
ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

import { useNavigate, useLocation } from 'react-router-dom';
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
: pathname === path || pathname.startsWith(${path}/);

const Layout = ({ children }) => {
const theme = useTheme();

const isMobile = useMediaQuery(  
    theme.breakpoints.down('md'),  
    { noSsr: true }  
);  

const [drawerOpen, setDrawerOpen] = useState(false);  

const navigate = useNavigate();  
const location = useLocation();  
const { outlets = [] } = useData();  

const currentMenu = menuItems.find((item) =>  
    isMenuActive(location.pathname, item.path)  
);  

const handleNavigate = (path) => {  
    navigate(path);  
    if (isMobile) setDrawerOpen(false);  
};  

const drawerContent = (  
    <Box  
        sx={{  
            height: '100%',  
            display: 'flex',  
            flexDirection: 'column',  
            overflow: 'hidden',  
            color: '#CBD5E1',  
            bgcolor: C.navy,  
        }}  
    >  
        {/* BRAND */}  
        <Box  
            sx={{  
                px: 2.5,  
                py: 2.5,  
                minHeight: 88,  
                display: 'flex',  
                alignItems: 'center',  
                gap: 1.5,  
                borderBottom: '1px solid rgba(255,255,255,.07)',  
            }}  
        >  
            <Box  
                sx={{  
                    width: 44,  
                    height: 44,  
                    flexShrink: 0,  
                    display: 'grid',  
                    placeItems: 'center',  
                    borderRadius: '13px',  
                    color: '#FFFFFF',  
                    background:  
                        'linear-gradient(145deg, #2DD4BF, #0D9488)',  
                    boxShadow: '0 5px 18px rgba(13,148,136,.24)',  
                }}  
            >  
                <StorefrontIcon sx={{ fontSize: 24 }} />  
            </Box>  

            <Box sx={{ minWidth: 0, flex: 1 }}>  
                <Typography  
                    sx={{  
                        fontSize: 16,  
                        fontWeight: 800,  
                        color: '#FFFFFF',  
                        letterSpacing: '-.4px',  
                        lineHeight: 1.4,  
                    }}  
                >  
                    MD Mapping  
                </Typography>  

                <Typography  
                    sx={{  
                        mt: 0.25,  
                        fontSize: 10.5,  
                        color: '#98A6BA',  
                        letterSpacing: '.2px',  
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
                        color: '#CBD5E1',  
                        '&:hover': {  
                            bgcolor: 'rgba(255,255,255,.08)',  
                        },  
                    }}  
                >  
                    <CloseIcon />  
                </IconButton>  
            )}  
        </Box>  

        {/* SECTION LABEL */}  
        <Box sx={{ px: 2.5, pt: 3, pb: 1.25 }}>  
            <Typography  
                sx={{  
                    fontSize: 10,  
                    fontWeight: 800,  
                    color: '#7F8DA3',  
                    letterSpacing: '1.5px',  
                }}  
            >  
                MENU UTAMA  
            </Typography>  
        </Box>  

        {/* NAVIGATION */}  
        <List  
            disablePadding  
            sx={{  
                px: 1.5,  
                flex: 1,  
                overflowY: 'auto',  
                '&::-webkit-scrollbar': { width: 4 },  
                '&::-webkit-scrollbar-thumb': {  
                    bgcolor: '#344054',  
                    borderRadius: 5,  
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
                            mb: 0.6,  
                            px: 1.5,  
                            py: 1,  
                            borderRadius: '11px',  
                            color: selected ? '#FFFFFF' : '#A5B1C2',  
                            transition: 'background-color .18s ease',  

                            '&::before': {  
                                content: '""',  
                                position: 'absolute',  
                                left: 0,  
                                top: '22%',  
                                bottom: '22%',  
                                width: 3,  
                                borderRadius: '0 4px 4px 0',  
                                bgcolor: selected ? '#2DD4BF' : 'transparent',  
                            },  

                            '& .MuiListItemIcon-root': {  
                                minWidth: 39,  
                                color: selected ? '#5EEAD4' : '#8492A6',  
                            },  

                            '&.Mui-selected': {  
                                background:  
                                    'linear-gradient(100deg, rgba(13,148,136,.25), rgba(13,148,136,.09))',  
                                color: '#FFFFFF',  
                            },  

                            '&.Mui-selected:hover': {  
                                backgroundColor: 'rgba(13,148,136,.3)',  
                            },  

                            '&:hover': {  
                                bgcolor: 'rgba(255,255,255,.055)',  
                            },  
                        }}  
                    >  
                        <ListItemIcon>{item.icon}</ListItemIcon>  

                        <ListItemText  
                            primary={item.label}  
                            secondary={item.description}  
                            primaryTypographyProps={{  
                                fontSize: 12.8,  
                                fontWeight: selected ? 750 : 600,  
                                noWrap: true,  
                            }}  
                            secondaryTypographyProps={{  
                                fontSize: 10.5,  
                                noWrap: true,  
                                sx: {  
                                    mt: 0.25,  
                                    color: selected ? '#99F6E4' : '#8391A6',  
                                },  
                            }}  
                        />  

                        {item.path === '/map' && outlets.length > 0 && (  
                            <Chip  
                                label={outlets.length.toLocaleString('id-ID')}  
                                size="small"  
                                sx={{  
                                    height: 22,  
                                    maxWidth: 66,  
                                    bgcolor: selected  
                                        ? 'rgba(45,212,191,.15)'  
                                        : 'rgba(255,255,255,.08)',  
                                    color: selected ? '#99F6E4' : '#CBD5E1',  
                                    fontSize: 9.5,  
                                    fontWeight: 800,  
                                    '& .MuiChip-label': { px: 0.8 },  
                                }}  
                            />  
                        )}  

                        {selected && (  
                            <ChevronRightIcon  
                                sx={{  
                                    ml: 0.4,  
                                    fontSize: 18,  
                                    color: '#5EEAD4',  
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
                mx: 1.75,  
                my: 1.5,  
                p: 1.75,  
                border: '1px solid rgba(255,255,255,.09)',  
                borderRadius: '13px',  
                bgcolor: 'rgba(255,255,255,.035)',  
            }}  
        >  
            <Typography  
                sx={{  
                    color: '#91A0B5',  
                    fontSize: 9.5,  
                    fontWeight: 700,  
                    letterSpacing: '.9px',  
                }}  
            >  
                TOTAL OUTLET TERDATA  
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
                        fontSize: 25,  
                        fontWeight: 800,  
                        color: '#FFFFFF',  
                        letterSpacing: '-.8px',  
                        lineHeight: 1.2,  
                    }}  
                >  
                    {outlets.length.toLocaleString('id-ID')}  
                </Typography>  

                <Typography  
                    sx={{  
                        fontSize: 10.5,  
                        fontWeight: 700,  
                        color: '#5EEAD4',  
                    }}  
                >  
                    outlet  
                </Typography>  
            </Box>  
        </Box>  

        {/* ADMIN */}  
        <Divider sx={{ borderColor: 'rgba(255,255,255,.08)' }} />  

        <Box  
            sx={{  
                px: 2,  
                py: 2,  
                display: 'flex',  
                alignItems: 'center',  
                gap: 1.25,  
            }}  
        >  
            <Avatar  
                sx={{  
                    width: 36,  
                    height: 36,  
                    bgcolor: '#CCFBF1',  
                    color: '#0F766E',  
                    fontSize: 11,  
                    fontWeight: 800,  
                }}  
            >  
                MD  
            </Avatar>  

            <Box sx={{ flex: 1, minWidth: 0 }}>  
                <Typography  
                    sx={{  
                        color: '#F8FAFC',  
                        fontSize: 12,  
                        fontWeight: 700,  
                    }}  
                >  
                    Administrator  
                </Typography>  

                <Typography  
                    sx={{ color: '#91A0B5', fontSize: 10.5, mt: 0.2 }}  
                >  
                    MD Mapping System  
                </Typography>  
            </Box>  

            <Tooltip title="Status antarmuka">  
                <Box  
                    sx={{  
                        width: 8,  
                        height: 8,  
                        borderRadius: '50%',  
                        bgcolor: '#34D399',  
                        boxShadow: '0 0 0 4px rgba(52,211,153,.12)',  
                    }}  
                />  
            </Tooltip>  
        </Box>  
    </Box>  
);  

return (  
    <Box  
        sx={{  
            display: 'flex',  
            minHeight: '100vh',  
            width: '100%',  
            bgcolor: C.background,  
        }}  
    >  
        <CssBaseline />  

        {/* HEADER */}  
        <AppBar  
            position="fixed"  
            elevation={0}  
            sx={{  
                zIndex: theme.zIndex.drawer + 1,  
                width: isMobile  
                    ? '100%'  
                    : `calc(100% - ${DRAWER_WIDTH}px)`,  
                ml: isMobile ? 0 : `${DRAWER_WIDTH}px`,  
                bgcolor: 'rgba(255,255,255,.96)',  
                color: C.text,  
                backdropFilter: 'blur(12px)',  
                borderBottom: `1px solid ${C.border}`,  
            }}  
        >  
            <Toolbar  
                sx={{  
                    minHeight: '68px !important',  
                    px: { xs: 1.5, sm: 3 },  
                    gap: 1,  
                }}  
            >  
                {isMobile && (  
                    <IconButton  
                        onClick={() => setDrawerOpen(true)}  
                        aria-label="Buka menu"  
                        sx={{  
                            width: 40,  
                            height: 40,  
                            color: C.text,  
                            border: `1px solid ${C.border}`,  
                            borderRadius: '11px',  
                            '&:hover': { bgcolor: '#F1F5F9' },  
                        }}  
                    >  
                        <MenuIcon />  
                    </IconButton>  
                )}  

                <Box sx={{ flex: 1, minWidth: 0 }}>  
                    <Typography  
                        noWrap  
                        sx={{  
                            fontSize: { xs: 14.5, sm: 16 },  
                            fontWeight: 800,  
                            color: C.text,  
                            letterSpacing: '-.3px',  
                            lineHeight: 1.4,  
                        }}  
                    >  
                        {currentMenu?.label || 'MD Mapping'}  
                    </Typography>  

                    <Typography  
                        noWrap  
                        sx={{  
                            display: { xs: 'none', sm: 'block' },  
                            color: C.muted,  
                            fontSize: 11.5,  
                            mt: 0.25,  
                        }}  
                    >  
                        {currentMenu?.description ||  
                            'Kelola sebaran dan aktivitas outlet'}  
                    </Typography>  
                </Box>  

                <Chip  
                    icon={  
                        <StorefrontIcon  
                            sx={{ fontSize: '17px !important' }}  
                        />  
                    }  
                    label={`${outlets.length.toLocaleString('id-ID')} Outlet`}  
                    size="small"  
                    sx={{  
                        height: 32,  
                        flexShrink: 0,  
                        maxWidth: { xs: 132, sm: 'none' },  
                        bgcolor: '#F0FDFA',  
                        color: '#0F766E',  
                        border: '1px solid #CCFBF1',  
                        fontSize: 10.5,  
                        fontWeight: 800,  
                        '& .MuiChip-icon': {  
                            color: C.teal,  
                            ml: 0.8,  
                        },  
                        '& .MuiChip-label': {  
                            px: 1,  
                            overflow: 'hidden',  
                            textOverflow: 'ellipsis',  
                        },  
                    }}  
                />  
            </Toolbar>  
        </AppBar>  

        {/* SIDEBAR */}  
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
                    bgcolor: C.navy,  
                    border: 0,  
                    overflowX: 'hidden',  
                },  
            }}  
        >  
            {drawerContent}  
        </Drawer>  

        {/* PAGE CONTENT */}  
        <Box  
            component="main"  
            sx={{  
                flex: '1 1 0%',  
                width: 0,  
                minWidth: 0,  
                minHeight: '100vh',  
                display: 'flex',  
                flexDirection: 'column',  
                pt: '68px',  
            }}  
        >  
            <Box  
                sx={{  
                    width: '100%',  
                    maxWidth: 1800,  
                    mx: 'auto',  
                    px: { xs: 1.5, sm: 3, lg: 4 },  
                    py: { xs: 2, sm: 3, lg: 3.5 },  
                    flex: 1,  
                    minWidth: 0,  
                }}  
            >  
                {children}  
            </Box>  

            {/* FOOTER */}  
            <Box  
                component="footer"  
                sx={{  
                    px: { xs: 1.75, sm: 3, lg: 4 },  
                    py: 2,  
                    display: 'flex',  
                    alignItems: 'center',  
                    justifyContent: 'space-between',  
                    flexWrap: 'wrap',  
                    gap: 1,  
                    borderTop: `1px solid ${C.border}`,  
                    bgcolor: '#FFFFFF',  
                }}  
            >  
                <Typography sx={{ color: '#8491A5', fontSize: 10.5 }}>  
                    © {new Date().getFullYear()} MD Mapping  
                    {' · '}Marketing Distribution  
                </Typography>  

                <Typography sx={{ color: '#8491A5', fontSize: 10.5 }}>  
                    Outlet Management System v1.0  
                </Typography>  
            </Box>  
        </Box>  
    </Box>  
);

};

export default Layout;
