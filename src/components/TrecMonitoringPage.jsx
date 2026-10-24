import React, { useMemo, useState } from 'react';
import {
    Box, Card, CardContent, Typography, Grid, FormControl, InputLabel,
    Select, MenuItem, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Stack, TextField, Autocomplete, Alert, Button
} from '@mui/material';
import {
    CalendarMonth, StorefrontOutlined, AccessTime,
    Search, DirectionsCar, Download
} from '@mui/icons-material';
import { useData } from '../context/DataContext';
import * as XLSX from 'xlsx'; // Pastikan sudah install: npm install xlsx

// Helper untuk menghitung selisih menit antara dua string waktu (HH:mm)
const getTravelMinutes = (prevCheckout, currentCheckin) => {
    if (!prevCheckout || !currentCheckin || prevCheckout === '-' || currentCheckin === '-') return null;
    const [h1, m1] = prevCheckout.split(':').map(Number);
    const [h2, m2] = currentCheckin.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    return diff;
};

const formatDuration = (minutes) => {
    if (minutes == null) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}j ${m}m` : `${m}m`;
};

const TrecMonitoringPage = () => {
    const { outlets, visitReports } = useData();

    // State Filter
    const [selectedFrontliner, setSelectedFrontliner] = useState(null);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Mapping Outlet ID ke Nama Master
    const outletMap = useMemo(() => {
        const map = {};
        outlets.forEach(o => map[o.outletId] = o.outletName);
        return map;
    }, [outlets]);

    // 1. Filter Data TREC berdasarkan Rentang Tanggal & Frontliner
    const filteredReports = useMemo(() => {
        return visitReports.filter(r => {
            if (r.date < startDate || r.date > endDate) return false;
            if (selectedFrontliner && String(r.frontliner).trim().toUpperCase() !== selectedFrontliner.trim().toUpperCase()) return false;
            return true;
        });
    }, [visitReports, startDate, endDate, selectedFrontliner]);

    // 2. Proses Data untuk Monitoring + Hitung Travel Time
    const monitoringData = useMemo(() => {
        // Kelompokkan data per Tanggal & Frontliner agar urutan terjaga
        const groupedMap = new Map();

        filteredReports.forEach(r => {
            const key = `${String(r.date).trim()}|${String(r.frontliner).trim().toUpperCase()}`;
            if (!groupedMap.has(key)) groupedMap.set(key, []);
            groupedMap.get(key).push(r);
        });

        const result = [];
        groupedMap.forEach((reports, key) => {
            const [date, fl] = key.split('|');

            // ? PERBAIKAN: Urutkan laporan berdasarkan Check-in Time (Ascending / Terkecil ke Tertinggi)
            reports.sort((a, b) => {
                const timeA = a.checkInTime || '99:99';
                const timeB = b.checkInTime || '99:99';
                return timeA.localeCompare(timeB);
            });

            let lastCheckoutTime = null;

            reports.forEach((report, index) => {
                // Hitung Travel Time dari checkout sebelumnya ke checkin sekarang
                const travelMinutes = getTravelMinutes(lastCheckoutTime, report.checkInTime);

                // Update last checkout untuk iterasi berikutnya
                lastCheckoutTime = report.checkOutTime;

                result.push({
                    date,
                    frontliner: fl,
                    order: index + 1,
                    outletId: report.outletId,
                    outletName: report.outletName || outletMap[report.outletId] || report.outletId,
                    checkIn: report.checkInTime || '-',
                    checkOut: report.checkOutTime || '-',
                    duration: report.duration || '-',
                    travelMinutes,
                    status: 'Selesai' // Karena ini data actual dari TREC
                });
            });
        });

        // ? PERBAIKAN UTAMA: Urutkan hasil akhir Ascending (Terkecil ke Tertinggi)
        // 1. Tanggal (Lama -> Baru)
        // 2. Waktu Check-in (Pagi -> Malam)
        // 3. Nama Frontliner (A -> Z)
        return result.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            if (a.checkIn !== b.checkIn) return a.checkIn.localeCompare(b.checkIn);
            return a.frontliner.localeCompare(b.frontliner);
        });

    }, [filteredReports, outletMap]);

    // Statistik Agregat
    const stats = useMemo(() => {
        const totalVisits = monitoringData.length;
        const uniqueOutlets = new Set(monitoringData.map(d => d.outletId)).size;
        const totalDurationMins = monitoringData.reduce((acc, curr) => {
            if (curr.duration && curr.duration !== '-') {
                const parts = curr.duration.match(/(\d+)j\s*(\d+)?m/);
                if (parts) return acc + (parseInt(parts[1]) * 60) + (parseInt(parts[2] || 0));
            }
            return acc;
        }, 0);

        return {
            totalVisits,
            uniqueOutlets,
            avgDuration: totalVisits > 0 ? Math.round(totalDurationMins / totalVisits) : 0
        };
    }, [monitoringData]);

    const frontlinerOptions = useMemo(() =>
        [...new Set(visitReports.map(r => String(r.frontliner).trim().toUpperCase()).filter(Boolean))].sort(),
    [visitReports]);

    // Fungsi Export ke Excel
    const handleExportToExcel = () => {
        if (monitoringData.length === 0) return;

        const excelData = monitoringData.map((item) => ({
            No: item.order,
            Tanggal: item.date,
            Frontliner: item.frontliner,
            Nama_Outlet: item.outletName,
            Outlet_ID: item.outletId,
            Check_In: item.checkIn,
            Check_Out: item.checkOut,
            Durasi_Visit: item.duration,
            Travel_Time: formatDuration(item.travelMinutes),
            Keterangan_Travel: item.travelMinutes > 60 ? 'ANOMALI (>1 Jam)' : 'Normal'
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Laporan_Actual_TREC');

        const fileName = `Laporan_TREC_${startDate}_to_${endDate}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    return (
        <Box sx={{ p: { xs: 1.5, md: 3 }, minWidth: 0, maxWidth: 1600, mx: 'auto' }}>
            {/* Header */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                <CalendarMonth color="primary" sx={{ fontSize: 36 }} />
                <Box>
                    <Typography variant="h5" fontWeight={800} color="primary.main">Monitoring Actual Visit (TREC)</Typography>
                    <Typography variant="body2" color="text.secondary">Rekapitulasi data kunjungan aktual berdasarkan upload TREC.</Typography>
                </Box>
            </Stack>

            {/* Filter Section */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Grid container spacing={2} alignItems="flex-end">
                        <Grid item xs={12} sm={6} md={5}>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={frontlinerOptions}
                                value={selectedFrontliner}
                                onChange={(e, newValue) => setSelectedFrontliner(newValue)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Cari Frontliner / MD"
                                        InputProps={{ ...params.InputProps, startAdornment: <Search sx={{ mr: 1, color: 'action.active', fontSize: 20 }} /> }}
                                    />
                                )}
                                isOptionEqualToValue={(option, value) => option === value}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3.5}>
                            <TextField fullWidth size="small" type="date" label="Dari Tanggal" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3.5}>
                            <TextField fullWidth size="small" type="date" label="Sampai Tanggal" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {monitoringData.length === 0 ? (
                <Card sx={{ borderRadius: 2, p: 5, textAlign: 'center' }}>
                    <StorefrontOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">Tidak ada data kunjungan TREC untuk filter yang dipilih.</Typography>
                </Card>
            ) : (
                <>
                    {/* Summary Cards */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} md={4}>
                            <Card sx={{ borderRadius: 2, bgcolor: '#F0FDFA', border: '1px solid #CCFBF1' }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Typography variant="caption" color="#0F766E" fontWeight={700}>TOTAL KUNJUNGAN</Typography>
                                    <Typography variant="h4" fontWeight={800} color="#0F766E">{stats.totalVisits}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Card sx={{ borderRadius: 2, bgcolor: '#DBEAFE', border: '1px solid #BFDBFE' }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Typography variant="caption" color="#1D4ED8" fontWeight={700}>OUTLET UNIK</Typography>
                                    <Typography variant="h4" fontWeight={800} color="#1D4ED8">{stats.uniqueOutlets}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Card sx={{ borderRadius: 2, bgcolor: '#FEF3C7', border: '1px solid #FDE68A', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Typography variant="caption" color="#92400E" fontWeight={700}>RATA-RATA DURASI</Typography>
                                    <Typography variant="h4" fontWeight={800} color="#92400E">{formatDuration(stats.avgDuration)}</Typography>
                                    <Button variant="outlined" size="small" startIcon={<Download />} onClick={handleExportToExcel} sx={{ mt: 1, borderColor: '#92400E', color: '#92400E', '&:hover': { bgcolor: '#FFFBEB' } }}>
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
                                        <TableCell>Check-in</TableCell>
                                        <TableCell>Check-out</TableCell>
                                        <TableCell>Durasi</TableCell>
                                        <TableCell>Travel Time</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {monitoringData.map((item, index) => {
                                        const isLongTravel = item.travelMinutes != null && item.travelMinutes > 60;
                                        return (
                                            <TableRow key={index} hover sx={{ bgcolor: isLongTravel ? '#FEF2F2' : 'transparent', '& td': { color: isLongTravel ? '#B91C1C' : 'inherit' } }}>
                                                <TableCell>{item.date}</TableCell>
                                                <TableCell>{item.frontliner}</TableCell>
                                                <TableCell>{item.order}</TableCell>
                                                <TableCell>
                                                    <Typography fontWeight={600}>{item.outletName}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{item.outletId}</Typography>
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

export default TrecMonitoringPage;