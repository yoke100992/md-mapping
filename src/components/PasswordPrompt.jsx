import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Alert, Box, Typography,
} from '@mui/material';
import { Lock as LockIcon, Visibility, VisibilityOff } from '@mui/icons-material';

const PasswordPrompt = ({ open, pageLabel, onVerify, onClose }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const handleSubmit = async () => {
        if (!password.trim()) {
            setError('Masukkan password.');
            return;
        }
        setBusy(true);
        setError('');
        try {
            const valid = await onVerify(password);
            if (valid) {
                setPassword('');
                onClose();
            } else {
                setError('Password salah. Silakan coba lagi.');
            }
        } catch (err) {
            setError('Terjadi kesalahan saat verifikasi.');
        } finally {
            setBusy(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockIcon /> Halaman Terkunci
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    Halaman <b>{pageLabel}</b> terkunci. Masukkan password untuk mengakses.
                </Typography>

                <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    onKeyDown={handleKeyDown}
                    error={!!error}
                    helperText={error}
                    autoFocus
                    InputProps={{
                        endAdornment: (
                            <Box
                                component="button"
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                sx={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'text.secondary', display: 'flex', alignItems: 'center',
                                }}
                            >
                                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </Box>
                        ),
                    }}
                />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="outlined">Batal</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={busy}>
                    {busy ? 'Memverifikasi...' : 'Buka'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PasswordPrompt;