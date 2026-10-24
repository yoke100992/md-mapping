import React, { useState, useMemo } from 'react';
import {
    Box, Button, Card, CardContent, Typography, Alert, Stack, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    CloudUpload, CheckCircle, WarningAmber, DeleteOutlined,
    History, Warning, Check, Close
} from '@mui/icons-material';
import { useData } from '../context/DataContext';
import * as XLSX from 'xlsx';

// Helper untuk mengubah berbagai format waktu menjadi HH:mm
const convertToTimeFormat = (value) => {
    if (!value && value !== 0) return '-';

    // Jika berupa angka desimal Excel (misal: 0.30555...)
    if (typeof value === 'number') {
        const totalMinutes = Math.round(value * 24 * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    const str = String(value).trim();

    // Jika sudah dalam format HH:mm atau H:m
    if (/^\d{1,2}:\d{2}$/.test(str)) {
        const [h, m] = str.split(':');
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // Fallback untuk string lain
    return str || '-';
};

// Helper untuk mengubah durasi Excel menjadi teks "Xj Ym"
const convertDurationToText = (value) => {
    if (!value && value !== 0) return '-';

    if (typeof value === 'number') {
        const totalMinutes = Math.round(value * 24 * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h}j ${m}m`;
    }

    const str = String(value).trim();
    // Jika sudah berisi 'j' atau 'menit', kembalikan apa adanya
    if (str.includes('j') || str.includes('menit')) return str;

    // Coba konversi jika berupa angka murni (menit)
    if (!isNaN(str)) {
        const mins = parseInt(str, 10);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}j ${m}m`;
    }

    return str || '-';
};

const TrecUploadPage = () => {
    const { uploadTrecData, outlets } = useData();

    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [status, setStatus] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

    // Ambil history dari localStorage
    const [uploadHistory, setUploadHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('trec_upload_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // Mapping Outlet ID Master untuk validasi O(1)
    const outletIdMap = useMemo(() => {
        const map = new Set();
        outlets.forEach(o => map.add(String(o.outletId || o.id).trim()));
        return map;
    }, [outlets]);

    // Fungsi Validasi Format Tanggal (YYYY-MM-DD)
    const isValidDateFormat = (dateStr) => {
        if (!dateStr) return false;
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateStr)) return false;
        const d = new Date(dateStr);
        return !isNaN(d.getTime());
    };

    // Proses Parsing File saat dipilih
    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setStatus(null);
        setPreviewData([]);

        try {
            const data = await selectedFile.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            // Normalisasi key dan konversi nilai otomatis
            const normalizedData = jsonData.map(row => {
                const newRow = {};
                Object.keys(row).forEach(key => {
                    // ? PERBAIKAN: Membersihkan spasi dan lowercase agar "Check-in Time" terbaca
                    const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '');
                    let val = row[key];

                    // Konversi otomatis berdasarkan nama kolom yang lebih fleksibel
                    if (['checkintime', 'checkin', 'checkin-time'].includes(cleanKey)) {
                        val = convertToTimeFormat(val);
                    } else if (['checkouttime', 'checkout', 'checkout-time'].includes(cleanKey)) {
                        val = convertToTimeFormat(val);
                    } else if (['durasi', 'duration'].includes(cleanKey)) {
                        val = convertDurationToText(val);
                    } else if (['frontliner', 'md'].includes(cleanKey)) {
                        val = String(val).toUpperCase().trim();
                    } else {
                        val = String(val).trim();
                    }

                    newRow[cleanKey] = val;
                });
                return newRow;
            });

            // Validasi per baris
            const validatedData = normalizedData.map((row, index) => {
                const outletId = row.outletid || row.outlet_id || '';
                const date = row.tanggal || row.date || '';

                const errors = [];
                if (!outletId) errors.push('Outlet ID kosong');
                else if (!outletIdMap.has(outletId)) errors.push('Outlet ID tidak ditemukan di master');

                if (!date) errors.push('Tanggal kosong');
                else if (!isValidDateFormat(date)) errors.push(`Format tanggal salah (${date})`);

                return {
                    ...row,
                    rowIndex: index + 1,
                    validOutlet: outletIdMap.has(outletId),
                    validDate: isValidDateFormat(date),
                    errors: errors.join(', '),
                    isValid: errors.length === 0
                };
            });

            setPreviewData(validatedData);

            const errorCount = validatedData.filter(d => !d.isValid).length;
            if (errorCount > 0) {
                setStatus({
                    type: 'warning',
                    message: `Ditemukan ${errorCount} baris dengan kesalahan validasi.`
                });
            } else {
                setStatus({ type: 'success', message: `File valid! ${validatedData.length} baris siap diupload.` });
            }

        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Gagal membaca file. Pastikan format Excel/CSV benar.' });
        }
    };

    const handleUpload = async () => {
        const validRows = previewData.filter(d => d.isValid);
        if (validRows.length === 0) return;

        setUploading(true);
        try {
            // Map ke format Firebase yang konsisten
            const payload = validRows.map(row => ({
                frontliner: row.frontliner || row.md || 'UNKNOWN',
                date: row.tanggal || row.date,
                checkInTime: row.checkintime || row.check_in || '-',
                checkOutTime: row.checkouttime || row.check_out || '-',
                duration: row.durasi || row.duration || '-',
                outletId: row.outletid || row.outlet_id,
                outletName: row.outletname || row.outlet_name || '-'
            }));

            await uploadTrecData(payload);

            // Simpan metadata ke history local
            const newHistoryItem = {
                id: Date.now().toString(),
                fileName: file.name,
                uploadDate: new Date().toLocaleString('id-ID'),
                totalRows: payload.length,
                successRows: payload.length,
            };

            const newHistory = [newHistoryItem, ...uploadHistory].slice(0, 20);
            setUploadHistory(newHistory);
            localStorage.setItem('trec_upload_history', JSON.stringify(newHistory));

            setStatus({ type: 'success', message: `Berhasil mengupload ${payload.length} data kunjungan TREC.` });
            setFile(null);
            setPreviewData([]);
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: 'Gagal menyimpan data ke Firebase.' });
        } finally {
            setUploading(false);
        }
    };

    // Fungsi Hapus History dari LocalStorage
    const handleDeleteHistory = async () => {
        if (!deleteDialog.item) return;

        try {
            const updatedHistory = uploadHistory.filter(h => h.id !== deleteDialog.item.id);
            setUploadHistory(updatedHistory);
            localStorage.setItem('trec_upload_history', JSON.stringify(updatedHistory));

            setStatus({ type: 'success', message: 'Riwayat upload berhasil dihapus dari daftar.' });
        } catch (error) {
            console.error("Gagal menghapus history:", error);
            setStatus({ type: 'error', message: 'Gagal menghapus riwayat.' });
        } finally {
            setDeleteDialog({ open: false, item: null });
        }
    };

    return (
        <Box sx={{ p: { xs: 1.5, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                <CloudUpload color="primary" sx={{ fontSize: 36 }} />
                <Box>
                    <Typography variant="h5" fontWeight={800} color="primary.main">Upload Data TREC</Typography>
                    <Typography variant="body2" color="text.secondary">Impor data actual kunjungan dengan konversi waktu otomatis.</Typography>
                </Box>
            </Stack>

            {/* Upload Area */}
            <Card sx={{ borderRadius: 2, border: '1px dashed', borderColor: 'divider', textAlign: 'center', p: 4, mb: 3 }}>
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} style={{ display: 'none' }} id="trec-upload" />
                <label htmlFor="trec-upload">
                    <Button component="span" variant="contained" size="large" startIcon={<CloudUpload />} sx={{ mb: 2 }}>
                        Pilih File TREC
                    </Button>
                </label>
                {file && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{file.name}</Typography>}

                {status && (
                    <Alert severity={status.type} sx={{ mt: 3, mx: 'auto', maxWidth: 600 }}>
                        {status.message}
                    </Alert>
                )}
            </Card>

            {/* Preview & Validation Table */}
            {previewData.length > 0 && (
                <Card sx={{ borderRadius: 2, mb: 3 }}>
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2, alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight={700}>Preview & Validasi Data ({previewData.length} Baris)</Typography>
                            <Stack direction="row" spacing={1}>
                                <Chip label={`${previewData.filter(d => d.isValid).length} Valid`} color="success" size="small" />
                                <Chip label={`${previewData.filter(d => !d.isValid).length} Error`} color="error" size="small" />
                            </Stack>
                        </Stack>

                        <TableContainer sx={{ maxHeight: 400, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>No</TableCell>
                                        <TableCell>Frontliner</TableCell>
                                        <TableCell>Tanggal</TableCell>
                                        <TableCell>Check-in</TableCell>
                                        <TableCell>Check-out</TableCell>
                                        <TableCell>Outlet ID</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Keterangan Error</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {previewData.slice(0, 100).map((row, idx) => (
                                        <TableRow key={idx} sx={{ bgcolor: row.isValid ? 'transparent' : '#FEF2F2' }}>
                                            <TableCell>{row.rowIndex}</TableCell>
                                            <TableCell>{row.frontliner || row.md || '-'}</TableCell>
                                            <TableCell>{row.tanggal || row.date || '-'}</TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    {row.checkintime !== '-' ? <Check fontSize="small" color="success" /> : <Warning fontSize="small" color="error" />}
                                                    {row.checkintime || '-'}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    {row.checkouttime !== '-' ? <Check fontSize="small" color="success" /> : <Warning fontSize="small" color="error" />}
                                                    {row.checkouttime || '-'}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    {row.validOutlet ? <Check fontSize="small" color="success" /> : <Warning fontSize="small" color="error" />}
                                                    {row.outletid || row.outlet_id || '-'}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Chip size="small" label={row.isValid ? 'Valid' : 'Error'} color={row.isValid ? 'success' : 'error'} />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color={row.isValid ? 'text.secondary' : 'error.main'} noWrap sx={{ maxWidth: 250 }}>
                                                    {row.errors || '-'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 4 }}>
                <Button variant="outlined" disabled={!file || uploading || previewData.filter(d => d.isValid).length === 0} onClick={() => { setFile(null); setPreviewData([]); setStatus(null); }}>
                    Batal
                </Button>
                <Button variant="contained" color="success" disabled={!file || uploading || previewData.filter(d => d.isValid).length === 0} onClick={handleUpload} startIcon={uploading ? null : <CheckCircle />} sx={{ minWidth: 180 }}>
                    {uploading ? 'Memproses...' : `Upload ${previewData.filter(d => d.isValid).length} Data Valid`}
                </Button>
            </Box>

            {/* Upload History */}
            <Card sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 2, alignItems: 'center' }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <History color="primary" />
                            <Typography variant="h6" fontWeight={700}>Riwayat Upload</Typography>
                        </Stack>
                    </Stack>

                    {uploadHistory.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                            <CloudUpload sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                            <Typography variant="body2">Belum ada riwayat upload</Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Nama File</TableCell>
                                        <TableCell>Waktu Upload</TableCell>
                                        <TableCell>Jumlah Data</TableCell>
                                        <TableCell align="right">Aksi</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {uploadHistory.map((item, idx) => (
                                        <TableRow key={item.id || idx} hover>
                                            <TableCell>
                                                <Typography fontWeight={600} noWrap sx={{ maxWidth: 250 }}>{item.fileName}</Typography>
                                            </TableCell>
                                            <TableCell>{item.uploadDate}</TableCell>
                                            <TableCell>{item.totalRows} baris</TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Hapus Riwayat">
                                                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item })}>
                                                        <DeleteOutlined fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Dialog Konfirmasi Hapus */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
                <DialogTitle>Hapus Riwayat Upload?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Apakah Anda yakin ingin menghapus riwayat upload <b>{deleteDialog.item?.fileName}</b>?
                        Data ini akan dihapus dari daftar riwayat lokal.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Batal</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteHistory} startIcon={<Close />}>
                        Ya, Hapus Riwayat
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TrecUploadPage;