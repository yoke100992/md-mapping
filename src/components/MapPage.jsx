import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';

import {
    AcUnit,
    Air,
    ClearAll as ClearAllIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    FilterList as FilterIcon,
    LocationOn as LocationIcon,
    MyLocation,
    Palette as PaletteIcon,
    Whatshot,
} from '@mui/icons-material';

import {
    MapContainer,
    TileLayer,
    useMap,
    Circle,
    CircleMarker,
    Popup,
} from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useData } from '../context/DataContext';

import {
    getFrontlinerColor,
    RTG_LABELS,
    COLOR_PICKER_PALETTE,
} from '../utils/constants';

const DEFAULT_CENTER = [-6.9175, 107.6191];

const isValidCoordinate = (outlet) => {
    if (!outlet) return false;

    const latRaw = outlet.latitude;
    const lngRaw = outlet.longitude;

    if (
        latRaw === '' ||
        latRaw === null ||
        latRaw === undefined ||
        lngRaw === '' ||
        lngRaw === null ||
        lngRaw === undefined
    ) {
        return false;
    }

    const lat = Number(latRaw);
    const lng = Number(lngRaw);

    return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
    );
};

const makePinIcon = (color) =>
    L.divIcon({
        className: 'md-map-pin',
        html: `<div style="width:18px;height:18px;border:3px solid #fff;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);box-shadow:0 1px 5px #0006"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
    });

/* =========================================================
   MARKER OUTLET
   Marker dibuat bertahap untuk membantu performa peta.
========================================================= */
const OutletMarkerLayer = memo(function OutletMarkerLayer({
    outlets,
    customColors,
    onSelect,
}) {
    const map = useMap();

    useEffect(() => {
        if (!map) return undefined;

        const layer = L.layerGroup();
        const valid = outlets.filter(isValidCoordinate);
        const icons = new Map();

        const batchSize = 40;

        let index = 0;
        let timerId = null;
        let cancelled = false;

        layer.addTo(map);

        const addNextBatch = () => {
            if (cancelled) return;

            const stopAt = Math.min(
                index + batchSize,
                valid.length
            );

            for (; index < stopAt; index += 1) {
                const outlet = valid[index];

                const color =
                    getFrontlinerColor(
                        outlet.frontliner,
                        customColors
                    ) || '#64748b';

                if (!icons.has(color)) {
                    icons.set(color, makePinIcon(color));
                }

                const marker = L.marker(
                    [
                        Number(outlet.latitude),
                        Number(outlet.longitude),
                    ],
                    {
                        icon: icons.get(color),
                        keyboard: false,
                        riseOnHover: false,
                        title:
                            outlet.outletName ||
                            outlet.outletId ||
                            'Outlet',
                    }
                );

                marker.on('click', () => onSelect(outlet));

                layer.addLayer(marker);
            }

            if (index < valid.length && !cancelled) {
                timerId = window.setTimeout(addNextBatch, 0);
            }
        };

        timerId = window.setTimeout(addNextBatch, 0);

        return () => {
            cancelled = true;

            if (timerId !== null) {
                window.clearTimeout(timerId);
            }

            layer.clearLayers();

            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        };
    }, [map, outlets, customColors, onSelect]);

    return null;
});

/* =========================================================
   PUSAT PETA SAAT OUTLET DIPILIH
========================================================= */
function MapFocusController({ selectedOutlet }) {
    const map = useMap();

    useEffect(() => {
        if (
            !selectedOutlet ||
            !isValidCoordinate(selectedOutlet)
        ) {
            return;
        }

        map.panTo(
            [
                Number(selectedOutlet.latitude),
                Number(selectedOutlet.longitude),
            ],
            { animate: false }
        );
    }, [map, selectedOutlet]);

    return null;
}

/* =========================================================
   MARKER GPS LOKASI SAYA
========================================================= */
function GpsLocationMarker({ position, accuracy }) {
    const map = useMap();

    useEffect(() => {
        if (!position) return;

        map.flyTo(
            [position.latitude, position.longitude],
            Math.max(map.getZoom(), 15),
            {
                animate: true,
                duration: 0.8,
            }
        );
    }, [map, position]);

    if (!position) return null;

    return (
        <>
            {Number.isFinite(accuracy) && accuracy > 0 && (
                <Circle
                    center={[
                        position.latitude,
                        position.longitude,
                    ]}
                    radius={accuracy}
                    pathOptions={{
                        color: '#1976d2',
                        fillColor: '#1976d2',
                        fillOpacity: 0.10,
                        weight: 1,
                    }}
                />
            )}

            <CircleMarker
                center={[
                    position.latitude,
                    position.longitude,
                ]}
                radius={9}
                pathOptions={{
                    color: '#ffffff',
                    weight: 3,
                    fillColor: '#1976d2',
                    fillOpacity: 1,
                }}
            >
                <Popup>
                    <b>Lokasi Saya</b>
                    <br />
                    GPS aktif
                    <br />
                    Akurasi sekitar{' '}
                    {Math.round(accuracy || 0)} meter
                    <br />
                    <small>
                        Akurasi bergantung pada sinyal GPS perangkat.
                    </small>
                </Popup>
            </CircleMarker>
        </>
    );
}

/* =========================================================
   HALAMAN VIEW MAP
========================================================= */
function MapPage() {
    const theme = useTheme();

    const isMobile = useMediaQuery(
        theme.breakpoints.down('md')
    );

    const {
        outlets = [],
        frontliners = [],
        customColors = {},
        updateOutlet,
        removeOutlet,
        updateCustomColor,
        getOutletsByFrontliner,
    } = useData();

    const [filterFrontliner, setFilterFrontliner] = useState([]);
    const [mapReady, setMapReady] = useState(false);
    const [frontlinerOutlets, setFrontlinerOutlets] = useState([]);
    const [loadingMap, setLoadingMap] = useState(false);

    const [filterAccount, setFilterAccount] = useState([]);
    const [filterRTG, setFilterRTG] = useState([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [selectedOutlet, setSelectedOutlet] = useState(null);
    const [editDialog, setEditDialog] = useState(null);
    const [editForm, setEditForm] = useState({});

    const [colorDialog, setColorDialog] = useState(false);
    const [selectedColorName, setSelectedColorName] = useState('');

    const [saveError, setSaveError] = useState('');

    // State GPS
    const [gpsPosition, setGpsPosition] = useState(null);
    const [gpsAccuracy, setGpsAccuracy] = useState(null);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState('');

    /* =====================================================
       DEBOUNCE PENCARIAN
    ===================================================== */
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(
                searchQuery.trim().toLowerCase()
            );
        }, 250);

        return () => window.clearTimeout(timer);
    }, [searchQuery]);

    /* =====================================================
       DATA DASAR
    ===================================================== */
    const safeOutlets = useMemo(
        () =>
            (Array.isArray(outlets) ? outlets : []).filter(
                Boolean
            ),
        [outlets]
    );

    const safeFrontliners = useMemo(
        () =>
            (Array.isArray(frontliners) ? frontliners : []).filter(
                Boolean
            ),
        [frontliners]
    );

    const mapOutlets = useMemo(
        () =>
            (
                Array.isArray(frontlinerOutlets)
                    ? frontlinerOutlets
                    : []
            ).filter(Boolean),
        [frontlinerOutlets]
    );

    const accounts = useMemo(
        () =>
            [
                ...new Set(
                    mapOutlets
                        .map((outlet) =>
                            String(outlet.account ?? '').trim()
                        )
                        .filter(Boolean)
                ),
            ].sort(),
        [mapOutlets]
    );

    /* =====================================================
       FILTER OUTLET
    ===================================================== */
    const filteredOutlets = useMemo(() => {
        return mapOutlets.filter((outlet) => {
            if (
                filterFrontliner.length &&
                !filterFrontliner.includes(outlet.frontliner)
            ) {
                return false;
            }

            if (
                filterAccount.length &&
                !filterAccount.includes(outlet.account)
            ) {
                return false;
            }

            if (
                filterRTG.length &&
                !filterRTG.includes(
                    outlet.rtgFreezer || 'None'
                )
            ) {
                return false;
            }

            if (debouncedSearch) {
                const name = String(
                    outlet.outletName ?? ''
                ).toLowerCase();

                const id = String(
                    outlet.outletId ?? ''
                ).toLowerCase();

                const address = String(
                    outlet.address ?? ''
                ).toLowerCase();

                if (
                    !name.includes(debouncedSearch) &&
                    !id.includes(debouncedSearch) &&
                    !address.includes(debouncedSearch)
                ) {
                    return false;
                }
            }

            return true;
        });
    }, [
        mapOutlets,
        filterFrontliner,
        filterAccount,
        filterRTG,
        debouncedSearch,
    ]);

    const validOutlets = useMemo(
        () =>
            mapReady
                ? filteredOutlets.filter(isValidCoordinate)
                : [],
        [filteredOutlets, mapReady]
    );

    const invalidCount =
        filteredOutlets.length - validOutlets.length;

    const frontlinerCounts = useMemo(() => {
        const counts = Object.create(null);

        filteredOutlets.forEach((outlet) => {
            if (outlet.frontliner) {
                counts[outlet.frontliner] =
                    (counts[outlet.frontliner] || 0) + 1;
            }
        });

        return counts;
    }, [filteredOutlets]);

    /* =====================================================
       PUSAT PETA
    ===================================================== */
    const initialCenter = useMemo(() => {
        const valid = mapOutlets
            .filter(isValidCoordinate)
            .slice(0, 200);

        if (!valid.length) return DEFAULT_CENTER;

        const total = valid.reduce(
            (acc, outlet) => {
                acc.lat += Number(outlet.latitude);
                acc.lng += Number(outlet.longitude);
                return acc;
            },
            { lat: 0, lng: 0 }
        );

        return [
            total.lat / valid.length,
            total.lng / valid.length,
        ];
    }, [mapOutlets]);

    const getColor = useCallback(
        (name) =>
            getFrontlinerColor(name, customColors) ||
            '#64748b',
        [customColors]
    );

    /* =====================================================
       PILIH MARKER OUTLET
    ===================================================== */
    const handleMarkerSelect = useCallback((outlet) => {
        setSelectedOutlet(outlet);

        setEditForm({
            ...outlet,
            frontliner: outlet.frontliner || '',
            rtgFreezer: outlet.rtgFreezer || 'None',
            account: outlet.account || '',
        });

        setSaveError('');
    }, []);

    /* =====================================================
       DETEKSI GPS
    ===================================================== */
    const handleLocateMe = useCallback(() => {
        if (!navigator.geolocation) {
            setGpsError(
                'Browser atau perangkat ini tidak mendukung GPS.'
            );
            return;
        }

        setGpsLoading(true);
        setGpsError('');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setGpsPosition({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });

                setGpsAccuracy(position.coords.accuracy);

                // Tutup detail outlet jika sedang terbuka.
                setSelectedOutlet(null);

                // Peta dapat ditampilkan walaupun filter outlet
                // belum dipilih.
                setMapReady(true);
                setGpsLoading(false);
            },
            (error) => {
                let message =
                    'Gagal mendeteksi lokasi. Silakan coba lagi.';

                if (error.code === 1) {
                    message =
                        'Izin lokasi ditolak. Aktifkan izin lokasi browser di pengaturan HP.';
                } else if (error.code === 2) {
                    message =
                        'Lokasi GPS belum tersedia. Aktifkan lokasi HP dan coba lagi.';
                } else if (error.code === 3) {
                    message =
                        'Deteksi GPS terlalu lama. Coba lagi di area dengan sinyal lebih baik.';
                }

                setGpsError(message);
                setGpsLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 5000,
            }
        );
    }, []);

    /* =====================================================
       RESET FILTER
    ===================================================== */
    const resetFilters = () => {
        setFilterAccount([]);
        setFilterRTG([]);
        setSearchQuery('');
        setDebouncedSearch('');
        setSelectedOutlet(null);
    };

    /* =====================================================
       MEMUAT OUTLET BERDASARKAN FRONTLINER
    ===================================================== */
    const handleFrontlinerFilterChange = async (event) => {
        const selected = event.target.value;

        const names = Array.isArray(selected)
            ? selected
            : [selected];

        setFilterFrontliner(names);
        setFilterAccount([]);
        setFilterRTG([]);
        setSelectedOutlet(null);
        setSaveError('');

        if (!names.length) {
            setFrontlinerOutlets([]);
            setMapReady(Boolean(gpsPosition));
            return;
        }

        setLoadingMap(true);

        try {
            let results;

            if (
                typeof getOutletsByFrontliner === 'function'
            ) {
                const chunks = [];

                for (let i = 0; i < names.length; i += 3) {
                    const group = names.slice(i, i + 3);

                    const groupResults = await Promise.all(
                        group.map((name) =>
                            getOutletsByFrontliner(name)
                        )
                    );

                    chunks.push(...groupResults);
                }

                results = chunks.flat();
            } else {
                results = safeOutlets.filter((outlet) =>
                    names.includes(outlet.frontliner)
                );
            }

            const unique = new Map();

            (
                Array.isArray(results) ? results : []
            )
                .filter(Boolean)
                .forEach((outlet, index) => {
                    const key = String(
                        outlet.id ??
                            outlet.outletId ??
                            `${outlet.frontliner || ''}-${
                                outlet.outletName || ''
                            }-${index}`
                    );

                    if (!unique.has(key)) {
                        unique.set(key, outlet);
                    }
                });

            setFrontlinerOutlets([...unique.values()]);
            setMapReady(true);
        } catch (error) {
            console.error(
                'Gagal memuat outlet berdasarkan Frontliner:',
                error
            );

            setSaveError(
                'Gagal memuat outlet. Periksa koneksi Firebase lalu coba lagi.'
            );
        } finally {
            setLoadingMap(false);
        }
    };

    const hasActiveFilters =
        filterFrontliner.length > 0 ||
        filterAccount.length > 0 ||
        filterRTG.length > 0 ||
        Boolean(searchQuery.trim());

    /* =====================================================
       IKON RTG / FREEZER
    ===================================================== */
    const getRTGIcon = (rtg) => {
        if (rtg === 'Freezer') {
            return (
                <AcUnit
                    fontSize="small"
                    sx={{ color: '#2196F3' }}
                />
            );
        }

        if (rtg === 'RTG') {
            return (
                <Whatshot
                    fontSize="small"
                    sx={{ color: '#FF9800' }}
                />
            );
        }

        if (rtg === 'Chiller') {
            return (
                <Air
                    fontSize="small"
                    sx={{ color: '#4CAF50' }}
                />
            );
        }

        return null;
    };

    /* =====================================================
       EDIT OUTLET
    ===================================================== */
    const handleEdit = (outlet) => {
        setSaveError('');

        setEditForm({
            ...outlet,
            frontliner: outlet.frontliner || '',
            rtgFreezer: outlet.rtgFreezer || 'None',
            account: outlet.account || '',
        });

        setEditDialog(outlet);
    };

    const handleSaveEdit = async () => {
        if (!editDialog) return;

        try {
            await updateOutlet(editDialog.id, editForm);

            setFrontlinerOutlets((prev) =>
                prev.map((outlet) =>
                    String(outlet.id) ===
                    String(editDialog.id)
                        ? { ...outlet, ...editForm }
                        : outlet
                )
            );

            setEditDialog(null);
            setSelectedOutlet(null);
            setSaveError('');
        } catch (error) {
            console.error(
                'Gagal memperbarui outlet:',
                error
            );

            setSaveError(
                'Gagal menyimpan perubahan. Periksa koneksi Firebase lalu coba lagi.'
            );
        }
    };

    const handleSaveMapFields = async () => {
        if (!selectedOutlet) return;

        const id = selectedOutlet.id;

        if (id == null) {
            setSaveError(
                'ID outlet tidak ditemukan sehingga perubahan tidak dapat disimpan.'
            );
            return;
        }

        const updates = {
            frontliner: editForm.frontliner || '',
            rtgFreezer: editForm.rtgFreezer || 'None',
        };

        try {
            await updateOutlet(id, updates);

            const updated = {
                ...selectedOutlet,
                ...updates,
            };

            setFrontlinerOutlets((prev) =>
                prev.map((outlet) =>
                    String(outlet.id) === String(id)
                        ? { ...outlet, ...updates }
                        : outlet
                )
            );

            setSelectedOutlet(updated);

            setEditForm((prev) => ({
                ...prev,
                ...updates,
            }));

            setSaveError('');
        } catch (error) {
            console.error(
                'Gagal menyimpan Frontliner/RTG:',
                error
            );

            setSaveError(
                'Gagal menyimpan perubahan. Periksa koneksi Firebase lalu coba lagi.'
            );
        }
    };

    /* =====================================================
       WARNA FRONTLINER
    ===================================================== */
    const handleSaveColor = async (color) => {
        try {
            await updateCustomColor(
                selectedColorName,
                color
            );

            setColorDialog(false);
            setSaveError('');
        } catch (error) {
            console.error(
                'Gagal menyimpan warna:',
                error
            );

            setSaveError('Gagal menyimpan warna Frontliner.');
        }
    };

    const handleResetColor = async () => {
        try {
            await updateCustomColor(
                selectedColorName,
                null
            );

            setColorDialog(false);
            setSaveError('');
        } catch (error) {
            console.error(
                'Gagal mereset warna:',
                error
            );

            setSaveError('Gagal mereset warna Frontliner.');
        }
    };

    /* =====================================================
       HAPUS OUTLET
    ===================================================== */
    const handleDelete = async () => {
        if (!selectedOutlet) return;

        const confirmed = window.confirm(
            `Hapus outlet "${
                selectedOutlet.outletName ||
                selectedOutlet.outletId ||
                ''
            }"?`
        );

        if (!confirmed) return;

        try {
            await removeOutlet(selectedOutlet.id);

            setFrontlinerOutlets((prev) =>
                prev.filter(
                    (outlet) =>
                        String(outlet.id) !==
                        String(selectedOutlet.id)
                )
            );

            setSelectedOutlet(null);
            setEditDialog(null);
            setSaveError('');
        } catch (error) {
            console.error(
                'Gagal menghapus outlet:',
                error
            );

            setSaveError(
                'Gagal menghapus outlet. Periksa koneksi Firebase lalu coba lagi.'
            );
        }
    };

    /* =====================================================
       RENDER
    ===================================================== */
    return (
        <Box sx={{ width: '100%', minWidth: 0 }}>
            <Typography
                variant="h4"
                gutterBottom
                sx={{ color: 'primary.main' }}
            >
                View Map
            </Typography>

            {!mapReady && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Pilih Frontliner untuk menampilkan outlet,
                    atau tekan Lokasi Saya untuk mendeteksi GPS.
                </Alert>
            )}

            {loadingMap && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Sedang memuat outlet Frontliner...
                </Alert>
            )}

            {gpsLoading && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Sedang mendeteksi lokasi GPS...
                </Alert>
            )}

            {gpsError && (
                <Alert
                    severity="warning"
                    sx={{ mb: 2 }}
                    onClose={() => setGpsError('')}
                >
                    {gpsError}
                </Alert>
            )}

            {saveError && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    onClose={() => setSaveError('')}
                >
                    {saveError}
                </Alert>
            )}

            {invalidCount > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    {invalidCount} outlet tidak ditampilkan karena
                    koordinat kosong atau tidak valid.
                </Alert>
            )}

            {/* FILTER DAN PENCARIAN */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 2,
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
                            >
                                Filter &amp; Pencarian
                            </Typography>
                        </Box>

                        {hasActiveFilters && (
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<ClearAllIcon />}
                                onClick={resetFilters}
                            >
                                Reset Filter
                            </Button>
                        )}
                    </Box>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <TextField
                                label="Cari Outlet"
                                fullWidth
                                size="small"
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(
                                        event.target.value
                                    )
                                }
                                placeholder="Nama, ID, atau alamat..."
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>
                                    Frontliner
                                </InputLabel>

                                <Select
                                    multiple
                                    value={filterFrontliner}
                                    onChange={
                                        handleFrontlinerFilterChange
                                    }
                                    label="Frontliner"
                                    renderValue={(values) =>
                                        values.length > 0 ? (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 0.5,
                                                }}
                                            >
                                                {values.map((value) => (
                                                    <Chip
                                                        key={value}
                                                        label={value}
                                                        size="small"
                                                        sx={{
                                                            bgcolor:
                                                                getColor(value),
                                                            color: '#fff',
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        ) : (
                                            'Pilih Frontliner'
                                        )
                                    }
                                >
                                    {safeFrontliners.map((fl) => (
                                        <MenuItem
                                            key={fl}
                                            value={fl}
                                        >
                                            <Checkbox
                                                checked={filterFrontliner.includes(
                                                    fl
                                                )}
                                                size="small"
                                            />
                                            {fl}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>
                                    Account
                                </InputLabel>

                                <Select
                                    multiple
                                    value={filterAccount}
                                    onChange={(event) =>
                                        setFilterAccount(
                                            event.target.value
                                        )
                                    }
                                    label="Account"
                                    renderValue={(values) =>
                                        values.length > 0 ? (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 0.5,
                                                }}
                                            >
                                                {values.map((value) => (
                                                    <Chip
                                                        key={value}
                                                        label={value}
                                                        size="small"
                                                    />
                                                ))}
                                            </Box>
                                        ) : (
                                            'Semua Account'
                                        )
                                    }
                                >
                                    {accounts.map((account) => (
                                        <MenuItem
                                            key={account}
                                            value={account}
                                        >
                                            <Checkbox
                                                checked={filterAccount.includes(
                                                    account
                                                )}
                                                size="small"
                                            />
                                            {account}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>
                                    RTG / Freezer
                                </InputLabel>

                                <Select
                                    multiple
                                    value={filterRTG}
                                    onChange={(event) =>
                                        setFilterRTG(
                                            event.target.value
                                        )
                                    }
                                    label="RTG / Freezer"
                                    renderValue={(values) =>
                                        values.length > 0 ? (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 0.5,
                                                }}
                                            >
                                                {values.map((value) => (
                                                    <Chip
                                                        key={value}
                                                        label={value}
                                                        size="small"
                                                    />
                                                ))}
                                            </Box>
                                        ) : (
                                            'Semua RTG / Freezer'
                                        )
                                    }
                                >
                                    {RTG_LABELS.map((label) => (
                                        <MenuItem
                                            key={label}
                                            value={label}
                                        >
                                            <Checkbox
                                                checked={filterRTG.includes(
                                                    label
                                                )}
                                                size="small"
                                            />

                                            {getRTGIcon(label)}

                                            <Box sx={{ ml: 1 }}>
                                                {label}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="map-outlet-select-label">
                                    Pilih Outlet
                                </InputLabel>

                                <Select
                                    labelId="map-outlet-select-label"
                                    label="Pilih Outlet"
                                    value={
                                        selectedOutlet
                                            ? String(
                                                  selectedOutlet.id ??
                                                      selectedOutlet.outletId ??
                                                      ''
                                              )
                                            : ''
                                    }
                                    onChange={(event) => {
                                        const chosen =
                                            filteredOutlets.find(
                                                (outlet) =>
                                                    String(
                                                        outlet.id ??
                                                            outlet.outletId ??
                                                            ''
                                                    ) ===
                                                    String(
                                                        event.target.value
                                                    )
                                            );

                                        if (chosen) {
                                            handleMarkerSelect(chosen);
                                        } else {
                                            setSelectedOutlet(null);
                                        }
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Pilih outlet...</em>
                                    </MenuItem>

                                    {filteredOutlets.map(
                                        (outlet, index) => {
                                            const outletKey = String(
                                                outlet.id ??
                                                    outlet.outletId ??
                                                    `${
                                                        outlet.outletName ||
                                                        'outlet'
                                                    }-${index}`
                                            );

                                            return (
                                                <MenuItem
                                                    key={outletKey}
                                                    value={outletKey}
                                                >
                                                    {outlet.outletName ||
                                                        'Outlet tanpa nama'}{' '}
                                                    —{' '}
                                                    {outlet.outletId ||
                                                        outlet.id ||
                                                        '-'}
                                                </MenuItem>
                                            );
                                        }
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    {/* LEGENDA FRONTLINER */}
                    <Box
                        sx={{
                            mt: 2,
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                            alignItems: 'center',
                        }}
                    >
                        <Typography
                            variant="body2"
                            fontWeight={600}
                        >
                            Frontliner:
                        </Typography>

                        {safeFrontliners.map((fl) => (
                            <Chip
                                key={fl}
                                label={`${fl} (${
                                    frontlinerCounts[fl] || 0
                                })${customColors[fl] ? ' *' : ''}`}
                                size="small"
                                onClick={() => {
                                    setSelectedColorName(fl);
                                    setColorDialog(true);
                                }}
                                sx={{
                                    bgcolor: getColor(fl),
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                }}
                            />
                        ))}

                        <Chip
                            label={`Outlet cocok: ${filteredOutlets.length}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />

                        <Chip
                            label={`Koordinat valid: ${validOutlets.length}`}
                            size="small"
                            variant="outlined"
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* PETA */}
            <Grid container spacing={2} alignItems="stretch">
                <Grid
                    size={{
                        xs: 12,
                        md: selectedOutlet && !isMobile ? 8 : 12,
                    }}
                >
                    <Card
                        sx={{
                            overflow: 'hidden',
                            height: '100%',
                        }}
                    >
                        <Box
                            sx={{
                                position: 'relative',
                                height: {
                                    xs: '60vh',
                                    md: '75vh',
                                },
                                minHeight: 360,
                                width: '100%',
                                '& .leaflet-container': {
                                    height: '100%',
                                    width: '100%',
                                    background: '#e8edf1',
                                },
                            }}
                        >
                            {/* TOMBOL GPS */}
                            <Button
                                variant="contained"
                                onClick={handleLocateMe}
                                disabled={gpsLoading}
                                startIcon={<MyLocation />}
                                sx={{
                                    position: 'absolute',
                                    top: 12,
                                    right: 12,
                                    zIndex: 1000,
                                    minWidth: 0,
                                    bgcolor: '#fff',
                                    color: '#1976d2',
                                    boxShadow: 3,
                                    '&:hover': {
                                        bgcolor: '#f2f7ff',
                                    },
                                }}
                            >
                                {gpsLoading
                                    ? 'Mendeteksi...'
                                    : 'Lokasi Saya'}
                            </Button>

                            {(mapReady &&
                                validOutlets.length > 0) ||
                            gpsPosition ? (
                                <MapContainer
                                    center={
                                        gpsPosition
                                            ? [
                                                  gpsPosition.latitude,
                                                  gpsPosition.longitude,
                                              ]
                                            : initialCenter
                                    }
                                    zoom={gpsPosition ? 15 : 12}
                                    style={{
                                        height: '100%',
                                        width: '100%',
                                    }}
                                    preferCanvas
                                    zoomAnimation={false}
                                    markerZoomAnimation={false}
                                    fadeAnimation={false}
                                    scrollWheelZoom
                                >
                                    <TileLayer
                                        attribution="&copy; OpenStreetMap contributors"
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        updateWhenIdle
                                        updateWhenZooming={false}
                                        keepBuffer={2}
                                    />

                                    <OutletMarkerLayer
                                        outlets={validOutlets}
                                        customColors={customColors}
                                        onSelect={handleMarkerSelect}
                                    />

                                    <MapFocusController
                                        selectedOutlet={selectedOutlet}
                                    />

                                    <GpsLocationMarker
                                        position={gpsPosition}
                                        accuracy={gpsAccuracy}
                                    />
                                </MapContainer>
                            ) : (
                                <Box
                                    sx={{
                                        height: '100%',
                                        minHeight: 360,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 3,
                                        textAlign: 'center',
                                        bgcolor: '#f9f9f9',
                                    }}
                                >
                                    <LocationIcon
                                        sx={{
                                            fontSize: 70,
                                            color: 'primary.light',
                                            mb: 2,
                                        }}
                                    />

                                    <Typography
                                        variant="h6"
                                        color="text.secondary"
                                    >
                                        Peta belum ditampilkan
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mt: 1 }}
                                    >
                                        Pilih Frontliner atau tekan
                                        tombol Lokasi Saya untuk
                                        menampilkan peta.
                                    </Typography>

                                    {hasActiveFilters && (
                                        <Button
                                            variant="outlined"
                                            onClick={resetFilters}
                                            sx={{ mt: 2 }}
                                        >
                                            Reset Filter
                                        </Button>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Card>
                </Grid>

                {/* PANEL EDIT DESKTOP */}
                {selectedOutlet && !isMobile && (
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card
                            sx={{
                                height: '100%',
                                minHeight: { md: 360 },
                            }}
                        >
                            <CardContent>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 2,
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        fontWeight={600}
                                    >
                                        Edit Outlet
                                    </Typography>

                                    <IconButton
                                        onClick={() =>
                                            setSelectedOutlet(null)
                                        }
                                        size="small"
                                        aria-label="Tutup detail outlet"
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </Box>

                                <Typography
                                    variant="subtitle1"
                                    fontWeight={700}
                                >
                                    {selectedOutlet.outletName ||
                                        'Outlet tanpa nama'}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mb: 1,
                                        overflowWrap: 'anywhere',
                                    }}
                                >
                                    ID: {selectedOutlet.outletId || '-'}
                                    {' | '}
                                    Account: {selectedOutlet.account || '-'}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    sx={{
                                        mb: 2,
                                        overflowWrap: 'anywhere',
                                    }}
                                >
                                    <b>Alamat:</b>{' '}
                                    {selectedOutlet.address || '-'}
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid size={12}>
                                        <FormControl
                                            fullWidth
                                            size="small"
                                        >
                                            <InputLabel id="map-edit-frontliner-label">
                                                Frontliner
                                            </InputLabel>

                                            <Select
                                                labelId="map-edit-frontliner-label"
                                                label="Frontliner"
                                                value={
                                                    editForm.frontliner || ''
                                                }
                                                onChange={(event) =>
                                                    setEditForm((prev) => ({
                                                        ...prev,
                                                        frontliner:
                                                            event.target.value,
                                                    }))
                                                }
                                            >
                                                {safeFrontliners.map(
                                                    (fl) => (
                                                        <MenuItem
                                                            key={fl}
                                                            value={fl}
                                                        >
                                                            {fl}
                                                        </MenuItem>
                                                    )
                                                )}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    <Grid size={12}>
                                        <FormControl
                                            fullWidth
                                            size="small"
                                        >
                                            <InputLabel id="map-edit-rtg-label">
                                                RTG / Freezer
                                            </InputLabel>

                                            <Select
                                                labelId="map-edit-rtg-label"
                                                label="RTG / Freezer"
                                                value={
                                                    editForm.rtgFreezer ||
                                                    'None'
                                                }
                                                onChange={(event) =>
                                                    setEditForm((prev) => ({
                                                        ...prev,
                                                        rtgFreezer:
                                                            event.target.value,
                                                    }))
                                                }
                                            >
                                                {RTG_LABELS.map(
                                                    (label) => (
                                                        <MenuItem
                                                            key={label}
                                                            value={label}
                                                        >
                                                            {label}
                                                        </MenuItem>
                                                    )
                                                )}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>

                                <Box
                                    sx={{
                                        mt: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1,
                                    }}
                                >
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={handleSaveMapFields}
                                    >
                                        Simpan Frontliner / RTG
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        startIcon={<EditIcon />}
                                        fullWidth
                                        onClick={() =>
                                            handleEdit(selectedOutlet)
                                        }
                                    >
                                        Edit Outlet Lainnya
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        color="error"
                                        fullWidth
                                        onClick={handleDelete}
                                    >
                                        Hapus Outlet
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>

            {/* POP-UP EDIT OUTLET KHUSUS MOBILE */}
            <Dialog
                open={Boolean(selectedOutlet) && isMobile}
                onClose={() => setSelectedOutlet(null)}
                fullWidth
                maxWidth="sm"
                scroll="paper"
                PaperProps={{
                    sx: {
                        mx: 2,
                        width: 'calc(100% - 32px)',
                        maxWidth: 440,
                        borderRadius: 3,
                        maxHeight: '85dvh',
                        m: 2,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        bgcolor: 'primary.main',
                        color: '#fff',
                        py: 1.75,
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700} fontSize={17}>
                            Edit Outlet
                        </Typography>

                        <Typography
                            variant="caption"
                            sx={{
                                color: 'rgba(255,255,255,.8)',
                            }}
                        >
                            Detail dan pengaturan outlet
                        </Typography>
                    </Box>

                    <IconButton
                        onClick={() => setSelectedOutlet(null)}
                        aria-label="Tutup edit outlet"
                        sx={{
                            color: '#fff',
                            flexShrink: 0,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 2.5 }}>
                    <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        sx={{ overflowWrap: 'anywhere' }}
                    >
                        {selectedOutlet?.outletName ||
                            'Outlet tanpa nama'}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mt: 0.5,
                            mb: 1.5,
                            overflowWrap: 'anywhere',
                        }}
                    >
                        ID: {selectedOutlet?.outletId || '-'}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            mb: 2,
                            overflowWrap: 'anywhere',
                        }}
                    >
                        <b>Account:</b>{' '}
                        {selectedOutlet?.account || '-'}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            mb: 2,
                            overflowWrap: 'anywhere',
                        }}
                    >
                        <b>Alamat:</b>{' '}
                        {selectedOutlet?.address || '-'}
                    </Typography>

                    <Divider sx={{ mb: 2 }} />

                    <FormControl
                        fullWidth
                        size="small"
                        sx={{ mb: 2 }}
                    >
                        <InputLabel id="mobile-edit-frontliner-label">
                            Frontliner
                        </InputLabel>

                        <Select
                            labelId="mobile-edit-frontliner-label"
                            label="Frontliner"
                            value={editForm.frontliner || ''}
                            onChange={(event) =>
                                setEditForm((prev) => ({
                                    ...prev,
                                    frontliner: event.target.value,
                                }))
                            }
                        >
                            {safeFrontliners.map((fl) => (
                                <MenuItem key={fl} value={fl}>
                                    {fl}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                        <InputLabel id="mobile-edit-rtg-label">
                            RTG / Freezer
                        </InputLabel>

                        <Select
                            labelId="mobile-edit-rtg-label"
                            label="RTG / Freezer"
                            value={editForm.rtgFreezer || 'None'}
                            onChange={(event) =>
                                setEditForm((prev) => ({
                                    ...prev,
                                    rtgFreezer: event.target.value,
                                }))
                            }
                        >
                            {RTG_LABELS.map((label) => (
                                <MenuItem
                                    key={label}
                                    value={label}
                                >
                                    {label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {saveError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {saveError}
                        </Alert>
                    )}
                </DialogContent>

                <DialogActions
                    sx={{
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        gap: 1,
                        '& > :not(style) ~ :not(style)': {
                            ml: 0,
                        },
                    }}
                >
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSaveMapFields}
                    >
                        Simpan Frontliner / RTG
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        fullWidth
                        onClick={() => handleEdit(selectedOutlet)}
                    >
                        Edit Outlet Lainnya
                    </Button>

                    <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        onClick={handleDelete}
                    >
                        Hapus Outlet
                    </Button>

                    <Button
                        color="inherit"
                        fullWidth
                        onClick={() => setSelectedOutlet(null)}
                    >
                        Tutup
                    </Button>
                </DialogActions>
            </Dialog>

            {/* DIALOG EDIT OUTLET LENGKAP */}
            <Dialog
                open={Boolean(editDialog)}
                onClose={() => setEditDialog(null)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle
                    sx={{
                        bgcolor: 'primary.main',
                        color: '#fff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <EditIcon />
                        Edit Outlet
                    </Box>

                    <IconButton
                        onClick={() => setEditDialog(null)}
                        sx={{ color: '#fff' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                    <Grid container spacing={2}>
                        <Grid size={12}>
                            <TextField
                                label="Frontliner"
                                fullWidth
                                select
                                value={editForm.frontliner || ''}
                                onChange={(event) =>
                                    setEditForm((prev) => ({
                                        ...prev,
                                        frontliner:
                                            event.target.value,
                                    }))
                                }
                            >
                                {safeFrontliners.map((fl) => (
                                    <MenuItem key={fl} value={fl}>
                                        {fl}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="RTG / Freezer"
                                fullWidth
                                select
                                value={
                                    editForm.rtgFreezer || 'None'
                                }
                                onChange={(event) =>
                                    setEditForm((prev) => ({
                                        ...prev,
                                        rtgFreezer:
                                            event.target.value,
                                    }))
                                }
                            >
                                {RTG_LABELS.map((label) => (
                                    <MenuItem
                                        key={label}
                                        value={label}
                                    >
                                        {label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Account"
                                fullWidth
                                value={editForm.account || ''}
                                onChange={(event) =>
                                    setEditForm((prev) => ({
                                        ...prev,
                                        account: event.target.value,
                                    }))
                                }
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setEditDialog(null)}
                        variant="outlined"
                    >
                        Batal
                    </Button>

                    <Button
                        onClick={handleSaveEdit}
                        variant="contained"
                    >
                        Simpan
                    </Button>
                </DialogActions>
            </Dialog>

            {/* DIALOG WARNA FRONTLINER */}
            <Dialog
                open={colorDialog}
                onClose={() => setColorDialog(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle
                    sx={{
                        bgcolor: 'primary.main',
                        color: '#fff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <PaletteIcon />
                        Warna {selectedColorName}
                    </Box>

                    <IconButton
                        onClick={() => setColorDialog(false)}
                        sx={{ color: '#fff' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                    >
                        Pilih warna Frontliner:
                    </Typography>

                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                        }}
                    >
                        {COLOR_PICKER_PALETTE.map((color) => (
                            <Box
                                key={color}
                                role="button"
                                tabIndex={0}
                                aria-label={`Pilih warna ${color}`}
                                onClick={() =>
                                    handleSaveColor(color)
                                }
                                onKeyDown={(event) => {
                                    if (
                                        event.key === 'Enter' ||
                                        event.key === ' '
                                    ) {
                                        event.preventDefault();
                                        handleSaveColor(color);
                                    }
                                }}
                                sx={{
                                    width: 36,
                                    height: 36,
                                    bgcolor: color,
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    border:
                                        getColor(selectedColorName) ===
                                        color
                                            ? '3px solid #222'
                                            : '1px solid #ddd',
                                }}
                            />
                        ))}
                    </Box>

                    <Box
                        sx={{
                            mt: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <Typography variant="body2">
                            Warna custom:
                        </Typography>

                        <input
                            type="color"
                            value={getColor(selectedColorName)}
                            onChange={(event) =>
                                handleSaveColor(
                                    event.target.value
                                )
                            }
                        />
                    </Box>

                    {customColors[selectedColorName] && (
                        <Button
                            onClick={handleResetColor}
                            variant="outlined"
                            color="error"
                            fullWidth
                            sx={{ mt: 2 }}
                        >
                            Reset Warna Otomatis
                        </Button>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}

export default MapPage;