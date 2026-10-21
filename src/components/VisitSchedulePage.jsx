import React, { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  FormControl, Grid, IconButton, InputLabel, MenuItem, Select,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Typography
} from '@mui/material';
import {
  AddLocationAlt, CalendarMonth, CheckCircle, Close, Delete,
  Edit, GpsFixed, NearMe, Save, Search, WarningAmber
} from '@mui/icons-material';
import { useData } from '../context/DataContext';

const TARGET_OUTLETS = 13;
const MAX_RTG = 4;

const todayLocal = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const text = (value) => String(value ?? '').trim();
const getOutletKey = (outlet) => text(outlet?.id || outlet?.outletId || outlet?.outletName);
const isRTG = (outlet) => text(outlet?.rtgFreezer).toLowerCase() === 'rtg';

const getDistanceKm = (a, b) => {
  const lat1 = Number(a?.latitude);
  const lon1 = Number(a?.longitude);
  const lat2 = Number(b?.latitude);
  const lon2 = Number(b?.longitude);
  if (!Number.isFinite(lat1) || !Number.isFinite(lon1) || !Number.isFinite(lat2) || !Number.isFinite(lon2)) return null;
  const rad = (n) => (n * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(Math.max(0, 1 - value)));
};

const makeOutletSnapshot = (outlet) => ({
  id: getOutletKey(outlet),
  outletId: text(outlet?.outletId),
  outletName: text(outlet?.outletName),
  account: text(outlet?.account),
  frontliner: text(outlet?.frontliner),
  rtgFreezer: text(outlet?.rtgFreezer),
  latitude: outlet?.latitude ?? null,
  longitude: outlet?.longitude ?? null,
});

