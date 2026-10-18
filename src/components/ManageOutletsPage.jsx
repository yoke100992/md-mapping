import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Card, CardContent, Typography, Box, Chip, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  TextField, Alert, useMediaQuery, useTheme, LinearProgress
} from '@mui/material';
import {
  Delete as DeleteIcon, Close as CloseIcon,
  FilterList as FilterIcon, ClearAll as ClearAllIcon, Warning as WarningIcon,
  Store as StoreIcon, AcUnit, Whatshot, Air, Block, ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useData } from '../context/DataContext';
import { getFrontlinerColor } from '../utils/constants';

// Pilihan khusus untuk edit RTG / Freezer di halaman Kelola Outlet
const MANAGE_RTG_LABELS = ['RTG', 'Freezer', 'Freezer Toko'];

const BATCH_SIZE = 50; // Tampilkan 50 data per batch

const ManageOutletsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { outlets, frontliners, updateOutlet, removeOutlet } = useData();

  const [filterAccount, setFilterAccount] = useState('');
  const [filterFrontliner, setFilterFrontliner] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(''); // Untuk debounce

  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [alert, setAlert] = useState(null);

  // PAGINATION: Hanya tampilkan sebagian data
  const [displayCount, setDisplayCount] = useState(BATCH_SIZE);

  // DEBOUNCE: Tunggu 400ms setelah user selesai ketik baru proses search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setDisplayCount(BATCH_SIZE); // Reset pagination saat search berubah
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const uniqueAccounts = useMemo(() =>
    [...new Set(outlets.map(o => o.account).filter(Boolean))].sort(),
  [outlets]);

  const hasActiveFilters = filterAccount || filterFrontliner || debouncedSearch;

  // FILTERING (ringan karena hanya jalan saat ada filter)
  const filteredOutlets = useMemo(() => {
    if (!hasActiveFilters) return [];
    return outlets.filter((o) => {
      if (filterAccount && o.account !== filterAccount) return false;
      if (filterFrontliner && o.frontliner !== filterFrontliner) return false;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        return (o.outletName || '').toLowerCase().includes(q) ||
               (o.outletId || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [outlets, filterAccount, filterFrontliner, debouncedSearch, hasActiveFilters]);

  // DATA YANG DIRENDER (hanya sebagian!)
  const displayedOutlets = useMemo(() => {
    return filteredOutlets.slice(0, displayCount);
  }, [filteredOutlets, displayCount]);

  const hasMore = displayCount < filteredOutlets.length;

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleStartEdit = (outlet, field) => {
    setEditingCell({ id: outlet.id, field });
    setEditValue(outlet[field] || '');
  };

  const handleSaveEdit = async (nextValue = editValue) => {
    if (!editingCell) return;
    const currentEdit = editingCell;
    try {
      await updateOutlet(currentEdit.id, { [currentEdit.field]: nextValue });
      showAlert('Data berhasil diperbarui!');
    } catch (error) {
      console.error('Gagal memperbarui outlet:', error);
      showAlert('Gagal menyimpan perubahan. Periksa koneksi lalu coba lagi.', 'error');
    } finally {
      setEditingCell(null);
    }
  };

  const handleCancelEdit = () => setEditingCell(null);

  const handleConfirmDelete = () => {
    if (deleteDialog) {
      removeOutlet(deleteDialog.id);
      showAlert(`Outlet "${deleteDialog.outletName}" berhasil dihapus!`, 'success');
      setDeleteDialog(null);
    }
  };

  const handleResetFilters = () => {
    setFilterAccount('');
    setFilterFrontliner('');
    setSearchQuery('');
    setDebouncedSearch('');
    setDisplayCount(BATCH_SIZE);
  };

  const getRTGIcon = (rtg) => {
    if (rtg === 'Freezer' || rtg === 'Freezer Toko') return <AcUnit fontSize="small" sx={{ color: '#2196F3' }} />;
    if (rtg === 'RTG') return <Whatshot fontSize="small" sx={{ color: '#FF9800' }} />;
    if (rtg === 'Chiller') return <Air fontSize="small" sx={{ color: '#4CAF50' }} />;
    return <Block fontSize="small" sx={{ color: '#999' }} />;
  };

  const OutletCard = ({ outlet }) => {
    const isEditingFrontliner = editingCell?.id === outlet.id && editingCell?.field === 'frontliner';
    const isEditingRTG = editingCell?.id === outlet.id && editingCell?.field === 'rtgFreezer';
    const flName = String(outlet.frontliner || 'Belum Ada');

    return (
      <Card sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            {isEditingFrontliner ? (
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flex: 1 }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select value={editValue} onChange={(e) => handleSaveEdit(e.target.value)} autoFocus>
                    {frontliners.map((fl) => (
                      <MenuItem key={fl} value={fl}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: getFrontlinerColor(fl) }} />
                          {fl}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton size="small" onClick={handleCancelEdit} aria-label="Batal edit"><CloseIcon fontSize="small" /></IconButton>
              </Box>
            ) : (
              <Chip
                label={String(flName || 'Belum Ada').split(' ').slice(0, 2).join(' ')}
                size="small"
                sx={{ bgcolor: getFrontlinerColor(outlet.frontliner), color: 'white', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => handleStartEdit(outlet, 'frontliner')}
              />
            )}
            <IconButton size="small" color="error" onClick={() => setDeleteDialog(outlet)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>{outlet.outletName || '-'}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary"><b>ID:</b> {outlet.outletId || '-'}</Typography>
            <Typography variant="body2" color="text.secondary"><b>Account:</b> {outlet.account || '-'}</Typography>
            <Typography variant="body2" color="text.secondary"><b>Kecamatan:</b> {outlet.district || '-'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight={600}>RTG / Freezer:</Typography>
            {isEditingRTG ? (
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 110 }}>
                  <Select value={editValue} onChange={(e) => handleSaveEdit(e.target.value)} autoFocus>
                    {MANAGE_RTG_LABELS.map((label) => (
                      <MenuItem key={label} value={label}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getRTGIcon(label)}
                          {label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton size="small" onClick={handleCancelEdit} aria-label="Batal edit"><CloseIcon fontSize="small" /></IconButton>
              </Box>
            ) : (
              <Chip
                icon={getRTGIcon(outlet.rtgFreezer)}
                label={outlet.rtgFreezer || 'None'}
                size="small"
                color={outlet.rtgFreezer === 'Freezer' || outlet.rtgFreezer === 'Standing Freezer' ? 'info' : outlet.rtgFreezer === 'RTG' ? 'warning' : 'default'}
                sx={{ cursor: 'pointer' }}
                onClick={() => handleStartEdit(outlet, 'rtgFreezer')}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 700, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
        <StoreIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Kelola Outlet
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.875rem', md: '1rem' } }}>
        Total data di database: <b>{outlets.length} outlet</b>. Pilih filter untuk memuat data.
      </Typography>

      {alert && (
        <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* FILTER SECTION */}
      <Card sx={{ mb: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: { xs: 1.5, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterIcon color="primary" />
              <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>Filter Data</Typography>
            </Box>
            {hasActiveFilters && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<ClearAllIcon />}
                onClick={handleResetFilters}
              >
                Reset
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <TextField
              label="Cari Nama / ID"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik untuk mencari (auto-search 0.4 detik)..."
              sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 200 } }}
            />
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
              <InputLabel>Account</InputLabel>
              <Select value={filterAccount} label="Account" onChange={(e) => { setFilterAccount(e.target.value); setDisplayCount(BATCH_SIZE); }}>
                <MenuItem value=""><em>Semua Account</em></MenuItem>
                {uniqueAccounts.map((acc) => <MenuItem key={acc} value={acc}>{acc}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
              <InputLabel>MD / Frontliner</InputLabel>
              <Select value={filterFrontliner} label="MD / Frontliner" onChange={(e) => { setFilterFrontliner(e.target.value); setDisplayCount(BATCH_SIZE); }}>
                <MenuItem value=""><em>Semua Frontliner</em></MenuItem>
                {frontliners.map((fl) => (
                  <MenuItem key={fl} value={fl}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: getFrontlinerColor(fl) }} />
                      {fl}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* DATA SECTION */}
      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: { xs: 1, md: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 1 }}>
            <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
              {hasActiveFilters ? `Hasil Filter (${filteredOutlets.length})` : 'Daftar Outlet'}
            </Typography>
          </Box>

          {!hasActiveFilters ? (
            <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
              <FilterIcon sx={{ fontSize: 80, color: 'primary.light', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Silakan Pilih Filter Terlebih Dahulu
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pilih Account, Frontliner, atau ketik nama outlet untuk memuat data.
                <br />
                Total data tersedia: <b>{outlets.length} outlet</b>
              </Typography>
            </Box>
          ) : filteredOutlets.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <StoreIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                Tidak ada outlet yang cocok dengan filter
              </Typography>
            </Box>
          ) : (
            <>
              {/* Progress bar untuk visual feedback */}
              {hasMore && (
                <Box sx={{ mb: 2, px: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Menampilkan {displayedOutlets.length} dari {filteredOutlets.length} data
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(displayedOutlets.length / filteredOutlets.length) * 100}
                    sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                  />
                </Box>
              )}

              {isMobile ? (
                <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                  {displayedOutlets.map((outlet) => <OutletCard key={outlet.id} outlet={outlet} />)}
                </Box>
              ) : (
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{
                    maxHeight: '65vh',
                    overflow: 'auto',
                    '&::-webkit-scrollbar': { width: 8, height: 8 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: '#c41e3a', borderRadius: 4 }
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'white', fontWeight: 700, bgcolor: 'primary.main', position: 'sticky', top: 0, zIndex: 2, minWidth: 150 }}>MD / Frontliner</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, bgcolor: 'primary.main', position: 'sticky', top: 0, zIndex: 2, minWidth: 100 }}>ID Outlet</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, bgcolor: 'primary.main', position: 'sticky', top: 0, zIndex: 2, minWidth: 200 }}>Nama Outlet</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, bgcolor: 'primary.main', position: 'sticky', top: 0, zIndex: 2, minWidth: 120 }}>Account</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, bgcolor: 'primary.main', position: 'sticky', top: 0, zIndex: 2, minWidth: 130 }}>RTG / Freezer</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, bgcolor: 'primary.main', position: 'sticky', top: 0, zIndex: 2, textAlign: 'center', minWidth: 80 }}>Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayedOutlets.map((outlet) => {
                        const isEditingFrontliner = editingCell?.id === outlet.id && editingCell?.field === 'frontliner';
                        const isEditingRTG = editingCell?.id === outlet.id && editingCell?.field === 'rtgFreezer';
                        const flName = String(outlet.frontliner || 'Belum Ada');

                        return (
                          <TableRow key={outlet.id} hover>
                            <TableCell>
                              {isEditingFrontliner ? (
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                  <FormControl size="small" sx={{ minWidth: 140 }}>
                                    <Select value={editValue} onChange={(e) => handleSaveEdit(e.target.value)} autoFocus>
                                      {frontliners.map((fl) => (
                                        <MenuItem key={fl} value={fl}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: getFrontlinerColor(fl) }} />
                                            {fl}
                                          </Box>
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                  <IconButton size="small" onClick={handleCancelEdit} aria-label="Batal edit"><CloseIcon fontSize="small" /></IconButton>
                                </Box>
                              ) : (
                                <Chip
                                  label={String(flName || 'Belum Ada').split(' ').slice(0, 2).join(' ')}
                                  size="small"
                                  sx={{ bgcolor: getFrontlinerColor(outlet.frontliner), color: 'white', fontWeight: 600, cursor: 'pointer' }}
                                  onClick={() => handleStartEdit(outlet, 'frontliner')}
                                />
                              )}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{outlet.outletId || '-'}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }} title={outlet.outletName}>{outlet.outletName || '-'}</Typography>
                              <Typography variant="caption" color="text.secondary">{outlet.district || '-'}</Typography>
                            </TableCell>
                            <TableCell><Chip label={outlet.account || '-'} size="small" variant="outlined" /></TableCell>
                            <TableCell>
                              {isEditingRTG ? (
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                  <FormControl size="small" sx={{ minWidth: 110 }}>
                                    <Select value={editValue} onChange={(e) => handleSaveEdit(e.target.value)} autoFocus>
                                      {MANAGE_RTG_LABELS.map((label) => (
                                        <MenuItem key={label} value={label}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {getRTGIcon(label)}
                                            {label}
                                          </Box>
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                  <IconButton size="small" onClick={handleCancelEdit} aria-label="Batal edit"><CloseIcon fontSize="small" /></IconButton>
                                </Box>
                              ) : (
                                <Chip
                                  icon={getRTGIcon(outlet.rtgFreezer)}
                                  label={outlet.rtgFreezer || 'None'}
                                  size="small"
                                  color={outlet.rtgFreezer === 'Freezer' || outlet.rtgFreezer === 'Standing Freezer' ? 'info' : outlet.rtgFreezer === 'RTG' ? 'warning' : 'default'}
                                  sx={{ cursor: 'pointer' }}
                                  onClick={() => handleStartEdit(outlet, 'rtgFreezer')}
                                />
                              )}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <IconButton size="small" color="error" onClick={() => setDeleteDialog(outlet)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* TOMBOL LOAD MORE */}
              {hasMore && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={<ExpandMoreIcon />}
                    onClick={() => setDisplayCount(prev => prev + BATCH_SIZE)}
                    size="large"
                  >
                    Tampilkan 50 Data Lagi ({filteredOutlets.length - displayedOutlets.length} tersisa)
                  </Button>
                </Box>
              )}

              {displayedOutlets.length === filteredOutlets.length && filteredOutlets.length > 0 && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Semua data ({filteredOutlets.length}) sudah ditampilkan
                  </Typography>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Konfirmasi Hapus */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon /> Konfirmasi Hapus
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1">Apakah Anda yakin ingin menghapus outlet ini?</Typography>
          {deleteDialog && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3f3', borderRadius: 2, border: '1px solid #ffcdd2' }}>
              <Typography variant="subtitle1" fontWeight={600}>{deleteDialog.outletName || 'Tanpa Nama'}</Typography>
              <Typography variant="body2" color="text.secondary">ID: {deleteDialog.outletId || '-'} | {deleteDialog.account || '-'}</Typography>
              <Typography variant="body2" color="text.secondary">MD: {deleteDialog.frontliner || 'Belum Ada'}</Typography>
            </Box>
          )}
          <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 600 }}>
            ?? Tindakan ini tidak dapat dibatalkan!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog(null)} variant="outlined">Batal</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">Ya, Hapus Outlet</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageOutletsPage;