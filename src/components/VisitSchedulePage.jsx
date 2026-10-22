import React, { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  FormControl, Grid, IconButton, InputLabel, MenuItem, Select,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Typography, Collapse
} from '@mui/material';
import {
  AddLocationAlt, CalendarMonth, CheckCircle, Close, Delete,
  Edit, ExpandLess, ExpandMore, GpsFixed, Save, Search
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

// ✅ Komponen helper: Label di atas, input di bawah (tidak pernah terpotong)
const FormField = ({ label, children, sx = {} }) => (
  <Box sx={{ width: '100%', ...sx }}>
    <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>
      {label}
    </Typography>
    {children}
  </Box>
);

const VisitSchedulePage = () => {
  const { outlets = [], frontliners = [], visitSchedules = [], saveVisitSchedule, deleteVisitSchedule } = useData();

  const [selectedFrontliner, setSelectedFrontliner] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [selectedOutlets, setSelectedOutlets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const [reviewDate, setReviewDate] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [recommendationsExpanded, setRecommendationsExpanded] = useState(true);

  const safeFrontliners = useMemo(() =>
    [...new Set(frontliners.map(text).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
  [frontliners]);

  const rtgCount = useMemo(() => selectedOutlets.filter(isRTG).length, [selectedOutlets]);

  const recommendedOutlets = useMemo(() => {
    const query = text(searchQuery).toLowerCase();
    const lastOutlet = selectedOutlets[selectedOutlets.length - 1];
    const selectedKeys = new Set(selectedOutlets.map(getOutletKey));

    return outlets
      .filter((outlet) => {
        if (selectedFrontliner && text(outlet.frontliner) !== selectedFrontliner) return false;
        if (selectedKeys.has(getOutletKey(outlet))) return false;
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
    setSearchQuery('');
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
    <Box sx={{ p: { xs: 1.5, md: 3 }, minWidth: 0, maxWidth: 1400, mx: 'auto' }}>
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
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>1. Konfigurasi Dasar</Typography>
          <Grid container spacing={2}>
            {/* ✅ xs={12}: full width di mobile, label tidak terpotong */}
            <Grid item xs={12} sm={6}>
              <FormField label="Pilih Frontliner / MD">
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedFrontliner}
                    onChange={(e) => { setSelectedFrontliner(e.target.value); setSelectedOutlets([]); }}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>Pilih frontliner...</MenuItem>
                    {safeFrontliners.map((fl) => <MenuItem key={fl} value={fl}>{fl}</MenuItem>)}
                  </Select>
                </FormControl>
              </FormField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField label="Tanggal Kunjungan">
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </FormField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {selectedFrontliner && (
        <>
          {/* 2. PENCARIAN & PEMILIHAN OUTLET */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
            {/* Kolom Kiri */}
            <Box sx={{ flex: { md: '1 1 60%' }, width: '100%' }}>
              <Card sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>2. Cari & Pilih Outlet</Typography>

                  {selectedOutlets.length > 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Rekomendasi diurutkan berdasarkan jarak dari: <b>{selectedOutlets[selectedOutlets.length - 1].outletName}</b>
                    </Alert>
                  )}

                  <TextField
                    fullWidth
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama atau ID outlet..."
                    InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} /> }}
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {recommendedOutlets.length} outlet ditemukan
                    </Typography>
                    <Button
                      size="small"
                      startIcon={recommendationsExpanded ? <ExpandLess /> : <ExpandMore />}
                      onClick={() => setRecommendationsExpanded(!recommendationsExpanded)}
                    >
                      {recommendationsExpanded ? 'Sembunyikan' : 'Tampilkan'}
                    </Button>
                  </Box>

                  <Collapse in={recommendationsExpanded} sx={{ flex: 1 }}>
                    <Box sx={{ maxHeight: 500, overflowY: 'auto', pr: 1 }}>
                      {recommendedOutlets.length === 0 ? (
                        <Alert severity="info">Tidak ada outlet yang cocok atau semua outlet sudah dipilih.</Alert>
                      ) : (
                        recommendedOutlets.slice(0, 50).map(({ outlet, distance }) => {
                          const key = getOutletKey(outlet);
                          return (
                            <Card key={key} variant="outlined" sx={{ mb: 1, borderColor: 'divider' }}>
                              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
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
                  </Collapse>
                </CardContent>
              </Card>
            </Box>

            {/* Kolom Kanan */}
            <Box sx={{ flex: { md: '1 1 40%' }, width: '100%' }}>
              <Card sx={{ borderRadius: 2, height: '100%', border: selectedOutlets.length === TARGET_OUTLETS ? '2px solid' : undefined, borderColor: 'success.main' }}>
                <CardContent sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight={700}>Outlet Terpilih</Typography>
                    <Chip label={`${selectedOutlets.length}/${TARGET_OUTLETS}`} color={selectedOutlets.length === TARGET_OUTLETS ? 'success' : 'default'} />
                  </Stack>

                  {rtgCount > MAX_RTG && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Peringatan: Anda telah memilih {rtgCount} outlet RTG. Maksimal rekomendasi adalah {MAX_RTG}.
                    </Alert>
                  )}

                  <TableContainer sx={{ maxHeight: 400, mb: 2, flex: 1 }}>
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

                  <Stack spacing={1} sx={{ mt: 'auto' }}>
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
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* 3. RIWAYAT JADWAL */}
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>3. Riwayat Jadwal Tersimpan</Typography>

              {/* ✅ Filter tanggal: label di atas, tidak bertumpuk */}
              <Box sx={{ mb: 3, maxWidth: { xs: '100%', sm: 300 } }}>
                <FormField label="Filter Tanggal">
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={reviewDate}
                    onChange={(e) => setReviewDate(e.target.value)}
                  />
                </FormField>
              </Box>

              {filteredSchedules.length === 0 ? (
                <Alert severity="info">Tidak ada jadwal yang ditemukan untuk filter ini.</Alert>
              ) : (
                <Stack spacing={2}>
                  {filteredSchedules.map((schedule) => {
                    const isFinal = schedule.status === 'final';
                    const scheduleOutlets = Array.isArray(schedule.outlets) ? schedule.outlets : [];
                    return (
                      <Card key={schedule.id} variant="outlined" sx={{ borderColor: isFinal ? 'success.light' : 'warning.light' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }} flexWrap="wrap">
                                <Typography fontWeight={700}>{schedule.frontliner}</Typography>
                                <Chip size="small" label={isFinal ? 'Final' : 'Draft'} color={isFinal ? 'success' : 'warning'} />
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                📅 {schedule.date} &nbsp;|&nbsp;  {schedule.totalOutlets} Outlet &nbsp;|&nbsp; ❄️ {schedule.rtgCount} RTG
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                              <Button size="small" variant="outlined" startIcon={<Edit />} onClick={() => handleLoadSchedule(schedule)}>Edit</Button>
                              <Button size="small" variant="outlined" color="error" startIcon={<Delete />} onClick={() => setDeleteDialog({ open: true, id: schedule.id })}>Hapus</Button>
                            </Stack>
                          </Stack>

                          <Divider sx={{ my: 1.5 }} />
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {scheduleOutlets.map((outlet, index) => (
                              <Chip
                                key={`${getOutletKey(outlet)}-${index}`}
                                size="small"
                                variant="outlined"
                                label={`${index + 1}. ${outlet.outletName}`}
                                sx={{
                                  fontSize: '0.7rem',
                                  height: 22,
                                  '& .MuiChip-label': {
                                    px: 0.8,
                                    maxWidth: 150,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }
                                }}
                              />
                            ))}
                          </Box>
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

      {/* Dialog Hapus */}
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
