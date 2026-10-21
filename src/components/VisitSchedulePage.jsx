
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import {
  AddLocationAlt,
  CalendarMonth,
  CheckCircle,
  Close,
  DeleteOutline,
  Edit,
  Flag,
  GpsFixed,
  MapPin,
  NearMe,
  Save,
  Search,
  Store,
  WarningAmber,
} from '@mui/icons-material';

import { useData } from '../context/DataContext';

const TARGET_OUTLETS = 13;
const MAX_RTG = 4;

const todayLocal = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 10);
};

const text = (value) => String(value ?? '').trim();

const getOutletKey = (outlet) =>
  text(outlet?.id || outlet?.outletId || outlet?.outletName);

const isRTG = (outlet) =>
  text(outlet?.rtgFreezer).toLowerCase() === 'rtg';

const getDistanceKm = (a, b) => {
  const lat1 = Number(a?.latitude);
  const lon1 = Number(a?.longitude);
  const lat2 = Number(b?.latitude);
  const lon2 = Number(b?.longitude);

  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2) ||
    !a?.latitude ||
    !a?.longitude ||
    !b?.latitude ||
    !b?.longitude
  ) {
    return null;
  }

  const rad = (n) => (n * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);

  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) *
      Math.cos(rad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return (
    6371 *
    2 *
    Math.atan2(
      Math.sqrt(value),
      Math.sqrt(Math.max(0, 1 - value))
    )
  );
};

const makeOutletSnapshot = (outlet) => ({
  id: getOutletKey(outlet),
  outletId: text(outlet?.outletId),
  outletName: text(outlet?.outletName),
  account: text(outlet?.account),
  frontliner: text(outlet?.frontliner),
  rtgFreezer: text(outlet?.rtgFreezer),
  district: text(outlet?.district),
  latitude: outlet?.latitude ?? null,
  longitude: outlet?.longitude ?? null,
});

