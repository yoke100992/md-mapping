import React, { useState } from 'react';
import {
    Alert, Box, Button, Card, CardContent, Checkbox, Chip,
    Divider, FormControlLabel, Grid, IconButton, InputAdornment,
    List, ListItem, ListItemIcon, ListItemText, Stack,
    Switch, TextField, Typography,
} from '@mui/material';
import {
    Lock as LockIcon,
    LockOpen as UnlockIcon,
    Save as SaveIcon,
    Settings as SettingsIcon,
    Visibility, VisibilityOff,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useLock } from '../context/LockContext';

const SettingsPage = () => {
    const {
        lockConfig,
        loading,
        isPageLocked,
        setPassword,
        removePassword,
        setLockedPages,
        AVAILABLE_PAGES,
    } = useLock();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [selectedPages, setSelectedPages] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [busy, setBusy] = useState(false);

    // Inisialisasi selectedPages dari lockConfig
    React.useEffect(() => {
        setSelectedPages(lockConfig.lockedPages || []);
    }, [lockConfig.lockedPages]);

    const handleTogglePage = (pageId) => {
        setSelectedPages((prev) =>
            prev.includes(pageId)
                ? prev.filter((id) => id !== pageId)
                : [...prev, pageId]
        );
        setError('');
        setSuccess('');
    };

    const handleSavePages = async () => {
        setError('');
        setSuccess('');
        setBusy(true);
        try {
            await setLockedPages(selectedPages);
            setSuccess(`Berhasil memperbarui halaman terkunci (${selectedPages.length} halaman).`);
        } catch (err) {
            setError('Gagal menyimpan konfigurasi halaman.');
        } finally {
            setBusy(false);
        }
    };

    const handleSetPassword = async () => {
        setError('');
        setSuccess('');

        if (!newPassword.trim()) {
            setError('Password tidak boleh kosong.');
            return;
        }
        if (newPassword.length < 4) {
            setError('Password minimal 4 karakter.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Konfirmasi password tidak cocok.');
            return;
        }

        setBusy(true);
        try {
            await setPassword(newPassword);
            setNewPassword('');
            setConfirmPassword('');
            setSuccess('Password berhasil diperbarui.');
        } catch (err) {
            setError('Gagal menyimpan password.');
        } finally {
            setBusy(false);
        }
    };

    const handleRemovePassword = async () => {
        if (!window.confirm('Yakin ingin menghapus password? Semua halaman akan bisa diakses tanpa password.')) return;
        setBusy(true);
        try {
            await removePassword();
            setSuccess('Password berhasil dihapus.');
        } catch (err) {
            setError('Gagal menghapus password.');
        } finally {
            setBusy(false);
        }
    };

    const hasPassword = !!lockConfig.passwordHash;

    if (loading) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Memuat konfigurasi...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
                <SettingsIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 750 }}>
                    Lock Page Settings
                </Typography>
            </Stack>

            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Kelola password dan pilih halaman mana saja yang membutuhkan password untuk diakses.
            </Typography>

            {/* BAGIAN 1: PASSWORD */}
            <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        {hasPassword ? <LockIcon color="error" /> : <LockOpenIcon color="success" />}
                        <Typography variant="h6" fontWeight={700}>
                            1. Password Proteksi
                        </Typography>
                        {hasPassword && (
                            <Chip label="Aktif" color="error" size="small" sx={{ ml: 1 }} />
                        )}
                        {!hasPassword && (
                            <Chip label="Belum diset" color="default" size="small" sx={{ ml: 1 }} />
                        )}
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {hasPassword
                            ? 'Password sudah aktif. Anda dapat mengubah atau menghapusnya di bawah ini.'
                            : 'Belum ada password. Silakan buat password untuk mengaktifkan proteksi halaman.'}
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Password Baru"
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Minimal 4 karakter"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Konfirmasi Password"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Ulangi password"
                            />
                        </Grid>
                    </Grid>

                    <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSetPassword}
                            disabled={busy}
                        >
                            {busy ? 'Menyimpan...' : hasPassword ? 'Ubah Password' : 'Set Password'}
                        </Button>
                        {hasPassword && (
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={handleRemovePassword}
                                disabled={busy}
                            >
                                Hapus Password
                            </Button>
                        )}
                    </Stack>
                </CardContent>
            </Card>

            {/* BAGIAN 2: PILIH HALAMAN */}
            <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <LockIcon color="primary" />
                        <Typography variant="h6" fontWeight={700}>
                            2. Halaman Terkunci
                        </Typography>
                        <Chip
                            label={`${selectedPages.length} halaman`}
                            color="primary"
                            size="small"
                            sx={{ ml: 1 }}
                        />
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Pilih halaman mana saja yang membutuhkan password untuk diakses. Halaman yang tidak dipilih akan tetap bisa diakses bebas.
                    </Typography>

                    <List sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        {AVAILABLE_PAGES.map((page) => {
                            const checked = selectedPages.includes(page.id);
                            return (
                                <ListItem
                                    key={page.id}
                                    dense
                                    button
                                    onClick={() => handleTogglePage(page.id)}
                                    sx={{
                                        borderBottom: '1px solid #f0f0f0',
                                        '&:last-child': { borderBottom: 'none' },
                                        bgcolor: checked ? '#f5f9ff' : 'transparent',
                                    }}
                                >
                                    <ListItemIcon>
                                        <Checkbox
                                            edge="start"
                                            checked={checked}
                                            tabIndex={-1}
                                            disableRipple
                                            color="primary"
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={page.label}
                                        secondary={page.path}
                                        primaryTypographyProps={{ fontWeight: 600 }}
                                    />
                                    {checked && <LockIcon color="error" fontSize="small" />}
                                    {!checked && <LockOpenIcon color="success" fontSize="small" />}
                                </ListItem>
                            );
                        })}
                    </List>

                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSavePages}
                            disabled={busy}
                        >
                            {busy ? 'Menyimpan...' : 'Simpan Konfigurasi Halaman'}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => setSelectedPages([])}
                        >
                            Reset Pilihan
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => setSelectedPages(AVAILABLE_PAGES.map((p) => p.id))}
                        >
                            Pilih Semua
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {/* INFO */}
            <Card>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                        ?? Informasi
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2 }}>
                        <li>Password disimpan dengan encoding aman di Firebase.</li>
                        <li>Sesi unlock bertahan selama <b>30 menit</b> per browser.</li>
                        <li>Setelah 30 menit atau browser ditutup, password akan diminta kembali.</li>
                        <li>Konfigurasi tersimpan global - berlaku untuk semua pengguna aplikasi.</li>
                        <li>Halaman <b>Lock Settings</b> ini sendiri juga bisa dikunci.</li>
                    </Typography>
                </CardContent>
            </Card>

            {error && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}
        </Box>
    );
};

export default SettingsPage;