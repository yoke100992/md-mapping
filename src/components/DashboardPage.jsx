import React, { useMemo, useState } from 'react';
import {
    Card, CardContent, Typography, Box, Grid, Paper, Chip, LinearProgress, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
    Store as StoreIcon, People as PeopleIcon, AccountTree as AccountIcon,
    AcUnit, Whatshot, Air, Block, Dashboard as DashboardIcon, BarChart as BarChartIcon, FilterAlt as FilterIcon
} from '@mui/icons-material';
import { useData } from '../context/DataContext';
import { getFrontlinerColor } from '../utils/constants';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ icon, label, value, color, onClick }) => (
    <Card sx={{ cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.2s', '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: 6 } : {} }} onClick={onClick}>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ bgcolor: `${color}15`, p: 1.5, borderRadius: 3, display: 'flex' }}>{icon}</Box>
                <Box>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="h4" fontWeight={700} color={color}>{value}</Typography>
                </Box>
            </Box>
        </CardContent>
    </Card>
);

const DashboardPage = () => {
    const { outlets, frontliners, customColors } = useData();
    const navigate = useNavigate();
    const [selectedFrontliner, setSelectedFrontliner] = useState('');
    const visibleOutlets = useMemo(() => selectedFrontliner ? outlets.filter((o) => o.frontliner === selectedFrontliner) : outlets, [outlets, selectedFrontliner]);

    const stats = useMemo(() => {
        const byAccount = {}, byRTG = {};
        visibleOutlets.forEach((o) => {
            byAccount[o.account] = (byAccount[o.account] || 0) + 1;
            byRTG[o.rtgFreezer || 'None'] = (byRTG[o.rtgFreezer || 'None'] || 0) + 1;
        });
        return { byAccount, byRTG };
    }, [visibleOutlets]);

    const maxAccount = Math.max(...Object.values(stats.byAccount), 1);
    const getColor = (fl) => getFrontlinerColor(fl, customColors);

    // Fungsi untuk render ikon RTG
    const renderRTGIcon = (rtg) => {
        if (rtg === 'Freezer') return <AcUnit sx={{ fontSize: 48, color: '#2196F3' }} />;
        if (rtg === 'RTG') return <Whatshot sx={{ fontSize: 48, color: '#FF9800' }} />;
        if (rtg === 'Chiller') return <Air sx={{ fontSize: 48, color: '#4CAF50' }} />;
        return <Block sx={{ fontSize: 48, color: '#999' }} />;
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}><DashboardIcon sx={{ mr: 1, verticalAlign: 'middle' }} />Dashboard</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Ringkasan data outlet MD Mapping Anda.</Typography>

            <Card sx={{ mb: 3 }}><CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', py: '12px !important' }}>
                <FilterIcon color="primary" />
                <Typography variant="body2" fontWeight={600}>Filter Frontliner</Typography>
                <FormControl size="small" sx={{ minWidth: 240, maxWidth: '100%' }}>
                    <InputLabel id="dashboard-frontliner-label">Nama Frontliner</InputLabel>
                    <Select labelId="dashboard-frontliner-label" value={selectedFrontliner} label="Nama Frontliner" onChange={(e) => setSelectedFrontliner(e.target.value)}>
                        <MenuItem value="">Semua Frontliner</MenuItem>
                        {frontliners.map((fl) => <MenuItem key={fl} value={fl}>{fl}</MenuItem>)}
                    </Select>
                </FormControl>
                {selectedFrontliner && <Chip label={`Filter: ${selectedFrontliner}`} onDelete={() => setSelectedFrontliner('')} color="primary" variant="outlined" />}
                <Typography variant="caption" color="text.secondary" sx={{ ml: { md: 'auto' } }}>Menampilkan {visibleOutlets.length.toLocaleString('id-ID')} outlet</Typography>
            </CardContent></Card>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 6, md: 3 }}>
                    <StatCard icon={<StoreIcon sx={{ color: 'primary.main', fontSize: 32 }} />} label="Total Outlet" value={visibleOutlets.length} color="#0D9488" onClick={() => navigate('/map')} />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <StatCard icon={<PeopleIcon sx={{ color: '#2E8B57', fontSize: 32 }} />} label="Frontliner" value={frontliners.length} color="#2E8B57" />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <StatCard icon={<AccountIcon sx={{ color: '#FF9800', fontSize: 32 }} />} label="Account" value={Object.keys(stats.byAccount).length} color="#FF9800" />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <StatCard icon={<AcUnit sx={{ color: '#2196F3', fontSize: 32 }} />} label="RTG/Freezer" value={visibleOutlets.filter((o) => o.rtgFreezer && o.rtgFreezer !== 'None').length} color="#2196F3" />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom><BarChartIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />Distribusi per Account</Typography>
                            {Object.entries(stats.byAccount).map(([account, count]) => (
                                <Box key={account} sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" fontWeight={600}>{account}</Typography>
                                        <Typography variant="body2" color="text.secondary">{count} ({Math.round((visibleOutlets.length ? count / visibleOutlets.length : 0) * 100)}%)</Typography>
                                    </Box>
                                    <LinearProgress variant="determinate" value={(count / maxAccount) * 100} sx={{ height: 8, borderRadius: 4, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { bgcolor: account === 'Alfamart' ? '#C41E3A' : account === 'Indomaret' ? '#2196F3' : '#FF9800', borderRadius: 4 } }} />
                                </Box>
                            ))}
                            {Object.keys(stats.byAccount).length === 0 && <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Belum ada data</Typography>}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom><BarChartIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />Distribusi RTG / Freezer</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                {Object.entries(stats.byRTG).map(([rtg, count]) => (
                                    <Paper key={rtg} sx={{ p: 2, flex: '1 1 calc(50% - 12px)', minWidth: 140, textAlign: 'center', border: '2px solid', borderColor: rtg === 'Freezer' ? '#2196F3' : rtg === 'RTG' ? '#FF9800' : rtg === 'Chiller' ? '#4CAF50' : '#e0e0e0' }}>
                                        {renderRTGIcon(rtg)}
                                        <Typography variant="h6" fontWeight={600}>{count}</Typography>
                                        <Typography variant="body2" color="text.secondary">{rtg}</Typography>
                                    </Paper>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom><PeopleIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />Distribusi per Frontliner</Typography>
                            <Grid container spacing={2}>
                                {frontliners.map((fl) => {
                                    const count = visibleOutlets.filter((o) => o.frontliner === fl).length;
                                    const percentage = outlets.length > 0 ? Math.round((visibleOutlets.length ? count / visibleOutlets.length : 0) * 100) : 0;
                                    const color = getColor(fl);
                                    return (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={fl}>
                                            <Paper sx={{ p: 2, borderLeft: `4px solid ${color}` }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>{fl}</Typography>
                                                        <Typography variant="h5" fontWeight={700} color="primary.main">{count}</Typography>
                                                        <Typography variant="caption" color="text.secondary">outlet ({percentage}%)</Typography>
                                                    </Box>
                                                    <Chip label={`${percentage}%`} sx={{ bgcolor: `${color}20`, color: color, fontWeight: 700 }} />
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    );
                                })}
                                {frontliners.length === 0 && <Grid size={12}><Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Belum ada data frontliner</Typography></Grid>}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;