const VisitSchedulePage = () => {
  const {
    outlets = [],
    frontliners = [],
    visitSchedules = [],
    saveVisitSchedule,
  } = useData();

  const [selectedFrontliner, setSelectedFrontliner] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [selectedOutlets, setSelectedOutlets] = useState([]);
  const [searchOutlet, setSearchOutlet] = useState('');
  const [reviewFrontliner, setReviewFrontliner] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [pendingOutlet, setPendingOutlet] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  const [warningDialog, setWarningDialog] = useState({
    open: false,
    outlet: null,
    messages: [],
  });

  const safeOutlets = useMemo(
    () => (Array.isArray(outlets) ? outlets.filter(Boolean) : []),
    [outlets]
  );

  const safeFrontliners = useMemo(
    () =>
      [...new Set(
        (Array.isArray(frontliners) ? frontliners : [])
          .map(text)
          .filter(Boolean)
      )].sort((a, b) => a.localeCompare(b)),
    [frontliners]
  );

  const safeSchedules = useMemo(
    () =>
      (Array.isArray(visitSchedules) ? visitSchedules : [])
        .filter(Boolean)
        .sort((a, b) =>
          text(b.date).localeCompare(text(a.date))
        ),
    [visitSchedules]
  );

  const selectedKeys = useMemo(
    () => new Set(selectedOutlets.map(getOutletKey)),
    [selectedOutlets]
  );

  const rtgCount = useMemo(
    () => selectedOutlets.filter(isRTG).length,
    [selectedOutlets]
  );

  const remaining = TARGET_OUTLETS - selectedOutlets.length;

  const sameDaySchedules = useMemo(
    () =>
      safeSchedules.filter(
        (schedule) =>
          schedule.date === selectedDate &&
          schedule.id !== editingId
      ),
    [safeSchedules, selectedDate, editingId]
  );

  const recommendedOutlets = useMemo(() => {
    const query = text(searchOutlet).toLowerCase();

    const lastOutlet = selectedOutlets[selectedOutlets.length - 1];

    return safeOutlets
      .filter((outlet) => {
        const name = text(outlet.outletName).toLowerCase();
        const id = text(outlet.outletId).toLowerCase();
        const account = text(outlet.account).toLowerCase();

        if (
          query &&
          !name.includes(query) &&
          !id.includes(query) &&
          !account.includes(query)
        ) {
          return false;
        }

        return true;
      })
      .map((outlet) => ({
        outlet,
        distance: lastOutlet
          ? getDistanceKm(lastOutlet, outlet)
          : null,
      }))
      .sort((a, b) => {
        if (a.distance != null && b.distance != null) {
          return a.distance - b.distance;
        }

        if (a.distance != null) return -1;
        if (b.distance != null) return 1;

        return text(a.outlet.outletName).localeCompare(
          text(b.outlet.outletName)
        );
      });
  }, [safeOutlets, searchOutlet, selectedOutlets]);

  const filteredSchedules = useMemo(
    () =>
      safeSchedules.filter((schedule) => {
        const matchFrontliner =
          !reviewFrontliner ||
          schedule.frontliner === reviewFrontliner;

        const matchDate =
          !reviewDate || schedule.date === reviewDate;

        return matchFrontliner && matchDate;
      }),
    [safeSchedules, reviewFrontliner, reviewDate]
  );

  const notify = (message, severity = 'success') => {
    setNotice({ message, severity });
  };

  const resetEditor = () => {
    setSelectedFrontliner('');
    setSelectedDate(todayLocal());
    setSelectedOutlets([]);
    setSearchOutlet('');
    setEditingId(null);
  };

  const checkWarnings = (outlet) => {
    const messages = [];
    const key = getOutletKey(outlet);

    const alreadySelected = selectedOutlets.some(
      (item) => getOutletKey(item) === key
    );

    const scheduledElsewhere = sameDaySchedules.some(
      (schedule) =>
        (schedule.outlets || []).some(
          (item) => getOutletKey(item) === key
        )
    );

    if (alreadySelected || scheduledElsewhere) {
      messages.push(
        scheduledElsewhere
          ? 'Outlet ini sudah terjadwal pada tanggal yang sama.'
          : 'Outlet ini sudah ditambahkan ke jadwal hari ini.'
      );
    }

    if (
      text(outlet.frontliner) &&
      text(outlet.frontliner) !== selectedFrontliner
    ) {
      messages.push(
        `Outlet ini terdaftar atas nama MD ${outlet.frontliner}, bukan ${selectedFrontliner}.`
      );
    }

    return messages;
  };

  const handleChooseOutlet = (outlet) => {
    if (selectedOutlets.length >= TARGET_OUTLETS) {
      notify('Maksimal 13 outlet per hari.', 'warning');
      return;
    }

    const messages = checkWarnings(outlet);

    if (messages.length > 0) {
      setPendingOutlet(outlet);
      setWarningDialog({
        open: true,
        outlet,
        messages,
      });
      return;
    }

    addOutlet(outlet);
  };

  const addOutlet = (outlet) => {
    const key = getOutletKey(outlet);

    if (selectedOutlets.length >= TARGET_OUTLETS) {
      notify('Maksimal 13 outlet per hari.', 'warning');
      return;
    }

    if (selectedOutlets.some((item) => getOutletKey(item) === key)) {
      notify('Outlet yang sama tidak dapat ditambahkan dua kali.', 'warning');
      return;
    }

    setSelectedOutlets((prev) => [
      ...prev,
      makeOutletSnapshot(outlet),
    ]);

    setWarningDialog({
      open: false,
      outlet: null,
      messages: [],
    });
    setPendingOutlet(null);
    notify('Outlet ditambahkan ke jadwal.');
  };

  const confirmAddOutlet = () => {
    if (pendingOutlet) addOutlet(pendingOutlet);
  };

  const removeSelectedOutlet = (key) => {
    setSelectedOutlets((prev) =>
      prev.filter((item) => getOutletKey(item) !== key)
    );
  };

  const moveOutlet = (index, direction) => {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= selectedOutlets.length) {
      return;
    }

    setSelectedOutlets((prev) => {
      const next = [...prev];
      [next[index], next[nextIndex]] = [
        next[nextIndex],
        next[index],
      ];
      return next;
    });
  };

  const handleLoadSchedule = (schedule) => {
    setSelectedFrontliner(schedule.frontliner || '');
    setSelectedDate(schedule.date || todayLocal());
    setSelectedOutlets(
      Array.isArray(schedule.outlets)
        ? schedule.outlets.map(makeOutletSnapshot)
        : []
    );
    setEditingId(schedule.id);
    setSearchOutlet('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    notify('Jadwal dimuat untuk direview atau diedit.', 'info');
  };

  const handleSave = async (status) => {
    if (!selectedFrontliner || !selectedDate) {
      notify('Pilih frontliner dan tanggal terlebih dahulu.', 'warning');
      return;
    }

    if (selectedOutlets.length === 0) {
      notify('Tambahkan outlet terlebih dahulu.', 'warning');
      return;
    }

    if (status === 'final' && selectedOutlets.length !== TARGET_OUTLETS) {
      notify(
        `Jadwal belum dapat difinalisasi. Lengkapi ${remaining} outlet lagi.`,
        'warning'
      );
      return;
    }

    const duplicateKeys = new Set();
    const seen = new Set();

    for (const item of selectedOutlets) {
      const key = getOutletKey(item);

      if (seen.has(key)) duplicateKeys.add(key);
      seen.add(key);
    }

    if (duplicateKeys.size > 0) {
      notify('Masih ada outlet duplikat dalam jadwal.', 'error');
      return;
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

      notify(
        status === 'final'
          ? 'Jadwal berhasil difinalisasi.'
          : 'Draft jadwal berhasil disimpan.'
      );

      setEditingId(null);
    } catch (error) {
      console.error('Gagal menyimpan jadwal:', error);
      notify(
        error?.message || 'Gagal menyimpan jadwal ke Firebase.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleNewSchedule = () => {
    resetEditor();
    setNotice(null);
  };

  const formatDistance = (distance) =>
    distance == null
      ? 'Jarak tidak tersedia'
      : distance < 1
        ? `${Math.round(distance * 1000)} m`
        : `${distance.toFixed(1)} km`;

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, minWidth: 0 }}>
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <CalendarMonth color="primary" sx={{ fontSize: 34 }} />
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
            color="primary.main"
            sx={{ fontSize: { xs: '1.4rem', md: '2rem' } }}
          >
            Jadwal Kunjungan MD
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Rencanakan 13 outlet per hari, periksa peringatan, dan review jadwal.
          </Typography>
        </Box>
      </Stack>

      {notice && (
        <Alert
          severity={notice.severity}
          sx={{ my: 2 }}
          onClose={() => setNotice(null)}
        >
          {notice.message}
        </Alert>
      )}

      {/* EDITOR JADWAL */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 1.5, md: 3 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: 2 }}
          >
            <Typography variant="h6" fontWeight={700}>
              {editingId ? 'Edit Jadwal' : 'Buat Jadwal Baru'}
            </Typography>

            {editingId && (
              <Button
                startIcon={<Close />}
                onClick={handleNewSchedule}
                color="inherit"
              >
                Batal Edit
              </Button>
            )}
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="md-label">Pilih Frontliner / MD</InputLabel>
                <Select
                  labelId="md-label"
                  label="Pilih Frontliner / MD"
                  value={selectedFrontliner}
                  onChange={(event) => {
                    setSelectedFrontliner(event.target.value);
                  }}
                >
                  {safeFrontliners.map((fl) => (
                    <MenuItem key={fl} value={fl}>
                      {fl}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Tanggal Kunjungan"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {!selectedFrontliner && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Pilih frontliner terlebih dahulu untuk mulai menyusun jadwal.
            </Alert>
          )}

          {selectedFrontliner && (
            <>
              <Grid container spacing={1.5} sx={{ mt: 0.5, mb: 2 }}>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary">
                        Outlet terpilih
                      </Typography>
                      <Typography variant="h5" fontWeight={800}>
                        {selectedOutlets.length}/{TARGET_OUTLETS}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(selectedOutlets.length / TARGET_OUTLETS) * 100}
                        sx={{ mt: 1, borderRadius: 2 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary">
                        Sisa outlet
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight={800}
                        color={remaining > 0 ? 'warning.main' : 'success.main'}
                      >
                        {Math.max(remaining, 0)}
                      </Typography>
                      <Typography variant="caption">
                        Target wajib 13
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary">
                        Total RTG
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight={800}
                        color={rtgCount > MAX_RTG ? 'error.main' : 'text.primary'}
                      >
                        {rtgCount}
                      </Typography>
                      <Typography variant="caption">
                        Batas rekomendasi: 4
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          size="small"
                          color={
                            selectedOutlets.length === TARGET_OUTLETS
                              ? 'success'
                              : 'warning'
                          }
                          label={
                            selectedOutlets.length === TARGET_OUTLETS
                              ? 'Siap final'
                              : 'Belum lengkap'
                          }
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {selectedOutlets.length < TARGET_OUTLETS && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Jadwal masih kurang {remaining} outlet. Lengkapi menjadi 13
                  outlet sebelum melakukan finalisasi.
                </Alert>
              )}

              {rtgCount > MAX_RTG && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Terdapat {rtgCount} outlet RTG. Disarankan mengurangi RTG
                  menjadi maksimal 4. Peringatan ini tidak menghalangi
                  penyimpanan jadwal.
                </Alert>
              )}

              {/* REKOMENDASI OUTLET */}
              <Divider sx={{ my: 2 }} />

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1.5 }}
              >
                <NearMe color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Rekomendasi Outlet
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {selectedOutlets.length
                  ? `Jarak dihitung dari outlet terakhir: ${
                      selectedOutlets[selectedOutlets.length - 1].outletName
                    }.`
                  : 'Pilih outlet pertama. Setelah itu, kandidat akan diurutkan berdasarkan jarak dari outlet terakhir.'}
              </Typography>

              <TextField
                fullWidth
                size="small"
                value={searchOutlet}
                onChange={(event) => setSearchOutlet(event.target.value)}
                placeholder="Cari nama outlet, ID, atau account..."
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                }}
                sx={{ mb: 2 }}
              />

              <Stack spacing={1} sx={{ maxHeight: 400, overflowY: 'auto', pr: 0.5 }}>
                {recommendedOutlets.slice(0, 100).map(({ outlet, distance }) => {
                  const key = getOutletKey(outlet);
                  const alreadyAdded = selectedKeys.has(key);
                  const otherOwner =
                    text(outlet.frontliner) &&
                    text(outlet.frontliner) !== selectedFrontliner;

                  return (
                    <Card
                      key={key}
                      variant="outlined"
                      sx={{
                        borderColor: alreadyAdded ? 'warning.main' : 'divider',
                        opacity: alreadyAdded ? 0.65 : 1,
                      }}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          justifyContent="space-between"
                          alignItems={{ xs: 'stretch', sm: 'center' }}
                          spacing={1}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>
                              {outlet.outletName || 'Tanpa Nama'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {outlet.outletId || '-'} · {outlet.account || '-'}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={0.75}
                              flexWrap="wrap"
                              useFlexGap
                              sx={{ mt: 0.75 }}
                            >
                              <Chip
                                size="small"
                                icon={<GpsFixed />}
                                label={formatDistance(distance)}
                              />
                              <Chip
                                size="small"
                                label={outlet.rtgFreezer || 'Tanpa RTG/Freezer'}
                                color={isRTG(outlet) ? 'warning' : 'default'}
                              />
                              {otherOwner && (
                                <Chip
                                  size="small"
                                  color="error"
                                  label={`MD: ${outlet.frontliner}`}
                                />
                              )}
                              {alreadyAdded && (
                                <Chip size="small" label="Sudah dipilih" />
                              )}
                            </Stack>
                          </Box>

                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddLocationAlt />}
                            disabled={
                              selectedOutlets.length >= TARGET_OUTLETS ||
                              alreadyAdded
                            }
                            onClick={() => handleChooseOutlet(outlet)}
                          >
                            Tambahkan
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}

                {recommendedOutlets.length === 0 && (
                  <Alert severity="info">
                    Outlet tidak ditemukan. Coba kata kunci lain.
                  </Alert>
                )}
              </Stack>

              {/* URUTAN KUNJUNGAN */}
              <Divider sx={{ my: 3 }} />

              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1.5 }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Urutan Kunjungan ({selectedOutlets.length})
                </Typography>
                <Chip
                  label={selectedDate}
                  icon={<CalendarMonth />}
                  variant="outlined"
                />
              </Stack>

              {selectedOutlets.length === 0 ? (
                <Alert severity="info">
                  Belum ada outlet. Tambahkan outlet dari rekomendasi di atas.
                </Alert>
              ) : (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>No.</TableCell>
                        <TableCell>Outlet</TableCell>
                        <TableCell>Account</TableCell>
                        <TableCell>RTG/Freezer</TableCell>
                        <TableCell align="center">Urutan</TableCell>
                        <TableCell align="center">Hapus</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOutlets.map((outlet, index) => (
                        <TableRow key={`${getOutletKey(outlet)}-${index}`} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Typography fontWeight={600}>
                              {outlet.outletName || '-'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {outlet.outletId || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>{outlet.account || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={outlet.rtgFreezer || '-'}
                              color={isRTG(outlet) ? 'warning' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" justifyContent="center">
                              <IconButton
                                size="small"
                                disabled={index === 0}
                                onClick={() => moveOutlet(index, -1)}
                                aria-label="Naikkan urutan"
                              >
                                ↑
                              </IconButton>
                              <IconButton
                                size="small"
                                disabled={index === selectedOutlets.length - 1}
                                onClick={() => moveOutlet(index, 1)}
                                aria-label="Turunkan urutan"
                              >
                                ↓
                              </IconButton>
                            </Stack>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => removeSelectedOutlet(getOutletKey(outlet))}
                              aria-label="Hapus dari jadwal"
                            >
                              <DeleteOutline />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ mt: 2 }}
              >
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={saving ? <CircularProgress size={18} /> : <Save />}
                  disabled={saving || selectedOutlets.length === 0}
                  onClick={() => handleSave('draft')}
                >
                  Simpan Draft
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  disabled={
                    saving ||
                    selectedOutlets.length !== TARGET_OUTLETS
                  }
                  onClick={() => handleSave('final')}
                >
                  Finalisasi 13 Outlet
                </Button>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>

      {/* REVIEW JADWAL */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 1.5, md: 3 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Review Jadwal Tersimpan
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Buka jadwal untuk memeriksa atau mengedit kembali.
              </Typography>
            </Box>
            <Chip label={`${filteredSchedules.length} jadwal`} />
          </Stack>

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="review-md-label">Filter Frontliner</InputLabel>
                <Select
                  labelId="review-md-label"
                  label="Filter Frontliner"
                  value={reviewFrontliner}
                  onChange={(event) => setReviewFrontliner(event.target.value)}
                >
                  <MenuItem value="">Semua Frontliner</MenuItem>
                  {safeFrontliners.map((fl) => (
                    <MenuItem key={fl} value={fl}>{fl}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Filter Tanggal"
                value={reviewDate}
                onChange={(event) => setReviewDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {filteredSchedules.length === 0 ? (
            <Alert severity="info">
              Belum ada jadwal yang cocok dengan filter.
            </Alert>
          ) : (
            <Stack spacing={1.5}>
              {filteredSchedules.map((schedule) => {
                const scheduleOutlets = Array.isArray(schedule.outlets)
                  ? schedule.outlets
                  : [];
                const scheduleRTG = scheduleOutlets.filter(isRTG).length;
                const isFinal = schedule.status === 'final';

                return (
                  <Card key={schedule.id} variant="outlined">
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        justifyContent="space-between"
                        spacing={1.5}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={700}>
                            {schedule.frontliner || 'Tanpa Frontliner'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {schedule.date || '-'} · {scheduleOutlets.length} outlet
                            · {scheduleRTG} RTG
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={0.75}
                            flexWrap="wrap"
                            useFlexGap
                            sx={{ mt: 1 }}
                          >
                            <Chip
                              size="small"
                              label={isFinal ? 'Final' : 'Draft'}
                              color={isFinal ? 'success' : 'warning'}
                            />
                            {scheduleOutlets.length !== TARGET_OUTLETS && (
                              <Chip
                                size="small"
                                label={`Kurang ${TARGET_OUTLETS - scheduleOutlets.length} outlet`}
                                color="warning"
                              />
                            )}
                            {scheduleRTG > MAX_RTG && (
                              <Chip
                                size="small"
                                label="RTG > 4"
                                color="warning"
                              />
                            )}
                          </Stack>
                        </Box>

                        <Button
                          variant="outlined"
                          startIcon={<Edit />}
                          onClick={() => handleLoadSchedule(schedule)}
                        >
                          Review / Edit
                        </Button>
                      </Stack>

                      <Divider sx={{ my: 1.5 }} />

                      <Stack
                        direction="row"
                        spacing={0.75}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {scheduleOutlets.map((outlet, index) => (
                          <Chip
                            key={`${getOutletKey(outlet)}-${index}`}
                            size="small"
                            variant="outlined"
                            label={`${index + 1}. ${outlet.outletName || outlet.outletId || 'Outlet'}`}
                          />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* KONFIRMASI DUPLIKAT / PEMILIK LAIN */}
      <Dialog
        open={warningDialog.open}
        onClose={() => {
          setWarningDialog({ open: false, outlet: null, messages: [] });
          setPendingOutlet(null);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningAmber color="warning" />
            Konfirmasi Outlet
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography fontWeight={700} sx={{ mb: 1 }}>
            {warningDialog.outlet?.outletName || 'Outlet'}
          </Typography>

          {warningDialog.messages.map((message, index) => (
            <Alert severity="warning" key={index} sx={{ mb: 1 }}>
              {message}
            </Alert>
          ))}

          <Typography variant="body2" color="text.secondary">
            Apakah kamu tetap ingin menambahkan outlet ini ke jadwal?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setWarningDialog({ open: false, outlet: null, messages: [] });
              setPendingOutlet(null);
            }}
          >
            Batal
          </Button>
          <Button variant="contained" onClick={confirmAddOutlet}>
            Ya, Tambahkan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VisitSchedulePage;
