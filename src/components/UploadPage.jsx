import React, { useState, useRef } from 'react';
import {
    Card, CardContent, Typography, Button, Box, Alert, LinearProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Grid, Divider, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { 
    CloudUpload as UploadIcon, Delete as DeleteIcon, CheckCircle as CheckIcon, 
    Warning as WarningIcon, Download as DownloadIcon, Edit as EditIcon, 
    Storefront as StoreIcon, DeleteSweep as DeleteAllIcon, TableView as ExcelIcon, 
    RestoreFromTrash as RestoreIcon, ExpandMore as ExpandMoreIcon, History as HistoryIcon 
} from '@mui/icons-material';
import { useData } from '../context/DataContext';
import Papa from 'papaparse';
import { parseCSV, downloadTemplate } from '../utils/csvParser';
import { getFrontlinerColor, RTG_LABELS } from '../utils/constants';

const UploadPage = () => {
    // ✅ Ambil fungsi baru dari DataContext
    const { 
        outlets = [], deletedOutlets = [], addOutlets, updateOutlet, clearAll, 
        restoreOutlet, permanentlyDeleteOutlet, clearDeletedOutlets, frontliners = [] 
    } = useData();
    
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [editDialog, setEditDialog] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [busy, setBusy] = useState(false);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.csv')) { setError('Hanya file CSV yang diperbolehkan!'); return; }
        setUploading(true); setError(null); setSuccess(null);
        try {
            const data = await parseCSV(file);
            const validData = data.filter((d) => Number.isFinite(d.latitude) && Number.isFinite(d.longitude) && d.latitude >= -90 && d.latitude <= 90 && d.longitude >= -180 && d.longitude <= 180 && d.latitude !== 0 && d.longitude !== 0 && d.outletName);
            if (validData.length === 0) throw new Error('Tidak ada baris valid. Pastikan Outlet Name dan koordinat Latitude/Longitude terisi.');
            await addOutlets(validData);
            setSuccess(`Berhasil upload ${validData.length} outlet`);
        } catch (err) { console.error(err); setError(err?.message || 'Gagal memproses file CSV.'); }
        finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    const handleEdit = (outlet) => { setEditForm({ ...outlet }); setEditDialog(outlet); };

    const handleSaveEdit = async () => {
        if (!editDialog?.id) return;
        setBusy(true); setError(null); setSuccess(null);
        try {
            await updateOutlet(editDialog.id, {
                frontliner: editForm.frontliner || '',
                outletId: editForm.outletId || '',
                account: editForm.account || '',
                outletName: editForm.outletName || '',
                rtgFreezer: editForm.rtgFreezer || 'None',
                district: editForm.district || '',
                address: editForm.address || '',
            });
            setEditDialog(null);
            setSuccess('Perubahan outlet berhasil disimpan.');
        } catch (err) {
            console.error(err); setError(err?.message || 'Gagal menyimpan perubahan outlet.');
        } finally { setBusy(false); }
    };

    const handleDownloadExcel = () => {
        const rows = outlets.map((o) => ({
            'Frontliner': o.frontliner || '', 'Outlet ID': o.outletId || '',
            'Outlet Name': o.outletName || '', 'City': o.city || '',
            'District': o.district || '', 'Account': o.account || '',
            'Latitude': o.latitude ?? '', 'Longitude': o.longitude ?? '',
            'Address': o.address || '', 'RTG_Freezer': o.rtgFreezer || 'None',
        }));
        const csv = '\uFEFF' + Papa.unparse(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = `md_mapping_outlets_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    };

    const handleDeleteAll = async () => {
        const confirmation = window.prompt(`PERINGATAN: ${outlets.length} outlet akan dipindahkan ke daftar Deleted dan dapat di-restore. Ketik HAPUS SEMUA untuk melanjutkan.`);
        if (confirmation !== 'HAPUS SEMUA') return;
        setBusy(true); setError(null); setSuccess(null);
        try { await clearAll(); setSuccess('Semua outlet dipindahkan ke daftar Deleted. Buka bagian Deleted di halaman ini untuk restore atau hapus permanen.'); }
        catch (err) { console.error(err); setError(err?.message || 'Gagal menghapus seluruh data outlet.'); }
        finally { setBusy(false); }
    };

    // ✅ BARU: Hapus permanen satu outlet dari daftar Deleted
    const handlePermanentlyDelete = async (id, outletName) => {
        const confirmed = window.confirm(`Yakin ingin menghapus PERMANEN outlet "${outletName}"? Tindakan ini tidak dapat dibatalkan.`);
        if (!confirmed) return;
        setBusy(true); setError(null); setSuccess(null);
        try {
            await permanentlyDeleteOutlet(id);
            setSuccess(`Outlet "${outletName}" berhasil dihapus permanen.`);
        } catch (err) {
            console.error(err);
            setError(err?.message || 'Gagal menghapus outlet secara permanen.');
        } finally {
            setBusy(false);
        }
    };

    // ✅ BARU: Hapus permanen SEMUA outlet dari daftar Deleted
    const handleClearAllDeleted = async () => {
        const confirmation = window.prompt(`PERINGATAN: ${deletedOutlets.length} outlet di daftar Deleted akan dihapus PERMANEN. Ketik HAPUS PERMANEN untuk melanjutkan.`);
        if (confirmation !== 'HAPUS PERMANEN') return;
        setBusy(true); setError(null); setSuccess(null);
        try {
            await clearDeletedOutlets();
            setSuccess('Semua outlet di daftar Deleted berhasil dihapus permanen.');
        } catch (err) {
            console.error(err);
            setError(err?.message || 'Gagal menghapus daftar Deleted.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><StoreIcon color="primary" sx={{ fontSize: 32 }} /><Typography variant="h4" sx={{ color: 'primary.main' }}>Upload Data Outlet</Typography></Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Upload file CSV sesuai template untuk menambahkan data outlet ke peta.</Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ border: '2px dashed', borderColor: 'primary.light', borderRadius: 3, p: 4, textAlign: 'center', bgcolor: 'rgba(196, 30, 58, 0.03)', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(196, 30, 58, 0.08)', borderColor: 'primary.main' } }} onClick={() => fileInputRef.current?.click()}>
                                <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" fontWeight={600} gutterBottom>Drop CSV File Here</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>atau klik untuk memilih file</Typography>
                                <Button variant="contained" component="label" startIcon={<UploadIcon />} sx={{ pointerEvents: 'none' }}>Pilih File CSV</Button>
                                <input ref={fileInputRef} type="file" accept=".csv" hidden onChange={handleFileUpload} />
                            </Box>
                            {uploading && <LinearProgress sx={{ mt: 2 }} />}
                            {error && <Alert severity="error" sx={{ mt: 2 }} icon={<WarningIcon />}>{error}</Alert>}
                            {success && <Alert severity="success" sx={{ mt: 2 }} icon={<CheckIcon />}>{success}</Alert>}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>Format CSV Template</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box sx={{ overflowX: 'auto' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'rgba(196, 30, 58, 0.08)' }}>
                                            <TableCell><b>Column</b></TableCell><TableCell><b>Keterangan</b></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {[['Frontliner', 'Nama frontliner'], ['Outlet ID', 'ID outlet'], ['Outlet Name', 'Nama outlet'], ['City', 'Kota'], ['District', 'Kecamatan'], ['Account', 'Alfamart/Indomaret'], ['Latitude', 'Koordinat latitude'], ['Longitude', 'Koordinat longitude'], ['Address', 'Alamat lengkap'], ['RTG_Freezer', 'Pilihan: RTG, Freezer, Freezer toko']].map(([col, desc]) => (
                                            <TableRow key={col}><TableCell><Chip label={col} size="small" color="primary" variant="outlined" /></TableCell><TableCell>{desc}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadTemplate} sx={{ mt: 2 }} fullWidth>Download Template CSV</Button>
                        </CardContent>
                    </Card>
                </Grid>

                {outlets.length > 0 && (
                    <Accordion defaultExpanded disableGutters sx={{ mt: 1, border: '1px solid #E2E8F0', borderRadius: '12px !important', overflow: 'hidden', '&:before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#F8FAFC', minHeight: 64, '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.25, flexWrap: 'wrap' } }}>
                            <StoreIcon color="primary" />
                            <Box sx={{ flex: 1, minWidth: 150 }}>
                                <Typography fontWeight={700}>Data Outlet</Typography>
                                <Typography variant="caption" color="text.secondary">{outlets.length} outlet aktif · Kelola, edit, atau hapus outlet</Typography>
                            </Box>
                            <Chip label={`${outlets.length} Outlet`} color="primary" size="small" />
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                <Typography variant="subtitle1" fontWeight={600}>Daftar Outlet</Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Button size="small" variant="outlined" startIcon={<ExcelIcon />} onClick={handleDownloadExcel} disabled={!outlets.length || busy}>Download Excel (CSV)</Button>
                                    <Button size="small" variant="outlined" color="error" startIcon={<DeleteAllIcon />} onClick={handleDeleteAll} disabled={!outlets.length || busy}>Hapus Semua</Button>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                {frontliners.filter(Boolean).map((fl) => (
                                    <Chip key={fl} label={`${String(fl).split(' ').slice(0, 2).join(' ')} (${outlets.filter((o) => o.frontliner === fl).length})`} size="small" sx={{ bgcolor: getFrontlinerColor(fl), color: 'white', fontWeight: 600 }} />
                                ))}
                            </Box>
                            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500, overflow: 'auto' }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            {['Frontliner', 'Outlet ID', 'Outlet Name', 'Account', 'District', 'RTG/Freezer', 'Aksi'].map((h) => (
                                                <TableCell key={h} sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {outlets.slice(0, 50).map((outlet) => (
                                            <TableRow key={outlet.id} hover>
                                                <TableCell><Chip label={String(outlet.frontliner || 'Belum ditentukan').split(' ').slice(0, 2).join(' ')} size="small" sx={{ bgcolor: getFrontlinerColor(outlet.frontliner), color: 'white', fontWeight: 600 }} /></TableCell>
                                                <TableCell>{outlet.outletId}</TableCell>
                                                <TableCell>{outlet.outletName}</TableCell>
                                                <TableCell>{outlet.account}</TableCell>
                                                <TableCell>{outlet.district}</TableCell>
                                                <TableCell><Chip label={outlet.rtgFreezer || 'None'} size="small" color={outlet.rtgFreezer === 'Freezer' || outlet.rtgFreezer === 'Freezer toko' ? 'info' : outlet.rtgFreezer === 'RTG' ? 'warning' : 'default'} /></TableCell>
                                                <TableCell>
                                                    <IconButton size="small" color="primary" aria-label="Edit outlet" onClick={() => handleEdit(outlet)}><EditIcon fontSize="small" /></IconButton>
                                                    <IconButton size="small" color="error" aria-label="Hapus outlet" disabled={busy} onClick={() => removeOutlet(outlet.id)}><DeleteIcon fontSize="small" /></IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            {outlets.length > 50 && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Menampilkan 50 dari {outlets.length} outlet. Download CSV untuk mendapatkan seluruh data.</Typography>
                            )}
                        </AccordionDetails>
                    </Accordion>
                )}
            </Grid>

            {/* ✅ BAGIAN DELETED OUTLETS DENGAN FITUR HAPUS PERMANEN */}
            <Accordion sx={{ mt: 3, border: '1px solid #E2E8F0', borderRadius: '12px !important', overflow: 'hidden' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#F8FAFC' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flex: 1 }}>
                        <HistoryIcon color="action" />
                        <Box>
                            <Typography fontWeight={700}>Deleted / Outlet Terhapus</Typography>
                            <Typography variant="caption" color="text.secondary">Arsip outlet yang dihapus. Dapat di-restore atau dihapus permanen.</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={deletedOutlets.length} size="small" color={deletedOutlets.length ? 'warning' : 'default'} />
                        {deletedOutlets.length > 0 && (
                            <Button 
                                size="small" 
                                variant="outlined" 
                                color="error" 
                                startIcon={<DeleteAllIcon />}
                                onClick={handleClearAllDeleted}
                                disabled={busy}
                            >
                                Hapus Semua
                            </Button>
                        )}
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    {deletedOutlets.length === 0 ? (
                        <Alert severity="info">Belum ada outlet di daftar Deleted.</Alert>
                    ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 420 }}>
                            <Table size="small" stickyHeader>
                                <TableHead><TableRow>
                                    {['Outlet ID', 'Outlet Name', 'Frontliner', 'Account', 'RTG / Freezer', 'Dihapus pada', 'Aksi'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, bgcolor: '#F1F5F9' }}>{h}</TableCell>)}
                                </TableRow></TableHead>
                                <TableBody>
                                    {[...deletedOutlets].sort((a, b) => String(b.deletedAt || '').localeCompare(String(a.deletedAt || ''))).map((item) => (
                                        <TableRow key={item.id || item.outletId} hover>
                                            <TableCell>{item.outletId || '-'}</TableCell>
                                            <TableCell>{item.outletName || '-'}</TableCell>
                                            <TableCell>{item.frontliner || '-'}</TableCell>
                                            <TableCell>{item.account || '-'}</TableCell>
                                            <TableCell>{item.rtgFreezer || '-'}</TableCell>
                                            <TableCell>{item.deletedAt ? new Date(item.deletedAt).toLocaleString('id-ID') : '-'}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Button 
                                                        size="small" 
                                                        variant="contained" 
                                                        startIcon={<RestoreIcon />} 
                                                        disabled={busy} 
                                                        onClick={async () => {
                                                            setBusy(true); setError(null); setSuccess(null);
                                                            try { 
                                                                await restoreOutlet(item.id); 
                                                                setSuccess(`Outlet ${item.outletName || item.outletId || ''} berhasil di-restore.`); 
                                                            } catch (err) { 
                                                                setError(err?.message || 'Gagal restore outlet.'); 
                                                            } finally { 
                                                                setBusy(false); 
                                                            }
                                                        }}
                                                    >
                                                        Restore
                                                    </Button>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        disabled={busy}
                                                        onClick={() => handlePermanentlyDelete(item.id, item.outletName || item.outletId)}
                                                        title="Hapus Permanen"
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </AccordionDetails>
            </Accordion>

            <Dialog open={!!editDialog} onClose={() => setEditDialog(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>Edit Outlet</DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Grid container spacing={2}>
                        <Grid size={12}>
                            <TextField label="Frontliner" fullWidth select value={editForm.frontliner || ''} onChange={(e) => setEditForm({ ...editForm, frontliner: e.target.value })}>
                                {frontliners.map((fl) => (<MenuItem key={fl} value={fl}>{fl}</MenuItem>))}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="Outlet ID" fullWidth value={editForm.outletId || ''} onChange={(e) => setEditForm({ ...editForm, outletId: e.target.value })} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="Account" fullWidth value={editForm.account || ''} onChange={(e) => setEditForm({ ...editForm, account: e.target.value })} />
                        </Grid>
                        <Grid size={12}>
                            <TextField label="Outlet Name" fullWidth value={editForm.outletName || ''} onChange={(e) => setEditForm({ ...editForm, outletName: e.target.value })} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="RTG / Freezer" fullWidth select value={editForm.rtgFreezer || 'RTG'} onChange={(e) => setEditForm({ ...editForm, rtgFreezer: e.target.value })}>
                                {RTG_LABELS.map((label) => (<MenuItem key={label} value={label}>{label}</MenuItem>))}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="District" fullWidth value={editForm.district || ''} onChange={(e) => setEditForm({ ...editForm, district: e.target.value })} />
                        </Grid>
                        <Grid size={12}>
                            <TextField label="Address" fullWidth multiline rows={2} value={editForm.address || ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setEditDialog(null)} variant="outlined">Batal</Button>
                    <Button onClick={handleSaveEdit} variant="contained" color="primary" disabled={busy}>Simpan Perubahan</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UploadPage;
