import React, { useMemo, useState } from 'react';
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
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
    AutoFixHigh as BulkEditIcon,
    CheckBox as SelectedIcon,
    FilterAlt as FilterIcon,
    PlaylistAddCheck as SelectAllIcon,
    RestartAlt as ResetIcon,
    ViewColumn as AddColumnIcon,
    ViewColumn as ColumnIcon,
} from '@mui/icons-material';

import { useData } from '../context/DataContext';
import { RTG_LABELS } from '../utils/constants';

const FIELD_OPTIONS = [
    { value: 'rtgFreezer', label: 'RTG / Freezer' },
    { value: 'frontliner', label: 'Frontliner' },
    { value: 'district', label: 'District' },
    { value: 'account', label: 'Account' },
];

const NEW_COLUMN = '__new_custom__';

const normalize = (value) => String(value ?? '').trim();

const RESERVED_FIELDS = new Set([
    'id',
    'outletid',
    'outletname',
    'frontliner',
    'account',
    'district',
    'rtgfreezer',
    'latitude',
    'longitude',
    'address',
    'city',
]);

const makeColumnKey = (name) => {
    const slug = normalize(name)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    if (!slug) return '';

    return `custom_${slug}`;
};

const getColumnLabel = (key) => {
    if (!key.startsWith('custom_')) return key;

    return key
        .slice(7)
        .split('_')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const EditPage = () => {
    const {
        outlets = [],
        frontliners = [],
        updateOutlets,
    } = useData();

    const [filters, setFilters] = useState({
        frontliner: [],
        account: [],
        district: [],
        rtgFreezer: [],
    });

    const [selectedIds, setSelectedIds] = useState([]);

    const [field, setField] = useState('rtgFreezer');
    const [newValue, setNewValue] = useState('');
    const [customColumnName, setCustomColumnName] = useState('');

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const customColumns = useMemo(() => {
        const keys = new Set();

        outlets.forEach((outlet) => {
            Object.keys(outlet || {}).forEach((key) => {
                if (key.startsWith('custom_')) {
                    keys.add(key);
                }
            });
        });

        return [...keys].sort((a, b) =>
            getColumnLabel(a).localeCompare(getColumnLabel(b), 'id')
        );
    }, [outlets]);

    const allFilterFields = useMemo(() => {
        return [
            'frontliner',
            'account',
            'district',
            'rtgFreezer',
            ...customColumns,
        ];
    }, [customColumns]);

    const filterOptions = useMemo(() => {
        const options = {
            frontliner: frontliners,
            account: [],
            district: [],
            rtgFreezer: [...RTG_LABELS],
        };

        customColumns.forEach((col) => {
            options[col] = [];
        });

        outlets.forEach((outlet) => {
            const account = normalize(outlet.account);
            if (account && !options.account.includes(account)) {
                options.account.push(account);
            }

            const district = normalize(outlet.district);
            if (district && !options.district.includes(district)) {
                options.district.push(district);
            }

            customColumns.forEach((col) => {
                const value = normalize(outlet[col]);
                if (value && !options[col].includes(value)) {
                    options[col].push(value);
                }
            });
        });

        Object.keys(options).forEach((key) => {
            if (key !== 'rtgFreezer' && key !== 'frontliner') {
                options[key].sort((a, b) => a.localeCompare(b, 'id'));
            }
        });

        return options;
    }, [outlets, frontliners, customColumns]);

    // ✅ BARU: Cek apakah ada filter yang aktif
    const hasActiveFilter = useMemo(() => {
        return allFilterFields.some((f) => filters[f] && filters[f].length > 0);
    }, [filters, allFilterFields]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        allFilterFields.forEach((f) => {
            if (filters[f] && filters[f].length > 0) {
                count++;
            }
        });
        return count;
    }, [filters, allFilterFields]);

    // ✅ PERUBAHAN: Hanya proses filter jika ada filter aktif
    const filteredOutlets = useMemo(() => {
        // Jika tidak ada filter yang dipilih, jangan load data
        if (!hasActiveFilter) return [];

        return outlets
            .filter((outlet) => {
                const matchesFrontliner =
                    filters.frontliner.length === 0 ||
                    filters.frontliner.includes(normalize(outlet.frontliner));

                const matchesAccount =
                    filters.account.length === 0 ||
                    filters.account.includes(normalize(outlet.account));

                const matchesDistrict =
                    filters.district.length === 0 ||
                    filters.district.includes(normalize(outlet.district));

                const matchesRTG =
                    filters.rtgFreezer.length === 0 ||
                    filters.rtgFreezer.includes(outlet.rtgFreezer || 'None');

                let matchesCustom = true;
                customColumns.forEach((col) => {
                    if (filters[col] && filters[col].length > 0) {
                        const value = normalize(outlet[col]);
                        if (!filters[col].includes(value)) {
                            matchesCustom = false;
                        }
                    }
                });

                return (
                    matchesFrontliner &&
                    matchesAccount &&
                    matchesDistrict &&
                    matchesRTG &&
                    matchesCustom
                );
            })
            .sort((a, b) =>
                normalize(a.outletName).localeCompare(
                    normalize(b.outletName),
                    'id'
                )
            );
    }, [outlets, filters, customColumns, hasActiveFilter]);

    const visibleIds = filteredOutlets.map((outlet) => String(outlet.id));

    const selectedVisibleCount = visibleIds.filter((id) =>
        selectedIds.includes(id)
    ).length;

    const allVisibleSelected =
        visibleIds.length > 0 &&
        selectedVisibleCount === visibleIds.length;

    const someVisibleSelected =
        selectedVisibleCount > 0 && !allVisibleSelected;

    const handleFilterChange = (fieldName, values) => {
        setFilters((prev) => ({
            ...prev,
            [fieldName]: values || [],
        }));
        setSelectedIds([]);
        setError('');
        setSuccess('');
    };

    const toggleOutlet = (id) => {
        const key = String(id);
        setSelectedIds((current) =>
            current.includes(key)
                ? current.filter((item) => item !== key)
                : [...current, key]
        );
        setSuccess('');
    };

    const toggleAllVisible = (checked) => {
        setSelectedIds((current) => {
            const visible = new Set(visibleIds);
            const outside = current.filter((id) => !visible.has(id));
            return checked ? [...outside, ...visibleIds] : outside;
        });
        setSuccess('');
    };

    const handleFieldChange = (value) => {
        setField(value);
        setNewValue('');
        setCustomColumnName('');
        setError('');
        setSuccess('');
    };

    const resetFilters = () => {
        const resetState = {
            frontliner: [],
            account: [],
            district: [],
            rtgFreezer: [],
        };
        customColumns.forEach((col) => {
            resetState[col] = [];
        });
        setFilters(resetState);
        setSelectedIds([]);
        setError('');
        setSuccess('');
    };

    const getTarget = () => {
        if (selectedIds.length > 0) {
            return filteredOutlets.filter((outlet) =>
                selectedIds.includes(String(outlet.id))
            );
        }
        return filteredOutlets;
    };

    const handleApply = async () => {
        setError('');
        setSuccess('');

        if (!filteredOutlets.length) {
            setError('Tidak ada outlet yang sesuai dengan filter aktif.');
            return;
        }

        let targetField = field;
        let fieldLabel = '';
        let value = normalize(newValue);

        if (field === NEW_COLUMN) {
            const columnName = normalize(customColumnName);

            if (!columnName) {
                setError('Masukkan nama kolom baru.');
                return;
            }

            const normalizedName = columnName.toLowerCase().replace(/[^a-z0-9]/g, '');

            if (RESERVED_FIELDS.has(normalizedName)) {
                setError('Nama kolom tersebut sudah digunakan oleh field utama. Gunakan nama lain.');
                return;
            }

            targetField = makeColumnKey(columnName);
            fieldLabel = columnName;

            if (!targetField) {
                setError('Nama kolom tidak valid. Gunakan huruf atau angka.');
                return;
            }

            const existingColumn = customColumns.includes(targetField);
            if (existingColumn) {
                fieldLabel = getColumnLabel(targetField);
            }
        } else {
            fieldLabel = FIELD_OPTIONS.find((item) => item.value === field)?.label || getColumnLabel(field);
        }

        if (!value) {
            setError('Masukkan nilai yang akan diterapkan.');
            return;
        }

        if (targetField === 'rtgFreezer' && !RTG_LABELS.includes(value)) {
            setError(`Pilihan harus salah satu dari: ${RTG_LABELS.join(', ')}.`);
            return;
        }

        const chosen = getTarget();

        if (!chosen.length) {
            setError('Tidak ada outlet yang dipilih untuk diperbarui.');
            return;
        }

        const isNewColumn = field === NEW_COLUMN && !customColumns.includes(targetField);

        const confirmed = window.confirm(
            `${isNewColumn ? 'TAMBAH KOLOM DAN TERAPKAN PERUBAHAN' : 'KONFIRMASI PERUBAHAN'}\n\n` +
            `Kolom: ${fieldLabel}\n` +
            `Nilai: ${value}\n` +
            `Jumlah outlet: ${chosen.length}\n\n` +
            `Filter aktif: ${activeFilterCount}\n\n` +
            (selectedIds.length > 0
                ? 'Perubahan hanya untuk outlet yang dicentang.'
                : 'Tidak ada outlet yang dicentang. Semua outlet pada filter aktif akan diubah.') +
            '\n\nLanjutkan?'
        );

        if (!confirmed) return;

        setBusy(true);

        try {
            await updateOutlets(
                chosen.map((outlet) => outlet.id),
                { [targetField]: value }
            );

            setSelectedIds([]);

            setSuccess(
                isNewColumn
                    ? `Kolom "${fieldLabel}" berhasil ditambahkan dan diisi untuk ${chosen.length} outlet.`
                    : `Berhasil memperbarui "${fieldLabel}" untuk ${chosen.length} outlet.`
            );

            if (field === NEW_COLUMN) {
                setCustomColumnName('');
                setField(targetField);
            }
        } catch (err) {
            console.error('Gagal menerapkan perubahan:', err);
            setError(err?.message || 'Gagal menyimpan perubahan ke Firebase.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
                <BulkEditIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 750 }}>
                    Edit Massal Outlet
                </Typography>
            </Stack>

            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Filter toko, pilih outlet, ubah data massal, atau tambahkan kolom baru sesuai kebutuhan.
            </Typography>

            {/* 1. FILTER OUTLET */}
            <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }} justifyContent="space-between">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FilterIcon color="primary" />
                            <Typography variant="h6" fontWeight={700}>1. Filter Outlet</Typography>
                        </Box>
                        {activeFilterCount > 0 && (
                            <Chip label={`${activeFilterCount} filter aktif`} color="primary" size="small" />
                        )}
                    </Stack>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                            <Autocomplete
                                multiple
                                options={filterOptions.frontliner}
                                value={filters.frontliner}
                                onChange={(_, values) => handleFilterChange('frontliner', values)}
                                filterSelectedOptions
                                renderInput={(params) => (
                                    <TextField {...params} label="Frontliner" placeholder="Cari dan pilih..." size="small" />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                            <Autocomplete
                                multiple
                                options={filterOptions.account}
                                value={filters.account}
                                onChange={(_, values) => handleFilterChange('account', values)}
                                filterSelectedOptions
                                renderInput={(params) => (
                                    <TextField {...params} label="Account" placeholder="Cari dan pilih..." size="small" />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                            <Autocomplete
                                multiple
                                options={filterOptions.district}
                                value={filters.district}
                                onChange={(_, values) => handleFilterChange('district', values)}
                                filterSelectedOptions
                                renderInput={(params) => (
                                    <TextField {...params} label="District" placeholder="Cari dan pilih..." size="small" />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                            <Autocomplete
                                multiple
                                options={filterOptions.rtgFreezer}
                                value={filters.rtgFreezer}
                                onChange={(_, values) => handleFilterChange('rtgFreezer', values)}
                                filterSelectedOptions
                                renderInput={(params) => (
                                    <TextField {...params} label="RTG / Freezer" placeholder="Cari dan pilih..." size="small" />
                                )}
                            />
                        </Grid>

                        {customColumns.map((col) => (
                            <Grid key={col} size={{ xs: 12, sm: 6, lg: 3 }}>
                                <Autocomplete
                                    multiple
                                    options={filterOptions[col] || []}
                                    value={filters[col] || []}
                                    onChange={(_, values) => handleFilterChange(col, values)}
                                    filterSelectedOptions
                                    renderInput={(params) => (
                                        <TextField {...params} label={getColumnLabel(col)} placeholder="Cari dan pilih..." size="small" />
                                    )}
                                />
                            </Grid>
                        ))}

                        <Grid size={{ xs: 12 }}>
                            <Button
                                variant="outlined"
                                startIcon={<ResetIcon />}
                                onClick={resetFilters}
                                disabled={activeFilterCount === 0}
                            >
                                Reset Semua Filter
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* 2. DAFTAR TOKO */}
            <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        spacing={1.5}
                        sx={{ mb: 2 }}
                    >
                        <Box>
                            <Typography variant="h6" fontWeight={700}>2. Daftar Toko</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {hasActiveFilter
                                    ? `${filteredOutlets.length.toLocaleString('id-ID')} outlet ditampilkan`
                                    : 'Belum ada filter yang dipilih'}
                            </Typography>
                        </Box>
                        {hasActiveFilter && (
                            <Chip
                                icon={<SelectedIcon />}
                                label={`${selectedVisibleCount} dipilih`}
                                color={selectedVisibleCount ? 'primary' : 'default'}
                            />
                        )}
                    </Stack>

                    {/* ✅ PERUBAHAN: Tampilkan pesan jika belum ada filter */}
                    {!hasActiveFilter ? (
                        <Alert severity="info">
                            Pilih minimal satu filter di atas untuk memuat daftar toko.
                        </Alert>
                    ) : filteredOutlets.length === 0 ? (
                        <Alert severity="warning">Tidak ada outlet yang sesuai dengan filter aktif.</Alert>
                    ) : (
                        <>
                            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 480, overflow: 'auto' }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox" sx={{ bgcolor: '#F1F5F9' }}>
                                                <Checkbox
                                                    checked={allVisibleSelected}
                                                    indeterminate={someVisibleSelected}
                                                    onChange={(event) => toggleAllVisible(event.target.checked)}
                                                    inputProps={{ 'aria-label': 'Pilih semua outlet' }}
                                                />
                                            </TableCell>
                                            {['Outlet ID', 'Outlet Name', 'Frontliner', 'Account', 'District', 'RTG / Freezer', ...customColumns.map(getColumnLabel)].map((heading) => (
                                                <TableCell key={heading} sx={{ bgcolor: '#F1F5F9', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    {heading}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredOutlets.map((outlet) => {
                                            const checked = selectedIds.includes(String(outlet.id));
                                            return (
                                                <TableRow key={outlet.id} hover selected={checked} onClick={() => toggleOutlet(outlet.id)} sx={{ cursor: 'pointer' }}>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            checked={checked}
                                                            onClick={(event) => event.stopPropagation()}
                                                            onChange={() => toggleOutlet(outlet.id)}
                                                            inputProps={{ 'aria-label': `Pilih ${outlet.outletName || outlet.outletId}` }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{outlet.outletId || '-'}</TableCell>
                                                    <TableCell sx={{ minWidth: 180 }}>{outlet.outletName || '-'}</TableCell>
                                                    <TableCell>{outlet.frontliner || '-'}</TableCell>
                                                    <TableCell>{outlet.account || '-'}</TableCell>
                                                    <TableCell>{outlet.district || '-'}</TableCell>
                                                    <TableCell>{outlet.rtgFreezer || '-'}</TableCell>
                                                    {customColumns.map((key) => (
                                                        <TableCell key={key} sx={{ minWidth: 140 }}>{outlet[key] ?? '-'}</TableCell>
                                                    ))}
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                                Centang toko tertentu untuk mengubah pilihan saja. Jika tidak ada yang dicentang, Apply berlaku untuk semua outlet hasil filter.
                            </Typography>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* 3. SET TO DAN APPLY */}
            {/* ✅ PERUBAHAN: Hanya muncul jika ada filter aktif DAN ada hasil */}
            {hasActiveFilter && filteredOutlets.length > 0 && (
                <Card>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                            <SelectAllIcon color="primary" />
                            <Typography variant="h6" fontWeight={700}>3. Terapkan Perubahan</Typography>
                        </Stack>

                        <Grid container spacing={2} alignItems="flex-start">
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth>
                                    <InputLabel id="bulk-field-label">Set To</InputLabel>
                                    <Select
                                        labelId="bulk-field-label"
                                        value={field}
                                        label="Set To"
                                        onChange={(event) => handleFieldChange(event.target.value)}
                                    >
                                        {FIELD_OPTIONS.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                        ))}
                                        {customColumns.length > 0 && <Divider />}
                                        {customColumns.map((key) => (
                                            <MenuItem key={key} value={key}>{getColumnLabel(key)}</MenuItem>
                                        ))}
                                        <Divider />
                                        <MenuItem value={NEW_COLUMN}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <AddColumnIcon fontSize="small" />
                                                <span>Tambah kolom baru...</span>
                                            </Stack>
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, md: 5 }}>
                                {field === 'rtgFreezer' ? (
                                    <FormControl fullWidth>
                                        <InputLabel id="bulk-value-label">Nilai Baru</InputLabel>
                                        <Select
                                            labelId="bulk-value-label"
                                            value={newValue}
                                            label="Nilai Baru"
                                            onChange={(event) => setNewValue(event.target.value)}
                                        >
                                            {RTG_LABELS.map((label) => (
                                                <MenuItem key={label} value={label}>{label}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                ) : field === NEW_COLUMN ? (
                                    <Stack spacing={2}>
                                        <TextField
                                            fullWidth
                                            label="Nama Kolom Baru"
                                            value={customColumnName}
                                            onChange={(event) => setCustomColumnName(event.target.value)}
                                            placeholder="Contoh: Status Display"
                                            inputProps={{ maxLength: 60 }}
                                            helperText="Gunakan nama yang jelas. Kolom akan disimpan di data outlet."
                                        />
                                        <TextField
                                            fullWidth
                                            label="Nilai untuk Semua Target"
                                            value={newValue}
                                            onChange={(event) => setNewValue(event.target.value)}
                                            placeholder="Masukkan nilai kolom baru"
                                            inputProps={{ maxLength: 500 }}
                                        />
                                    </Stack>
                                ) : (
                                    <TextField
                                        fullWidth
                                        label={`Nilai Baru: ${FIELD_OPTIONS.find((item) => item.value === field)?.label || getColumnLabel(field)}`}
                                        value={newValue}
                                        onChange={(event) => setNewValue(event.target.value)}
                                        placeholder="Ketik nilai baru..."
                                        inputProps={{ maxLength: 500 }}
                                    />
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, md: 3 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={busy ? <CircularProgress size={18} color="inherit" /> : field === NEW_COLUMN ? <AddColumnIcon /> : <BulkEditIcon />}
                                    onClick={handleApply}
                                    disabled={busy}
                                    sx={{ height: 56 }}
                                >
                                    {busy ? 'Memproses...' : field === NEW_COLUMN ? 'Tambah & Apply' : 'Apply'}
                                </Button>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <ColumnIcon color="action" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                                Target perubahan: <b>{selectedVisibleCount > 0 ? selectedVisibleCount : filteredOutlets.length}</b> outlet
                                {activeFilterCount > 0 && (<> dengan <b>{activeFilterCount} filter aktif</b></>)}
                            </Typography>
                        </Stack>

                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>{error}</Alert>
                        )}
                        {success && (
                            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess('')}>{success}</Alert>
                        )}
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default EditPage;
