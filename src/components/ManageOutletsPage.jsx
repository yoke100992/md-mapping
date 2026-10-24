import React, {
  useState,
  useMemo,
  useEffect,
} from 'react';

import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Alert,
  Checkbox,
  useMediaQuery,
  useTheme,
  LinearProgress,
} from '@mui/material';

import {
  Delete as DeleteIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  ClearAll as ClearAllIcon,
  Warning as WarningIcon,
  Store as StoreIcon,
  AcUnit,
  Whatshot,
  Air,
  Block,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

import { useData } from '../context/DataContext';
import { getFrontlinerColor } from '../utils/constants';

const MANAGE_RTG_LABELS = [
  'RTG',
  'Freezer',
  'Freezer toko',
];

const BATCH_SIZE = 50;

const ManageOutletsPage = () => {
  const theme = useTheme();

  const isMobile = useMediaQuery(
    theme.breakpoints.down('md')
  );

  const {
    outlets = [],
    frontliners = [],
    updateOutlet,
    removeOutlet,
  } = useData();

  // =====================================================
  // FILTER MULTI SELECT
  // =====================================================
  const [filterAccount, setFilterAccount] = useState([]);
  const [filterFrontliner, setFilterFrontliner] = useState([]);
  const [filterRTG, setFilterRTG] = useState([]);

  // SEARCH
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // EDIT DATA
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  // DELETE DAN ALERT
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [alert, setAlert] = useState(null);

  // PAGINATION
  const [displayCount, setDisplayCount] = useState(BATCH_SIZE);

  // =====================================================
  // DEBOUNCE SEARCH
  // =====================================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setDisplayCount(BATCH_SIZE);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // =====================================================
  // DATA AMAN
  // =====================================================
  const safeOutlets = useMemo(
    () =>
      (Array.isArray(outlets) ? outlets : []).filter(Boolean),
    [outlets]
  );

  const safeFrontliners = useMemo(
    () =>
      (Array.isArray(frontliners) ? frontliners : []).filter(
        (fl) => fl !== null && fl !== undefined && fl !== ''
      ),
    [frontliners]
  );

  // =====================================================
  // ACCOUNT UNIK
  // =====================================================
  const uniqueAccounts = useMemo(
    () =>
      [
        ...new Set(
          safeOutlets
            .map((outlet) =>
              String(outlet.account || '').trim()
            )
            .filter(Boolean)
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [safeOutlets]
  );

  // =====================================================
  // RTG / FREEZER UNIK
  // Mengikuti nilai yang tersedia di database
  // =====================================================
  const uniqueRTG = useMemo(
    () =>
      [
        ...new Set(
          safeOutlets
            .map((outlet) =>
              String(outlet.rtgFreezer || '').trim()
            )
            .filter(Boolean)
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [safeOutlets]
  );

  // =====================================================
  // STATUS FILTER AKTIF
  // =====================================================
  const hasActiveFilters =
    filterAccount.length > 0 ||
    filterFrontliner.length > 0 ||
    filterRTG.length > 0 ||
    Boolean(debouncedSearch.trim());

  // =====================================================
  // FILTER DATA
  // OR di dalam kategori yang sama
  // AND antar-kategori
  // =====================================================
  const filteredOutlets = useMemo(() => {
    if (!hasActiveFilters) return [];

    const query = debouncedSearch.toLowerCase();

    return safeOutlets.filter((outlet) => {
      // FILTER ACCOUNT
      if (
        filterAccount.length > 0 &&
        !filterAccount.includes(
          String(outlet.account || '').trim()
        )
      ) {
        return false;
      }

      // FILTER MD / FRONTLINER
      if (
        filterFrontliner.length > 0 &&
        !filterFrontliner.includes(
          outlet.frontliner || ''
        )
      ) {
        return false;
      }

      // FILTER RTG / FREEZER
      if (
        filterRTG.length > 0 &&
        !filterRTG.includes(
          String(outlet.rtgFreezer || '').trim()
        )
      ) {
        return false;
      }

      // PENCARIAN NAMA OUTLET / ID
      if (query) {
        const outletName = String(
          outlet.outletName || ''
        ).toLowerCase();

        const outletId = String(
          outlet.outletId || ''
        ).toLowerCase();

        if (
          !outletName.includes(query) &&
          !outletId.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    safeOutlets,
    filterAccount,
    filterFrontliner,
    filterRTG,
    debouncedSearch,
    hasActiveFilters,
  ]);

  // =====================================================
  // PAGINATION
  // =====================================================
  const displayedOutlets = useMemo(
    () => filteredOutlets.slice(0, displayCount),
    [filteredOutlets, displayCount]
  );

  const hasMore =
    displayCount < filteredOutlets.length;

  // =====================================================
  // ALERT
  // =====================================================
  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });

    setTimeout(() => {
      setAlert(null);
    }, 3000);
  };

  // =====================================================
  // EDIT DATA
  // =====================================================
  const handleStartEdit = (outlet, field) => {
    setEditingCell({
      id: outlet.id,
      field,
    });

    setEditValue(outlet[field] || '');
  };

  const handleSaveEdit = async (
    nextValue = editValue
  ) => {
    if (!editingCell) return;

    const currentEdit = editingCell;

    try {
      await updateOutlet(currentEdit.id, {
        [currentEdit.field]: nextValue,
      });

      showAlert('Data berhasil diperbarui!');
    } catch (error) {
      console.error(
        'Gagal memperbarui outlet:',
        error
      );

      showAlert(
        'Gagal menyimpan perubahan. Periksa koneksi lalu coba lagi.',
        'error'
      );
    } finally {
      setEditingCell(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
  };

  // =====================================================
  // HAPUS OUTLET
  // =====================================================
  const handleConfirmDelete = async () => {
    if (!deleteDialog) return;

    try {
      await removeOutlet(deleteDialog.id);

      showAlert(
        `Outlet "${deleteDialog.outletName || '-'}" dipindahkan ke daftar Deleted.`,
        'success'
      );

      setDeleteDialog(null);
    } catch (error) {
      console.error(
        'Gagal mengarsipkan outlet:',
        error
      );

      showAlert(
        'Outlet gagal dihapus. Periksa koneksi lalu coba lagi.',
        'error'
      );
    }
  };

  // =====================================================
  // RESET FILTER
  // =====================================================
  const handleResetFilters = () => {
    setFilterAccount([]);
    setFilterFrontliner([]);
    setFilterRTG([]);
    setSearchQuery('');
    setDebouncedSearch('');
    setDisplayCount(BATCH_SIZE);
  };

  // =====================================================
  // IKON RTG / FREEZER
  // =====================================================
  const getRTGIcon = (rtg) => {
    const value = String(rtg || '').toLowerCase();

    if (
      value.includes('freezer') ||
      value === 'standing freezer'
    ) {
      return (
        <AcUnit
          fontSize="small"
          sx={{ color: '#2196F3' }}
        />
      );
    }

    if (value === 'rtg') {
      return (
        <Whatshot
          fontSize="small"
          sx={{ color: '#FF9800' }}
        />
      );
    }

    if (value === 'chiller') {
      return (
        <Air
          fontSize="small"
          sx={{ color: '#4CAF50' }}
        />
      );
    }

    return (
      <Block
        fontSize="small"
        sx={{ color: '#999' }}
      />
    );
  };

  const getRTGColor = (rtg) => {
    const value = String(rtg || '').toLowerCase();

    if (value.includes('freezer')) return 'info';
    if (value === 'rtg') return 'warning';

    return 'default';
  };

  // =====================================================
  // KARTU OUTLET MOBILE
  // =====================================================
  const OutletCard = ({ outlet }) => {
    const isEditingFrontliner =
      editingCell?.id === outlet.id &&
      editingCell?.field === 'frontliner';

    const isEditingRTG =
      editingCell?.id === outlet.id &&
      editingCell?.field === 'rtgFreezer';

    const flName = String(
      outlet.frontliner || 'Belum Ada'
    );

    return (
      <Card
        sx={{
          mb: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <CardContent sx={{ p: 2 }}>
          {/* FRONTLINER DAN HAPUS */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
              mb: 1.5,
            }}
          >
            {isEditingFrontliner ? (
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  alignItems: 'center',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <FormControl
                  size="small"
                  sx={{ minWidth: 140, flex: 1 }}
                >
                  <Select
                    value={editValue}
                    onChange={(event) =>
                      handleSaveEdit(event.target.value)
                    }
                    autoFocus
                  >
                    {safeFrontliners.map((fl) => (
                      <MenuItem key={fl} value={fl}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              bgcolor: getFrontlinerColor(fl),
                            }}
                          />
                          {fl}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <IconButton
                  size="small"
                  onClick={handleCancelEdit}
                  aria-label="Batal edit"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Chip
                label={flName
                  .split(' ')
                  .slice(0, 2)
                  .join(' ')}
                size="small"
                sx={{
                  bgcolor: getFrontlinerColor(
                    outlet.frontliner
                  ),
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  maxWidth: '80%',
                }}
                onClick={() =>
                  handleStartEdit(outlet, 'frontliner')
                }
              />
            )}

            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteDialog(outlet)}
              aria-label="Hapus outlet"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>

          <Typography
            variant="subtitle1"
            fontWeight={700}
            gutterBottom
            sx={{ overflowWrap: 'anywhere' }}
          >
            {outlet.outletName || '-'}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              mb: 1.5,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              <b>ID:</b> {outlet.outletId || '-'}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              <b>Account:</b> {outlet.account || '-'}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              <b>Kecamatan:</b> {outlet.district || '-'}
            </Typography>
          </Box>

          {/* RTG / FREEZER */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              RTG / Freezer:
            </Typography>

            {isEditingRTG ? (
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  alignItems: 'center',
                }}
              >
                <FormControl
                  size="small"
                  sx={{ minWidth: 120 }}
                >
                  <Select
                    value={editValue}
                    onChange={(event) =>
                      handleSaveEdit(event.target.value)
                    }
                    autoFocus
                  >
                    {MANAGE_RTG_LABELS.map((label) => (
                      <MenuItem key={label} value={label}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          {getRTGIcon(label)}
                          {label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <IconButton
                  size="small"
                  onClick={handleCancelEdit}
                  aria-label="Batal edit"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Chip
                icon={getRTGIcon(outlet.rtgFreezer)}
                label={outlet.rtgFreezer || 'None'}
                size="small"
                color={getRTGColor(outlet.rtgFreezer)}
                sx={{ cursor: 'pointer' }}
                onClick={() =>
                  handleStartEdit(outlet, 'rtgFreezer')
                }
              />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  // =====================================================
  // RENDER HALAMAN
  // =====================================================
  return (
    <Box sx={{ p: { xs: 1, md: 2 }, minWidth: 0 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: 'primary.main',
          fontWeight: 700,
          fontSize: {
            xs: '1.5rem',
            md: '2.125rem',
          },
        }}
      >
        <StoreIcon
          sx={{
            mr: 1,
            verticalAlign: 'middle',
          }}
        />
        Kelola Outlet
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          mb: 2,
          fontSize: {
            xs: '0.875rem',
            md: '1rem',
          },
        }}
      >
        Total data di database:{' '}
        <b>{safeOutlets.length} outlet</b>. Pilih filter
        untuk memuat data.
      </Typography>

      {/* ALERT */}
      {alert && (
        <Alert
          severity={alert.type}
          sx={{ mb: 2 }}
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

      {/* =================================================
          FILTER SECTION
      ================================================= */}
      <Card
        sx={{
          mb: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <CardContent
          sx={{
            p: { xs: 1.5, md: 3 },
            '&:last-child': {
              pb: { xs: 1.5, md: 3 },
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <FilterIcon color="primary" />

              <Typography
                variant="h6"
                fontWeight={600}
                sx={{
                  fontSize: {
                    xs: '1rem',
                    md: '1.25rem',
                  },
                }}
              >
                Filter Data
              </Typography>
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

          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              flexWrap: 'wrap',
            }}
          >
            {/* SEARCH */}
            <TextField
              label="Cari Nama Outlet / Kecamatan / ID Outlet"
              size="small"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Ketik nama outlet / kecamatan atau ID outlet..."
              sx={{
                flexGrow: 1,
                minWidth: { xs: '100%', sm: 200 },
              }}
            />

            {/* MULTI SELECT ACCOUNT */}
            <FormControl
              size="small"
              sx={{
                minWidth: { xs: '100%', sm: 220 },
                flex: 1,
              }}
            >
              <InputLabel id="filter-account-label">
                Account
              </InputLabel>

              <Select
                labelId="filter-account-label"
                multiple
                value={filterAccount}
                label="Account"
                onChange={(event) => {
                  setFilterAccount(event.target.value);
                  setDisplayCount(BATCH_SIZE);
                }}
                renderValue={(selected) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 0.5,
                    }}
                  >
                    {selected.map((account) => (
                      <Chip
                        key={account}
                        label={account}
                        size="small"
                      />
                    ))}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    sx: { maxHeight: 320 },
                  },
                }}
              >
                {uniqueAccounts.map((account) => (
                  <MenuItem key={account} value={account}>
                    <Checkbox
                      size="small"
                      checked={filterAccount.includes(account)}
                    />
                    {account}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* MULTI SELECT MD / FRONTLINER */}
            <FormControl
              size="small"
              sx={{
                minWidth: { xs: '100%', sm: 240 },
                flex: 1,
              }}
            >
              <InputLabel id="filter-frontliner-label">
                MD / Frontliner
              </InputLabel>

              <Select
                labelId="filter-frontliner-label"
                multiple
                value={filterFrontliner}
                label="MD / Frontliner"
                onChange={(event) => {
                  setFilterFrontliner(event.target.value);
                  setDisplayCount(BATCH_SIZE);
                }}
                renderValue={(selected) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 0.5,
                    }}
                  >
                    {selected.map((fl) => (
                      <Chip
                        key={fl}
                        label={fl}
                        size="small"
                        sx={{
                          bgcolor: getFrontlinerColor(fl),
                          color: '#fff',
                          fontWeight: 600,
                          maxWidth: '100%',
                        }}
                      />
                    ))}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    sx: { maxHeight: 320 },
                  },
                }}
              >
                {safeFrontliners.map((fl) => (
                  <MenuItem key={fl} value={fl}>
                    <Checkbox
                      size="small"
                      checked={filterFrontliner.includes(fl)}
                    />

                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: getFrontlinerColor(fl),
                        mr: 1,
                        flexShrink: 0,
                      }}
                    />

                    {fl}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* MULTI SELECT RTG / FREEZER */}
            <FormControl
              size="small"
              sx={{
                minWidth: { xs: '100%', sm: 220 },
                flex: 1,
              }}
            >
              <InputLabel id="filter-rtg-label">
                RTG / Freezer
              </InputLabel>

              <Select
                labelId="filter-rtg-label"
                multiple
                value={filterRTG}
                label="RTG / Freezer"
                onChange={(event) => {
                  setFilterRTG(event.target.value);
                  setDisplayCount(BATCH_SIZE);
                }}
                renderValue={(selected) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 0.5,
                    }}
                  >
                    {selected.map((rtg) => (
                      <Chip
                        key={rtg}
                        label={rtg}
                        size="small"
                        icon={getRTGIcon(rtg)}
                      />
                    ))}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    sx: { maxHeight: 320 },
                  },
                }}
              >
                {uniqueRTG.map((rtg) => (
                  <MenuItem key={rtg} value={rtg}>
                    <Checkbox
                      size="small"
                      checked={filterRTG.includes(rtg)}
                    />

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      {getRTGIcon(rtg)}
                      {rtg}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* RINGKASAN FILTER AKTIF */}
          {hasActiveFilters && (
            <Box
              sx={{
                mt: 1.5,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Filter aktif:
              </Typography>

              {filterAccount.map((account) => (
                <Chip
                  key={`account-${account}`}
                  size="small"
                  label={account}
                  onDelete={() =>
                    setFilterAccount((prev) =>
                      prev.filter((item) => item !== account)
                    )
                  }
                />
              ))}

              {filterFrontliner.map((fl) => (
                <Chip
                  key={`frontliner-${fl}`}
                  size="small"
                  label={fl}
                  sx={{
                    bgcolor: getFrontlinerColor(fl),
                    color: '#fff',
                  }}
                  onDelete={() =>
                    setFilterFrontliner((prev) =>
                      prev.filter((item) => item !== fl)
                    )
                  }
                />
              ))}

              {filterRTG.map((rtg) => (
                <Chip
                  key={`rtg-${rtg}`}
                  size="small"
                  label={rtg}
                  icon={getRTGIcon(rtg)}
                  onDelete={() =>
                    setFilterRTG((prev) =>
                      prev.filter((item) => item !== rtg)
                    )
                  }
                />
              ))}

              {debouncedSearch && (
                <Chip
                  size="small"
                  label={`Cari: ${debouncedSearch}`}
                  onDelete={() => {
                    setSearchQuery('');
                    setDebouncedSearch('');
                  }}
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* =================================================
          DATA SECTION
      ================================================= */}
      <Card
        sx={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <CardContent
          sx={{
            p: { xs: 1, md: 2 },
            '&:last-child': {
              pb: { xs: 1, md: 2 },
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1.5,
              px: 1,
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                fontSize: {
                  xs: '1rem',
                  md: '1.25rem',
                },
              }}
            >
              {hasActiveFilters
                ? `Hasil Filter (${filteredOutlets.length})`
                : 'Daftar Outlet'}
            </Typography>

            {hasActiveFilters && (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={`${filteredOutlets.length} outlet`}
              />
            )}
          </Box>

          {/* BELUM ADA FILTER */}
          {!hasActiveFilters ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 2,
              }}
            >
              <FilterIcon
                sx={{
                  fontSize: 80,
                  color: 'primary.light',
                  mb: 2,
                }}
              />

              <Typography
                variant="h6"
                color="text.secondary"
                gutterBottom
              >
                Silakan Pilih Filter Terlebih Dahulu
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Pilih satu atau beberapa Account,
                Frontliner, atau RTG / Freezer, atau ketik
                nama outlet untuk memuat data.
                <br />
                Total data tersedia:{' '}
                <b>{safeOutlets.length} outlet</b>
              </Typography>
            </Box>
          ) : filteredOutlets.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 6,
              }}
            >
              <StoreIcon
                sx={{
                  fontSize: 60,
                  color: 'text.secondary',
                  mb: 1,
                }}
              />

              <Typography
                variant="body1"
                color="text.secondary"
              >
                Tidak ada outlet yang cocok dengan filter.
              </Typography>
            </Box>
          ) : (
            <>
              {/* PROGRESS PAGINATION */}
              {hasMore && (
                <Box sx={{ mb: 2, px: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Menampilkan {displayedOutlets.length} dari{' '}
                    {filteredOutlets.length} data
                  </Typography>

                  <LinearProgress
                    variant="determinate"
                    value={
                      (displayedOutlets.length /
                        filteredOutlets.length) *
                      100
                    }
                    sx={{
                      mt: 0.5,
                      height: 4,
                      borderRadius: 2,
                    }}
                  />
                </Box>
              )}

              {/* TAMPILAN MOBILE */}
              {isMobile ? (
                <Box
                  sx={{
                    maxHeight: '70vh',
                    overflow: 'auto',
                    px: 0.5,
                  }}
                >
                  {displayedOutlets.map((outlet, index) => (
                    <OutletCard
                      key={
                        outlet.id ??
                        outlet.outletId ??
                        index
                      }
                      outlet={outlet}
                    />
                  ))}
                </Box>
              ) : (
                /* TAMPILAN DESKTOP */
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{
                    maxHeight: '65vh',
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                      width: 8,
                      height: 8,
                    },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: '#c41e3a',
                      borderRadius: 4,
                    },
                  }}
                >
                  <Table
                    size="small"
                    stickyHeader
                    aria-label="Daftar outlet"
                  >
                    <TableHead>
                      <TableRow>
                        {[
                          ['MD / Frontliner', 150],
                          ['ID Outlet', 100],
                          ['Nama Outlet', 200],
                          ['Account', 120],
                          ['RTG / Freezer', 140],
                          ['Aksi', 80],
                        ].map(([label, minWidth]) => (
                          <TableCell
                            key={label}
                            sx={{
                              color: '#fff',
                              fontWeight: 700,
                              bgcolor: 'primary.main',
                              position: 'sticky',
                              top: 0,
                              zIndex: 2,
                              minWidth,
                              ...(label === 'Aksi'
                                ? { textAlign: 'center' }
                                : {}),
                            }}
                          >
                            {label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {displayedOutlets.map(
                        (outlet, index) => {
                          const isEditingFrontliner =
                            editingCell?.id === outlet.id &&
                            editingCell?.field === 'frontliner';

                          const isEditingRTG =
                            editingCell?.id === outlet.id &&
                            editingCell?.field === 'rtgFreezer';

                          const flName = String(
                            outlet.frontliner || 'Belum Ada'
                          );

                          return (
                            <TableRow
                              key={
                                outlet.id ??
                                outlet.outletId ??
                                index
                              }
                              hover
                            >
                              {/* FRONTLINER */}
                              <TableCell>
                                {isEditingFrontliner ? (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      gap: 0.5,
                                      alignItems: 'center',
                                    }}
                                  >
                                    <FormControl
                                      size="small"
                                      sx={{ minWidth: 140 }}
                                    >
                                      <Select
                                        value={editValue}
                                        onChange={(event) =>
                                          handleSaveEdit(
                                            event.target.value
                                          )
                                        }
                                        autoFocus
                                      >
                                        {safeFrontliners.map(
                                          (fl) => (
                                            <MenuItem
                                              key={fl}
                                              value={fl}
                                            >
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 1,
                                                }}
                                              >
                                                <Box
                                                  sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    bgcolor:
                                                      getFrontlinerColor(fl),
                                                  }}
                                                />
                                                {fl}
                                              </Box>
                                            </MenuItem>
                                          )
                                        )}
                                      </Select>
                                    </FormControl>

                                    <IconButton
                                      size="small"
                                      onClick={handleCancelEdit}
                                      aria-label="Batal edit"
                                    >
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                ) : (
                                  <Chip
                                    label={flName
                                      .split(' ')
                                      .slice(0, 2)
                                      .join(' ')}
                                    size="small"
                                    sx={{
                                      bgcolor:
                                        getFrontlinerColor(
                                          outlet.frontliner
                                        ),
                                      color: '#fff',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                    onClick={() =>
                                      handleStartEdit(
                                        outlet,
                                        'frontliner'
                                      )
                                    }
                                  />
                                )}
                              </TableCell>

                              {/* ID OUTLET */}
                              <TableCell
                                sx={{ fontWeight: 500 }}
                              >
                                {outlet.outletId || '-'}
                              </TableCell>

                              {/* NAMA OUTLET */}
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  noWrap
                                  sx={{ maxWidth: 200 }}
                                  title={outlet.outletName}
                                >
                                  {outlet.outletName || '-'}
                                </Typography>

                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {outlet.district || '-'}
                                </Typography>
                              </TableCell>

                              {/* ACCOUNT */}
                              <TableCell>
                                <Chip
                                  label={outlet.account || '-'}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>

                              {/* RTG / FREEZER */}
                              <TableCell>
                                {isEditingRTG ? (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      gap: 0.5,
                                      alignItems: 'center',
                                    }}
                                  >
                                    <FormControl
                                      size="small"
                                      sx={{ minWidth: 120 }}
                                    >
                                      <Select
                                        value={editValue}
                                        onChange={(event) =>
                                          handleSaveEdit(
                                            event.target.value
                                          )
                                        }
                                        autoFocus
                                      >
                                        {MANAGE_RTG_LABELS.map(
                                          (label) => (
                                            <MenuItem
                                              key={label}
                                              value={label}
                                            >
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 1,
                                                }}
                                              >
                                                {getRTGIcon(label)}
                                                {label}
                                              </Box>
                                            </MenuItem>
                                          )
                                        )}
                                      </Select>
                                    </FormControl>

                                    <IconButton
                                      size="small"
                                      onClick={handleCancelEdit}
                                      aria-label="Batal edit"
                                    >
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                ) : (
                                  <Chip
                                    icon={getRTGIcon(
                                      outlet.rtgFreezer
                                    )}
                                    label={
                                      outlet.rtgFreezer || 'None'
                                    }
                                    size="small"
                                    color={getRTGColor(
                                      outlet.rtgFreezer
                                    )}
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() =>
                                      handleStartEdit(
                                        outlet,
                                        'rtgFreezer'
                                      )
                                    }
                                  />
                                )}
                              </TableCell>

                              {/* AKSI */}
                              <TableCell
                                sx={{ textAlign: 'center' }}
                              >
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    setDeleteDialog(outlet)
                                  }
                                  aria-label="Hapus outlet"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        }
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* LOAD MORE */}
              {hasMore && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={<ExpandMoreIcon />}
                    onClick={() =>
                      setDisplayCount(
                        (prev) => prev + BATCH_SIZE
                      )
                    }
                    size="large"
                    sx={{
                      maxWidth: '100%',
                      whiteSpace: 'normal',
                    }}
                  >
                    Tampilkan 50 Data Lagi (
                    {filteredOutlets.length -
                      displayedOutlets.length}{' '}
                    tersisa)
                  </Button>
                </Box>
              )}

              {/* SEMUA DATA DITAMPILKAN */}
              {!hasMore &&
                filteredOutlets.length > 0 && (
                  <Box
                    sx={{
                      textAlign: 'center',
                      mt: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Semua data ({filteredOutlets.length})
                      sudah ditampilkan
                    </Typography>
                  </Box>
                )}
            </>
          )}
        </CardContent>
      </Card>

      {/* =================================================
          DIALOG KONFIRMASI HAPUS
      ================================================= */}
      <Dialog
        open={Boolean(deleteDialog)}
        onClose={() => setDeleteDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: 'error.main',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <WarningIcon />
          Konfirmasi Hapus
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1">
            Apakah Anda yakin ingin menghapus outlet ini?
          </Typography>

          {deleteDialog && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: '#fff3f3',
                borderRadius: 2,
                border: '1px solid #ffcdd2',
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight={600}
              >
                {deleteDialog.outletName || 'Tanpa Nama'}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                ID: {deleteDialog.outletId || '-'} |{' '}
                {deleteDialog.account || '-'}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                MD: {deleteDialog.frontliner || 'Belum Ada'}
              </Typography>
            </Box>
          )}

          <Typography
            variant="body2"
            color="error"
            sx={{
              mt: 2,
              fontWeight: 600,
            }}
          >
            Outlet akan dipindahkan ke arsip Deleted dan
            dapat di-restore melalui menu Upload.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialog(null)}
            variant="outlined"
          >
            Batal
          </Button>

          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
          >
            Ya, Hapus Outlet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageOutletsPage;