const VisitSchedulePage = () => {
  const { outlets = [], frontliners = [], visitSchedules = [], saveVisitSchedule, deleteVisitSchedule } = useData();

  // State Konfigurasi
  const [selectedFrontliner, setSelectedFrontliner] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  
  // State Pemilihan Outlet
  const [selectedOutlets, setSelectedOutlets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  // State Review Jadwal
  const [reviewDate, setReviewDate] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  const safeFrontliners = useMemo(() => 
    [...new Set(frontliners.map(text).filter(Boolean))].sort((a, b) => a.localeCompare(b)), 
  [frontliners]);

  const rtgCount = useMemo(() => selectedOutlets.filter(isRTG).length, [selectedOutlets]);
  const remaining = TARGET_OUTLETS - selectedOutlets.length;

  // ✅ Logika Rekomendasi Terdekat
  const recommendedOutlets = useMemo(() => {
    const query = text(searchQuery).toLowerCase();
    const lastOutlet = selectedOutlets[selectedOutlets.length - 1];
    const selectedKeys = new Set(selectedOutlets.map(getOutletKey));

    return outlets
      .filter((outlet) => {
        // Hanya tampilkan outlet milik frontliner yang dipilih
        if (selectedFrontliner && text(outlet.frontliner) !== selectedFrontliner) return false;
        // Jangan tampilkan yang sudah dipilih
        if (selectedKeys.has(getOutletKey(outlet))) return false;
        // Filter pencarian
        const name = text(outlet.outletName).toLowerCase();
        const id = text(outlet.outletId).toLowerCase();
        if (query && !name.includes(query) && !id.includes(query)) return false;
        return true;
      })
      .map((outlet) => ({
        outlet,
        distance: lastOutlet ? getDistanceKm(lastOutlet, outlet) : null,
      }))
      .sort((a, b) => {
        if (a.distance != null && b.distance != null) return a.distance - b.distance;
        if (a.distance != null) return -1;
        if (b.distance != null) return 1;
        return text(a.outlet.outletName).localeCompare(text(b.outlet.outletName));
      });
  }, [outlets, searchQuery, selectedOutlets, selectedFrontliner]);

  const notify = (message, severity = 'success') => setNotice({ message, severity });

  const handleAddOutlet = (outlet) => {
    if (selectedOutlets.length >= TARGET_OUTLETS) {
      notify('Maksimal 13 outlet per hari.', 'warning');
      return;
    }
    setSelectedOutlets((prev) => [...prev, makeOutletSnapshot(outlet)]);
    setSearchQuery(''); // Reset search agar fokus ke rekomendasi terdekat
    notify('Outlet ditambahkan.');
  };

  const handleRemoveOutlet = (key) => {
    setSelectedOutlets((prev) => prev.filter((item) => getOutletKey(item) !== key));
  };

  const handleLoadSchedule = (schedule) => {
    setSelectedFrontliner(schedule.frontliner || '');
    setSelectedDate(schedule.date || todayLocal());
    setSelectedOutlets(Array.isArray(schedule.outlets) ? schedule.outlets.map(makeOutletSnapshot) : []);
    setEditingId(schedule.id);
    setReviewDate('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    notify('Jadwal dimuat untuk diedit.', 'info');
  };

  const handleSave = async (status) => {
    if (!selectedFrontliner || !selectedDate) return notify('Pilih frontliner dan tanggal.', 'warning');
    if (selectedOutlets.length === 0) return notify('Tambahkan minimal 1 outlet.', 'warning');
    if (status === 'final' && selectedOutlets.length < TARGET_OUTLETS) {
      return notify(`Minimal ${TARGET_OUTLETS} outlet untuk finalisasi. Saat ini: ${selectedOutlets.length}.`, 'warning');
    }

    setSaving(true);
    try {
      await saveVisitSchedule({
        id: editingId || undefined,
        date: selectedDate,
        frontliner: selectedFrontliner,
        outlets: selectedOutlets,
        status,
        totalOutlets: selectedOutlets.length,
        rtgCount,
      });
      notify(status === 'final' ? 'Jadwal berhasil difinalisasi!' : 'Draft berhasil disimpan.');
      setEditingId(null);
      setSelectedOutlets([]);
      setSearchQuery('');
    } catch (error) {
      notify('Gagal menyimpan jadwal.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!deleteDialog.id) return;
    try {
      await deleteVisitSchedule(deleteDialog.id);
      notify('Jadwal berhasil dihapus.');
      setDeleteDialog({ open: false, id: null });
    } catch (error) {
      notify('Gagal menghapus jadwal.', 'error');
    }
  };

  const formatDistance = (d) => d == null ? 'Jarak tidak tersedia' : d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
  const filteredSchedules = useMemo(() => 
    visitSchedules.filter(s => !reviewDate || s.date === reviewDate).sort((a, b) => b.date.localeCompare(a.date)),
  [visitSchedules, reviewDate]);

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, minWidth: 0, maxWidth: 1200, mx: 'auto' }}>
      {/* HEADER */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <CalendarMonth color="primary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h5" fontWeight={800} color="primary.main">Jadwal Kunjungan MD</Typography>
          <Typography variant="body2" color="text.secondary">Pilih frontliner, tentukan tanggal, dan susun 13 outlet terdekat.</Typography>
        </Box>
      </Stack>

      {notice && <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice.message}</Alert>}

      {/* 1. KONFIGURASI DASAR */}
      <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>1. Konfigurasi Dasar</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Pilih Frontliner / MD</InputLabel>
                <Select value={selectedFrontliner} label="Pilih Frontliner / MD" onChange={(e) => { setSelectedFrontliner(e.target.value); setSelectedOutlets([]); }}>
                  {safeFrontliners.map((fl) => <MenuItem key={fl} value={fl}>{fl}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" type="date" label="Tanggal Kunjungan" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {selectedFrontliner && (
        <>
          {/* 2. PENCARIAN & PEMILIHAN OUTLET */}
          <Grid container spacing={3}>
            {/* Kolom Kiri: Search & Rekomendasi */}
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>2. Cari & Pilih Outlet</Typography>
                  
                  {selectedOutlets.length > 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Rekomendasi diurutkan berdasarkan jarak dari: <b>{selectedOutlets[selectedOutlets.length - 1].outletName}</b>
                    </Alert>
                  )}

                  <TextField
                    fullWidth size="small" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama atau ID outlet..."
                    InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} /> }}
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ maxHeight: 500, overflowY: 'auto', pr: 1 }}>
                    {recommendedOutlets.length === 0 ? (
                      <Alert severity="info">Tidak ada outlet yang cocok atau semua outlet sudah dipilih.</Alert>
                    ) : (
                      recommendedOutlets.slice(0, 50).map(({ outlet, distance }) => {
                        const key = getOutletKey(outlet);
                        return (
                          <Card key={key} variant="outlined" sx={{ mb: 1, borderColor: 'divider' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography fontWeight={700} noWrap>{outlet.outletName}</Typography>
                                  <Typography variant="caption" color="text.secondary">ID: {outlet.outletId}</Typography>
                                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                    <Chip size="small" icon={<GpsFixed />} label={formatDistance(distance)} />
                                    {isRTG(outlet) && <Chip size="small" label="RTG" color="warning" />}
                                  </Stack>
                                </Box>
                                <Button size="small" variant="contained" startIcon={<AddLocationAlt />} onClick={() => handleAddOutlet(outlet)}>
                                  Pilih
                                </Button>
                              </Stack>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Kolom Kanan: Outlet Terpilih & Validasi */}
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: selectedOutlets.length === TARGET_OUTLETS ? 'success.main' : 'divider', height: '100%' }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight={700}>Outlet Terpilih</Typography>
                    <Chip label={`${selectedOutlets.length}/${TARGET_OUTLETS}`} color={selectedOutlets.length === TARGET_OUTLETS ? 'success' : 'default'} />
                  </Stack>

                  {/* Validasi RTG */}
                  {rtgCount > MAX_RTG && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Peringatan: Anda telah memilih {rtgCount} outlet RTG. Maksimal rekomendasi adalah {MAX_RTG}.
                    </Alert>
                  )}

                  <TableContainer sx={{ maxHeight: 400, mb: 2 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>No</TableCell>
                          <TableCell>Outlet</TableCell>
                          <TableCell align="center">Aksi</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOutlets.map((outlet, index) => (
                          <TableRow key={getOutletKey(outlet)} hover>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <Typography fontWeight={600} noWrap sx={{ maxWidth: 150 }}>{outlet.outletName}</Typography>
                              {isRTG(outlet) && <Chip size="small" label="RTG" color="warning" sx={{ mt: 0.5 }} />}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" color="error" onClick={() => handleRemoveOutlet(getOutletKey(outlet))}>
                                <Close fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        {selectedOutlets.length === 0 && (
                          <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>Belum ada outlet dipilih</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Stack spacing={1}>
                    <Button fullWidth variant="outlined" startIcon={saving ? <CircularProgress size={18} /> : <Save />} disabled={saving || selectedOutlets.length === 0} onClick={() => handleSave('draft')}>
                      Simpan Draft
                    </Button>
                    <Button fullWidth variant="contained" color="success" startIcon={<CheckCircle />} disabled={saving || selectedOutlets.length < TARGET_OUTLETS} onClick={() => handleSave('final')}>
                      Finalisasi Jadwal (Min. {TARGET_OUTLETS})
                    </Button>
                    {editingId && (
                      <Button fullWidth variant="text" color="inherit" onClick={() => { setEditingId(null); setSelectedOutlets([]); setSearchQuery(''); }}>
                        Batal Edit
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* 3. REVIEW & RIWAYAT JADWAL */}
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>3. Riwayat Jadwal Tersimpan</Typography>
                <TextField size="small" type="date" label="Filter Tanggal" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: { xs: '100%', sm: 200 } }} />
              </Stack>

              {filteredSchedules.length === 0 ? (
                <Alert severity="info">Tidak ada jadwal yang ditemukan untuk filter ini.</Alert>
              ) : (
                <Stack spacing={2}>
                  {filteredSchedules.map((schedule) => {
                    const isFinal = schedule.status === 'final';
                    return (
                      <Card key={schedule.id} variant="outlined" sx={{ borderColor: isFinal ? 'success.light' : 'warning.light' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                            <Box sx={{ flex: 1 }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                <Typography fontWeight={700}>{schedule.frontliner}</Typography>
                                <Chip size="small" label={isFinal ? 'Final' : 'Draft'} color={isFinal ? 'success' : 'warning'} />
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                📅 {schedule.date} &nbsp;|&nbsp; 🏪 {schedule.totalOutlets} Outlet &nbsp;|&nbsp; ❄️ {schedule.rtgCount} RTG
                              </Typography>
                              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                {(schedule.outlets || []).slice(0, 5).map((o, i) => (
                                  <Chip key={i} size="small" variant="outlined" label={`${i + 1}. ${o.outletName}`} />
                                ))}
                                {(schedule.outlets || []).length > 5 && <Chip size="small" label={`+${(schedule.outlets || []).length - 5} lagi`} />}
                              </Stack>
                            </Box>
                            <Stack direction="row" spacing={1}>
                              <Button size="small" variant="outlined" startIcon={<Edit />} onClick={() => handleLoadSchedule(schedule)}>Edit</Button>
                              <Button size="small" variant="outlined" color="error" startIcon={<Delete />} onClick={() => setDeleteDialog({ open: true, id: schedule.id })}>Hapus</Button>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog Konfirmasi Hapus */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Hapus Jadwal?</DialogTitle>
        <DialogContent>
          <Typography>Jadwal yang dihapus tidak dapat dikembalikan. Lanjutkan?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Batal</Button>
          <Button variant="contained" color="error" onClick={handleDeleteSchedule}>Ya, Hapus</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VisitSchedulePage;
