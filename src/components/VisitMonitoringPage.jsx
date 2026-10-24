import React, { useMemo, useState } from 'react';
import {
    Box, Card, CardContent, Typography, Grid, FormControl, InputLabel,
    Select, MenuItem, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Stack, TextField, Autocomplete, Alert, Button
} from '@mui/material';
import {
    CalendarMonth, StorefrontOutlined, CheckCircle, Cancel, AccessTime,
    Search, DirectionsCar, Download
} from '@mui/icons-material';
import { useData } from '../context/DataContext';
import * as XLSX from 'xlsx'; // Pastikan sudah install: npm install xlsx

// Helper untuk menghitung selisih menit antara dua string waktu (HH:mm)
const getTravelMinutes = (prevCheckout, currentCheckin) => {
    if (!prevCheckout || !currentCheckin || prevCheckout === '-' || currentCheckin === '-') return null;

    const [h1, m1] = prevCheckout.split(':').map(Number);
    const [h2, m2] = currentCheckin.split(':').map(Number);

    const min1 = h1 * 60 + m1;
    const min2 = h2 * 60 + m2;

    let diff = min2 - min1;
    if (diff < 0) diff += 24 * 60;

    return diff;
};

const formatDuration = (minutes) => {
    if (minutes == null) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}j ${m}m`;
    return `${m}m`;
};

const VisitMonitoringPage = () => {
    const { outlets, visitSchedules, visitReports, frontliners } = useData();

    // State Filter
    const [selectedFrontliner, setSelectedFrontliner] = useState(null);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [visitStatusFilter, setVisitStatusFilter] = useState('all'); // all, visited, unvisited

    // Mapping Outlet ID ke Nama
    const outletMap = useMemo(() => {
        const map = {};
        outlets.forEach(o => map[o.outletId] = o.outletName);
        return map;
    }, [outlets]);

    // 1. Filter Jadwal Final berdasarkan Rentang Tanggal & Frontliner
    const filteredSchedules = useMemo(() => {
        return visitSchedules.filter(s => {
            if (s.status !== 'final') return false;
            if (s.date < startDate || s.date > endDate) return false;
            if (selectedFrontliner && s.frontliner !== selectedFrontliner) return false;
            return true;
        });
    }, [visitSchedules, startDate, endDate, selectedFrontliner]);

    // 2. Filter Laporan TREC berdasarkan Rentang Tanggal & Frontliner
    const filteredReports = useMemo(() => {
        return visitReports.filter(r => {
            if (r.date < startDate || r.date > endDate) return false;
            if (selectedFrontliner && r.frontliner !== selectedFrontliner) return false;
            return true;
        });
    }, [visitReports, startDate, endDate, selectedFrontliner]);

    // 3. Gabungkan Data untuk Monitoring + Hitung Travel Time
    const monitoringData = useMemo(() => {
        const scheduleMap = new Map();
        filteredSchedules.forEach(s => {
            // Normalisasi key agar pencocokan akurat meski ada spasi/huruf kapital berbeda
            const key = `${String(s.date).trim()}|${String(s.frontliner).trim().toLowerCase()}`;
            if (!scheduleMap.has(key)) scheduleMap.set(key, []);
            (s.outlets || []).forEach(o => scheduleMap.get(key).push(o));
        });

        const reportMap = new Map();
        filteredReports.forEach(r => {
            // Normalisasi key yang sama untuk data TREC
            const key = `${String(r.date).trim()}|${String(r.frontliner).trim().toLowerCase()}`;
            if (!reportMap.has(key)) reportMap.set(key, []);
            reportMap.get(key).push(r);
        });

        const result = [];
        scheduleMap.forEach((scheduledOutlets, key) => {
            const [date, fl] = key.split('|');
            const reports = reportMap.get(key) || [];

            let lastCheckoutTime = null;

            scheduledOutlets.forEach((schedOutlet, index) => {
                const report = reports.find(r => r.outletId === schedOutlet.outletId);
                const isVisited = !!report;

                // ? Hitung Travel Time dari checkout sebelumnya ke checkin sekarang
                const travelMinutes = getTravelMinutes(lastCheckoutTime, report?.checkInTime);

                // Update last checkout untuk iterasi berikutnya
                if (isVisited) {
                    lastCheckoutTime = report.checkOutTime;
                } else {
                    lastCheckoutTime = null;
                }

                result.push({
                    date,
                    frontliner: fl,
                    order: index + 1,
                    outletId: schedOutlet.outletId,
                    outletName: schedOutlet.outletName || outletMap[schedOutlet.outletId] || schedOutlet.outletId,
                    visited: isVisited,
                    checkIn: report?.checkInTime || '-',
                    checkOut: report?.checkOutTime || '-',
                    duration: report?.duration || '-',
                    travelMinutes,
                    status: isVisited ? 'Selesai' : 'Belum Visit'
                });
            });
        });

        return result.sort((a, b) => b.date.localeCompare(a.date) || a.frontliner.localeCompare(b.frontliner) || a.order - b.order);
    }, [filteredSchedules, filteredReports, outletMap]);

    // Apply Status Filter ke Data Akhir
    const finalData = useMemo(() => {
        if (visitStatusFilter === 'all') return monitoringData;
        return monitoringData.filter(d =>
            visitStatusFilter === 'visited' ? d.visited : !d.visited
        );
    }, [monitoringData, visitStatusFilter]);

    // Statistik Agregat
    const stats = useMemo(() => {
        const total = monitoringData.length;
        const visited = monitoringData.filter(d => d.visited).length;
        return {
            total,
            visited,
            remaining: total - visited,
            percentage: total > 0 ? Math.round((visited / total) * 100) : 0
        };
    }, [monitoringData]);

    const frontlinerOptions = useMemo(() =>
        [...new Set(visitSchedules.map(s => s.frontliner).filter(Boolean))].sort(),
    [visitSchedules]);

    // ? Fungsi Export ke Excel
    const handleExportToExcel = () => {
        if (finalData.length === 0) return;

        const excelData = finalData.map((item, index) => ({
            No: item.order,
            Tanggal: item.date,
            Frontliner: item.frontliner,
            Nama_Outlet: item.outletName,
            Outlet_ID: item.outletId,
            Status: item.status,
            Check_In: item.checkIn,
            Check_Out: item.checkOut,
            Durasi_Visit: item.duration,
            Travel_Time: formatDuration(item.travelMinutes),
            Keterangan_Travel: item.travelMinutes > 60 ? 'ANOMALI (>1 Jam)' : 'Normal'
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Monitoring_Kunjungan');

        const fileName = `Monitoring_${startDate}_to_${endDate}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    return (
        <Box sx={{ p: { xs: 1.5, md: 3 }, minWidth: 0, maxWidth: 1600, mx: 'auto' }}>
            {/* Header */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                <CalendarMonth color="primary" sx={{ fontSize: 36 }} />
                <Box>
                    <Typography variant="h5" fontWeight={800} color="primary.main">Monitoring Kunjungan</Typography>
                    <Typography variant="body2" color="text.secondary">Pantau pencapaian target kunjungan harian per MD.</Typography>
                </Box>
            </Stack>

            {/* Filter Section */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Grid container spacing={2} alignItems="flex-end">
                        {/* ? Filter Frontliner Searchable */}
                        <Grid item xs={12} sm={6} md={5}>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={frontlinerOptions}
                                value={selectedFrontliner}
                                onChange={(e, newValue) => setSelectedFrontliner(newValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Cari Frontliner / MD"
                                        InputProps={{ ...params.InputProps, startAdornment: <Search sx={{ mr: 1, color: 'action.active', fontSize: 20 }} /> }}
                                    />
                                )}
                                isOptionEqualToValue={(option, value) => option === value}
                            />
                        </Grid>

                        {/* Filter Tanggal Range */}
                        <Grid item xs={12} sm={6} md={3.5}>
                            <TextField fullWidth size="small" type="date" label="Dari Tanggal" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3.5}>
                            <TextField fullWidth size="small" type="date" label="Sampai Tanggal" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                        </Grid>

                        {/* Filter Status Visit */}
                        <Grid item xs={12} sm={12} md={12}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status Kunjungan</InputLabel>
                                <Select value={visitStatusFilter} label="Status Kunjungan" onChange={(e) => setVisitStatusFilter(e.target.value)}>
                                    <MenuItem value="all">Semua Status</MenuItem>
                                    <MenuItem value="visited">? Sudah Visit</MenuItem>
                                    <MenuItem value="unvisited"> Belum Visit</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {finalData.length === 0 ? (
                <Card sx={{ borderRadius: 2, p: 5, textAlign: 'center' }}>
                    <StorefrontOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">Tidak ada data kunjungan untuk filter yang dipilih.</Typography>
                </Card>
            ) : (
                <>
                    {/* Summary Cards & Action Button */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} md={3}>
                            <Card sx={{ borderRadius: 2, bgcolor: '#F0FDFA', border: '1px solid #CCFBF1' }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Typography variant="caption" color="#0F766E" fontWeight={700}>TOTAL TARGET</Typography>
                                    <Typography variant="h4" fontWeight={800} color="#0F766E">{stats.total}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Card sx={{ borderRadius: 2, bgcolor: '#D1FAE5', border: '1px solid #A7F3D0' }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Typography variant="caption" color="#047857" fontWeight={700}>SUDAH VISIT</Typography>
                                    <Typography variant="h4" fontWeight={800} color="#047857">{stats.visited}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Card sx={{ borderRadius: 2, bgcolor: '#FEF3C7', border: '1px solid #FDE68A' }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Typography variant="caption" color="#92400E" fontWeight={700}>BELUM VISIT</Typography>
                                    <Typography variant="h4" fontWeight={800} color="#92400E">{stats.remaining}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Card sx={{ borderRadius: 2, bgcolor: '#DBEAFE', border: '1px solid #BFDBFE', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Typography variant="caption" color="#1D4ED8" fontWeight={700}>PENCAPAIAN</Typography>
                                    <Typography variant="h4" fontWeight={800} color="#1D4ED8">{stats.percentage}%</Typography>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<Download />}
                                        onClick={handleExportToExcel}
                                        sx={{ mt: 1, borderColor: '#1D4ED8', color: '#1D4ED8', '&:hover': { bgcolor: '#EFF6FF' } }}
                                    >
                                        Download Excel
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Monitoring Table */}
                    <Card sx={{ borderRadius: 2 }}>
                        <TableContainer sx={{ maxHeight: 650 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Tanggal</TableCell>
                                        <TableCell>MD</TableCell>
                                        <TableCell>No</TableCell>
                                        <TableCell>Nama Outlet</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Check-in</TableCell>
                                        <TableCell>Check-out</TableCell>
                                        <TableCell>Durasi</TableCell>
                                        <TableCell>Travel Time</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {finalData.map((item, index) => {
                                        // ? Logika Warna Merah jika Travel Time > 60 menit
                                        const isLongTravel = item.travelMinutes != null && item.travelMinutes > 60;

                                        return (
                                            <TableRow
                                                key={index}
                                                hover
                                                sx={{
                                                    bgcolor: item.visited
                                                        ? (isLongTravel ? '#FEF2F2' : 'rgba(5, 150, 105, 0.04)')
                                                        : 'transparent',
                                                    '& td': { color: isLongTravel ? '#B91C1C' : 'inherit' }
                                                }}
                                            >
                                                <TableCell>{item.date}</TableCell>
                                                <TableCell>{item.frontliner}</TableCell>
                                                <TableCell>{item.order}</TableCell>
                                                <TableCell>
                                                    <Typography fontWeight={600}>{item.outletName}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{item.outletId}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={item.status}
                                                        color={item.visited ? 'success' : 'default'}
                                                        icon={item.visited ? <CheckCircle fontSize="small" /> : <AccessTime fontSize="small" />}
                                                    />
                                                </TableCell>
                                                <TableCell>{item.checkIn}</TableCell>
                                                <TableCell>{item.checkOut}</TableCell>
                                                <TableCell>{item.duration}</TableCell>
                                                <TableCell>
                                                    {item.travelMinutes != null ? (
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <DirectionsCar fontSize="small" sx={{ color: isLongTravel ? '#DC2626' : 'text.secondary' }} />
                                                            <Typography fontWeight={isLongTravel ? 700 : 400} sx={{ color: isLongTravel ? '#DC2626' : 'inherit' }}>
                                                                {formatDuration(item.travelMinutes)}
                                                            </Typography>
                                                            {isLongTravel && <Typography variant="caption" color="error" sx={{ ml: 0.5 }}>(&gt;1 Jam)</Typography>}
                                                        </Stack>
                                                    ) : (
                                                        <Typography variant="caption" color="text.disabled">-</Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </>
            )}
        </Box>
    );
};

export default VisitMonitoringPage;