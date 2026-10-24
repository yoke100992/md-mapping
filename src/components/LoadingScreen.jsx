import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { StorefrontOutlined } from '@mui/icons-material';

const LoadingScreen = () => {
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                zIndex: 9999,
            }}
        >
            {/* Logo / Icon Brand */}
            <Box
                sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '24px',
                    background: 'linear-gradient(145deg, #2DD4BF, #0D9488)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(13, 148, 136, 0.2)',
                    mb: 3,
                    animation: 'pulse 2s infinite ease-in-out',
                }}
            >
                <StorefrontOutlined sx={{ fontSize: 40, color: '#FFFFFF' }} />
            </Box>

            {/* Spinner Halus */}
            <CircularProgress size={32} thickness={4} sx={{ color: '#0D9488', mb: 2 }} />

            {/* Teks Loading */}
            <Typography variant="h6" fontWeight={700} color="#0F172A" sx={{ mb: 0.5 }}>
                MD Mapping
            </Typography>
            <Typography variant="body2" color="#64748B">
                Loading, please wait ....
            </Typography>

            {/* Keyframes untuk animasi pulse logo */}
            <style>
                {`
                    @keyframes pulse {
                        0% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.05); opacity: 0.8; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                `}
            </style>
        </Box>
    );
};

export default LoadingScreen;