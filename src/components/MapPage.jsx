import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert, Box, Button, Card, CardContent, Checkbox, Chip, Dialog,
    DialogActions, DialogContent, DialogTitle, FormControl, Grid, IconButton,
    InputLabel, MenuItem, Select, TextField, Typography,
} from '@mui/material';
import {
    AcUnit, Air, ClearAll as ClearAllIcon, Close as CloseIcon,
    Edit as EditIcon, FilterList as FilterIcon, LocationOn as LocationIcon,
    Palette as PaletteIcon, Whatshot,
} from '@mui/icons-material';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useData } from '../context/DataContext';
import { getFrontlinerColor, RTG_LABELS, COLOR_PICKER_PALETTE } from '../utils/constants';

const DEFAULT_CENTER = [-6.9175, 107.6191];
const CLUSTER_OPTIONS = {
    chunkedLoading: true,
    chunkInterval: 100,
    chunkDelay: 25,
    maxClusterRadius: 55,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    removeOutsideVisibleBounds: true,
    animate: false,
    animateAddingMarkers: false,
};

const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const isValidCoordinate = (outlet) => {
    if (!outlet) return false;
    const latRaw = outlet.latitude;
    const lngRaw = outlet.longitude;
    if (latRaw === '' || latRaw === null || latRaw === undefined || lngRaw === '' || lngRaw === null || lngRaw === undefined) return false;
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

const makePinIcon = (color) => L.divIcon({
    className: 'md-map-pin',
    html: `<div style="width:18px;height:18px;border:3px solid #fff;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);box-shadow:0 1px 5px #0006"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -20],
});

// Leaflet manages markers outside React. This avoids rendering thousands of React Marker components.
const ClusteredOutletLayer = memo(function ClusteredOutletLayer({ outlets, customColors, onSelect }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !L.markerClusterGroup) return undefined;

        // Penting: pembuatan marker dilakukan bertahap agar browser tidak freeze.
        // chunkedLoading Leaflet hanya membagi proses addLayers, bukan loop pembuatan marker.
        const cluster = L.markerClusterGroup({
            ...CLUSTER_OPTIONS,
            chunkedLoading: false,
            animate: false,
            animateAddingMarkers: false,
        });
        const icons = new Map();
        const valid = outlets.filter(isValidCoordinate);
        const batchSize = 60;
        let index = 0;
        let timerId = null;
        let cancelled = false;

        map.addLayer(cluster);

        const addNextBatch = () => {
            if (cancelled) return;
            const batch = [];
            const stopAt = Math.min(index + batchSize, valid.length);

            for (; index < stopAt; index += 1) {
                const outlet = valid[index];
                const lat = Number(outlet.latitude);
                const lng = Number(outlet.longitude);
                const color = getFrontlinerColor(outlet.frontliner, customColors) || '#64748b';
                if (!icons.has(color)) icons.set(color, makePinIcon(color));

                const marker = L.marker([lat, lng], {
                    icon: icons.get(color),
                    keyboard: false,
                    riseOnHover: false,
                });
                const outletName = escapeHTML(outlet.outletName || 'Outlet tanpa nama');
                const outletId = escapeHTML(outlet.outletId || '-');
                const account = escapeHTML(outlet.account || '-');
                const frontliner = escapeHTML(outlet.frontliner || 'Belum ditentukan');
                const address = escapeHTML(outlet.address || '-');
                const rtg = escapeHTML(outlet.rtgFreezer || 'None');

                marker.bindPopup(
                    `<div style="min-width:180px;max-width:240px;font-family:Arial,sans-serif">` +
                    `<b style="font-size:14px">${outletName}</b><br/>` +
                    `<span style="color:#64748b;font-size:12px">ID: ${outletId}</span><br/>` +
                    `<div style="margin-top:6px;font-size:12px">Account: ${account}</div>` +
                    `<div style="font-size:12px">Frontliner: ${frontliner}</div>` +
                    `<div style="font-size:12px">RTG: ${rtg}</div>` +
                    `<div style="margin-top:5px;font-size:12px;white-space:normal">${address}</div>` +
                    `<div style="margin-top:7px;color:#64748b;font-size:11px">Klik marker untuk membuka detail outlet di bawah peta.</div>` +
                    `</div>`,
                    { autoPan: false, closeButton: true }
                );
                marker.on('click', () => onSelect(outlet));
                batch.push(marker);
            }

            if (batch.length && !cancelled) cluster.addLayers(batch);
            if (index < valid.length && !cancelled) {
                // Beri browser kesempatan menggambar UI di antara batch.
                timerId = window.setTimeout(addNextBatch, 0);
            }
        };

        // Mulai setelah render awal peta selesai.
        timerId = window.setTimeout(addNextBatch, 0);

        return () => {
            cancelled = true;
            if (timerId !== null) window.clearTimeout(timerId);
            cluster.clearLayers();
            if (map.hasLayer(cluster)) map.removeLayer(cluster);
        };
    }, [map, outlets, customColors, onSelect]);

    return null;
});

function MapPage() {
    const {
        outlets = [], frontliners = [], customColors = {},
        updateOutlet, removeOutlet, updateCustomColor, getOutletsByFrontliner,
    } = useData();

    const [filterFrontliner, setFilterFrontliner] = useState([]);
    // Jangan bangun layer marker sebelum frontliner dipilih. Dialog muncul setiap kali halaman dibuka.
    const [frontlinerDialogOpen, setFrontlinerDialogOpen] = useState(true);
    const [draftFrontliner, setDraftFrontliner] = useState('');
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

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim().toLowerCase()), 250);
        return () => window.clearTimeout(timer);
    }, [searchQuery]);

    const safeOutlets = useMemo(() => (Array.isArray(outlets) ? outlets : []).filter(Boolean), [outlets]);
    const safeFrontliners = useMemo(() => (Array.isArray(frontliners) ? frontliners : []).filter(Boolean), [frontliners]);
    const outletCountByFrontliner = useMemo(() => {
        const counts = new Map();
        safeOutlets.forEach((outlet) => {
            const name = outlet?.frontliner;
            if (name) counts.set(name, (counts.get(name) || 0) + 1);
        });
        return counts;
    }, [safeOutlets]);

    // Filter peta hanya menggunakan outlet milik frontliner yang dipilih.
    const mapOutlets = useMemo(() => (Array.isArray(frontlinerOutlets) ? frontlinerOutlets : []).filter(Boolean), [frontlinerOutlets]);
    const accounts = useMemo(() => [...new Set(mapOutlets.map((o) => String(o.account ?? '').trim()).filter(Boolean))].sort(), [mapOutlets]);

    const filteredOutlets = useMemo(() => {
        return mapOutlets.filter((o) => {
            if (filterFrontliner.length && !filterFrontliner.includes(o.frontliner)) return false;
            if (filterAccount.length && !filterAccount.includes(o.account)) return false;
            if (filterRTG.length && !filterRTG.includes(o.rtgFreezer || 'None')) return false;
            if (debouncedSearch) {
                const name = String(o.outletName ?? '').toLowerCase();
                const id = String(o.outletId ?? '').toLowerCase();
                const address = String(o.address ?? '').toLowerCase();
                if (!name.includes(debouncedSearch) && !id.includes(debouncedSearch) && !address.includes(debouncedSearch)) return false;
            }
            return true;
        });
    }, [mapOutlets, filterFrontliner, filterAccount, filterRTG, debouncedSearch]);

    const validOutlets = useMemo(() => mapReady ? filteredOutlets.filter(isValidCoordinate) : [], [filteredOutlets, mapReady]);
    const invalidCount = filteredOutlets.length - validOutlets.length;
    const frontlinerCounts = useMemo(() => {
        const counts = Object.create(null);
        filteredOutlets.forEach((o) => { if (o.frontliner) counts[o.frontliner] = (counts[o.frontliner] || 0) + 1; });
        return counts;
    }, [filteredOutlets]);

    // Pusat peta dihitung dari outlet frontliner yang sedang dipilih.
    const initialCenter = useMemo(() => {
        const valid = mapOutlets.filter(isValidCoordinate).slice(0, 200);
        if (!valid.length) return DEFAULT_CENTER;
        const total = valid.reduce((acc, o) => {
            acc.lat += Number(o.latitude);
            acc.lng += Number(o.longitude);
            return acc;
        }, { lat: 0, lng: 0 });
        return [total.lat / valid.length, total.lng / valid.length];
    }, [mapOutlets]);

    const getColor = useCallback((name) => getFrontlinerColor(name, customColors) || '#64748b', [customColors]);
    const handleMarkerSelect = useCallback((outlet) => setSelectedOutlet(outlet), []);

    const resetFilters = () => {
        // Reset filter tambahan, tetapi tetap batasi peta pada frontliner terpilih agar tidak berat.
        setFilterFrontliner(draftFrontliner ? [draftFrontliner] : []);
        setFilterAccount([]); setFilterRTG([]); setSearchQuery(''); setDebouncedSearch('');
    };

    const handleShowMap = async () => {
        if (!draftFrontliner || typeof getOutletsByFrontliner !== 'function') return;
        setLoadingMap(true);
        setSaveError('');
        try {
            const result = await getOutletsByFrontliner(draftFrontliner);
            setFrontlinerOutlets(Array.isArray(result) ? result : []);
            setFilterFrontliner([draftFrontliner]);
            setFilterAccount([]); setFilterRTG([]); setSearchQuery(''); setDebouncedSearch('');
            setSelectedOutlet(null);
            setMapReady(true);
            setFrontlinerDialogOpen(false);
        } catch (error) {
            console.error('Gagal memuat outlet frontliner:', error);
            setSaveError('Gagal memuat outlet frontliner. Periksa koneksi Firebase dan coba lagi.');
        } finally {
            setLoadingMap(false);
        }
    };
    const hasActiveFilters = filterFrontliner.length || filterAccount.length || filterRTG.length || searchQuery.trim();

    const getRTGIcon = (rtg) => {
        if (rtg === 'Freezer') return <AcUnit fontSize="small" sx={{ color: '#2196F3' }} />;
        if (rtg === 'RTG') return <Whatshot fontSize="small" sx={{ color: '#FF9800' }} />;
        if (rtg === 'Chiller') return <Air fontSize="small" sx={{ color: '#4CAF50' }} />;
        return null;
    };

    const handleEdit = (outlet) => {
        setSaveError('');
        setEditForm({ ...outlet, frontliner: outlet.frontliner || '', rtgFreezer: outlet.rtgFreezer || 'None', account: outlet.account || '' });
        setEditDialog(outlet);
    };

    const handleSaveEdit = async () => {
        if (!editDialog) return;
        try {
            await updateOutlet(editDialog.id, editForm);
            setFrontlinerOutlets((prev) => prev.map((o) => String(o.id) === String(editDialog.id) ? { ...o, ...editForm } : o));
            setEditDialog(null); setSelectedOutlet(null); setSaveError('');
        } catch (error) {
            console.error('Gagal memperbarui outlet:', error);
            setSaveError('Gagal menyimpan perubahan. Periksa koneksi Firebase lalu coba lagi.');
        }
    };

    const handleSaveColor = async (color) => {
        try {
            await updateCustomColor(selectedColorName, color);
            setColorDialog(false);
        } catch (error) {
            console.error('Gagal menyimpan warna:', error);
            setSaveError('Gagal menyimpan warna frontliner.');
        }
    };

    const handleResetColor = async () => {
        try {
            await updateCustomColor(selectedColorName, null);
            setColorDialog(false);
        } catch (error) {
            console.error('Gagal mereset warna:', error);
            setSaveError('Gagal mereset warna frontliner.');
        }
    };

    const handleDelete = async () => {
        if (!selectedOutlet) return;
        const confirmed = window.confirm(`Hapus outlet "${selectedOutlet.outletName || selectedOutlet.outletId || ''}"?`);
        if (!confirmed) return;
        try {
            await removeOutlet(selectedOutlet.id);
            setFrontlinerOutlets((prev) => prev.filter((o) => String(o.id) !== String(selectedOutlet.id)));
            setSelectedOutlet(null);
        } catch (error) {
            console.error('Gagal menghapus outlet:', error);
            setSaveError('Gagal menghapus outlet. Periksa koneksi Firebase lalu coba lagi.');
        }
    };

    return (
        <Box sx={{ width: '100%', minWidth: 0 }}>
            <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>View Map</Typography>
            {!mapReady && <Alert severity="info" sx={{ mb: 2 }}>Pilih nama frontliner untuk memuat outlet yang relevan dan mengurangi beban render peta.</Alert>}
            {loadingMap && <Alert severity="info" sx={{ mb: 2 }}>Sedang memuat outlet frontliner...</Alert>}
            {saveError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError('')}>{saveError}</Alert>}
            {invalidCount > 0 && <Alert severity="info" sx={{ mb: 2 }}>{invalidCount} outlet tidak ditampilkan karena koordinat kosong atau tidak valid.</Alert>}

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FilterIcon color="primary" /><Typography variant="h6" fontWeight={600}>Filter & Pencarian</Typography></Box>
                        {hasActiveFilters && <Button size="small" variant="outlined" color="error" startIcon={<ClearAllIcon />} onClick={resetFilters}>Reset Filter</Button>}
                    </Box>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <TextField label="Cari Outlet" fullWidth size="small" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Nama, ID, atau alamat..." />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth size="small"><InputLabel>Frontliner</InputLabel>
                                <Select multiple value={filterFrontliner} onChange={(e) => setFilterFrontliner(e.target.value)} label="Frontliner"
                                    renderValue={(values) =>
                                        values.length > 0 ? (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {values.map((v) => (
                                                    <Chip key={v} label={v} size="small" sx={{ bgcolor: getColor(v), color: '#fff' }} />
                                                ))}
                                            </Box>
                                        ) : 'Semua'
                                    }>
                                    {safeFrontliners.map((fl) => <MenuItem key={fl} value={fl}><Checkbox checked={filterFrontliner.includes(fl)} size="small" />{fl}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth size="small"><InputLabel>Account</InputLabel>
                                <Select multiple value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} label="Account"
                                    renderValue={(values) =>
                                        values.length > 0 ? (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {values.map((v) => (
                                                    <Chip key={v} label={v} size="small" />
                                                ))}
                                            </Box>
                                        ) : 'Semua'
                                    }>
                                    {accounts.map((account) => <MenuItem key={account} value={account}><Checkbox checked={filterAccount.includes(account)} size="small" />{account}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth size="small"><InputLabel>RTG / Freezer</InputLabel>
                                <Select multiple value={filterRTG} onChange={(e) => setFilterRTG(e.target.value)} label="RTG / Freezer"
                                    renderValue={(values) =>
                                        values.length > 0 ? (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {values.map((v) => (
                                                    <Chip key={v} label={v} size="small" />
                                                ))}
                                            </Box>
                                        ) : 'Semua'
                                    }>
                                    {RTG_LABELS.map((label) => <MenuItem key={label} value={label}><Checkbox checked={filterRTG.includes(label)} size="small" />{getRTGIcon(label)}<Box sx={{ ml: 1 }}>{label}</Box></MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={600}>Frontliner:</Typography>
                        {safeFrontliners.map((fl) => (
                            <Chip key={fl} label={`${fl} (${frontlinerCounts[fl] || 0})${customColors[fl] ? ' *' : ''}`} size="small" onClick={() => { setSelectedColorName(fl); setColorDialog(true); }}
                                sx={{ bgcolor: getColor(fl), color: '#fff', cursor: 'pointer', fontWeight: 600 }} />
                        ))}
                        <Chip label={`Outlet cocok: ${filteredOutlets.length}`} size="small" color="primary" variant="outlined" />
                        <Chip label={`Koordinat valid: ${validOutlets.length}`} size="small" variant="outlined" />
                    </Box>
                </CardContent>
            </Card>

            <Card sx={{ overflow: 'hidden' }}>
                <Box sx={{ height: { xs: '60vh', md: '75vh' }, width: '100%', '& .leaflet-container': { height: '100%', width: '100%', background: '#e8edf1' } }}>
                    {mapReady && validOutlets.length ? (
                        <MapContainer center={initialCenter} zoom={12} style={{ height: '100%', width: '100%' }} preferCanvas zoomAnimation={false} markerZoomAnimation={false} fadeAnimation={false} scrollWheelZoom>
                            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" updateWhenIdle updateWhenZooming={false} keepBuffer={2} />
                            <ClusteredOutletLayer outlets={validOutlets} customColors={customColors} onSelect={handleMarkerSelect} />
                        </MapContainer>
                    ) : (
                        <Box sx={{ height: '100%', minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center', bgcolor: '#f9f9f9' }}>
                            <LocationIcon sx={{ fontSize: 70, color: 'primary.light', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">Tidak ada outlet dengan koordinat valid</Typography>
                            {!mapReady ? <Button variant="contained" onClick={() => setFrontlinerDialogOpen(true)} sx={{ mt: 2 }}>Pilih Frontliner</Button> : hasActiveFilters && <Button variant="outlined" onClick={resetFilters} sx={{ mt: 2 }}>Reset Filter</Button>}
                        </Box>
                    )}
                </Box>
            </Card>

            {selectedOutlet && (
                <Card sx={{ mt: 3 }}><CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight={600}>Detail Outlet</Typography>
                        <IconButton onClick={() => setSelectedOutlet(null)} size="small"><CloseIcon /></IconButton>
                    </Box>
                    <Typography><b>Nama:</b> {selectedOutlet.outletName || '-'}</Typography>
                    <Typography variant="body2" color="text.secondary">ID: {selectedOutlet.outletId || '-'} | Account: {selectedOutlet.account || '-'}</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}><b>Frontliner:</b> {selectedOutlet.frontliner || '-'}</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}><b>Alamat:</b> {selectedOutlet.address || '-'}</Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button variant="contained" startIcon={<EditIcon />} onClick={() => handleEdit(selectedOutlet)}>Edit Outlet</Button>
                        <Button variant="outlined" color="error" onClick={handleDelete}>Hapus Outlet</Button>
                    </Box>
                </CardContent></Card>
            )}

            <Dialog open={frontlinerDialogOpen} onClose={() => { if (mapReady) setFrontlinerDialogOpen(false); }} maxWidth="xs" fullWidth disableEscapeKeyDown={!mapReady}>
                <DialogTitle sx={{ bgcolor: 'primary.main', color: '#fff' }}>Pilih Frontliner</DialogTitle>
                <DialogContent sx={{ pt: '20px !important' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Agar peta lebih ringan, pilih satu nama frontliner. Marker akan ditampilkan dalam kelompok (cluster).
                    </Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel id="map-frontliner-label">Nama Frontliner</InputLabel>
                        <Select labelId="map-frontliner-label" value={draftFrontliner} label="Nama Frontliner" onChange={(e) => setDraftFrontliner(e.target.value)}>
                            {safeFrontliners.map((fl) => <MenuItem key={fl} value={fl}>{fl} ({outletCountByFrontliner.get(fl) || 0} outlet)</MenuItem>)}
                        </Select>
                    </FormControl>
                    {safeFrontliners.length === 0 && <Alert severity="warning" sx={{ mt: 2 }}>Data frontliner belum tersedia.</Alert>}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    {mapReady && <Button onClick={() => setFrontlinerDialogOpen(false)}>Batal</Button>}
                    <Button variant="contained" onClick={handleShowMap} disabled={!draftFrontliner || loadingMap}>
                        {loadingMap ? 'Memuat...' : 'Tampilkan Peta'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(editDialog)} onClose={() => setEditDialog(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: 'primary.main', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><EditIcon /> Edit Outlet</Box>
                    <IconButton onClick={() => setEditDialog(null)} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Grid container spacing={2}>
                        <Grid size={12}><TextField label="Frontliner" fullWidth select value={editForm.frontliner || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, frontliner: e.target.value }))}>
                            {safeFrontliners.map((fl) => <MenuItem key={fl} value={fl}>{fl}</MenuItem>)}
                        </TextField></Grid>
                        <Grid size={{ xs: 12, sm: 6 }}><TextField label="RTG / Freezer" fullWidth select value={editForm.rtgFreezer || 'None'} onChange={(e) => setEditForm((prev) => ({ ...prev, rtgFreezer: e.target.value }))}>
                            {RTG_LABELS.map((label) => <MenuItem key={label} value={label}>{label}</MenuItem>)}
                        </TextField></Grid>
                        <Grid size={{ xs: 12, sm: 6 }}><TextField label="Account" fullWidth value={editForm.account || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, account: e.target.value }))} /></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}><Button onClick={() => setEditDialog(null)} variant="outlined">Batal</Button><Button onClick={handleSaveEdit} variant="contained">Simpan</Button></DialogActions>
            </Dialog>

            <Dialog open={colorDialog} onClose={() => setColorDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ bgcolor: 'primary.main', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PaletteIcon /> Warna {selectedColorName}</Box>
                    <IconButton onClick={() => setColorDialog(false)} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Pilih warna frontliner:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {COLOR_PICKER_PALETTE.map((color) => <Box key={color} role="button" tabIndex={0} aria-label={`Pilih warna ${color}`} onClick={() => handleSaveColor(color)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveColor(color); }} sx={{ width: 36, height: 36, bgcolor: color, borderRadius: 1, cursor: 'pointer', border: getColor(selectedColorName) === color ? '3px solid #222' : '1px solid #ddd' }} />)}
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}><Typography variant="body2">Warna custom:</Typography><input type="color" value={getColor(selectedColorName)} onChange={(e) => handleSaveColor(e.target.value)} /></Box>
                    {customColors[selectedColorName] && <Button onClick={handleResetColor} variant="outlined" color="error" fullWidth sx={{ mt: 2 }}>Reset Warna Otomatis</Button>}
                </DialogContent>
            </Dialog>
        </Box>
    );
}

export default MapPage;
