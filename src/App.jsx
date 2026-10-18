import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material';
import { DataProvider } from './context/DataContext';
import fiestaTheme from './theme';
import Layout from './components/Layout';
import DashboardPage from './components/DashboardPage';
import UploadPage from './components/UploadPage';
import MapPage from './components/MapPage';
import ManageOutletsPage from './components/ManageOutletsPage';
import { downloadTemplate } from './utils/csvParser';

const TemplatePage = () => {
    React.useEffect(() => { downloadTemplate(); }, []);
    return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" color="primary.main" fontWeight={600}>? Template sedang diunduh...</Typography>
        </Box>
    );
};

function App() {
    return (
        <ThemeProvider theme={fiestaTheme}>
            <CssBaseline />
            <DataProvider>
                <BrowserRouter>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/manage" element={<ManageOutletsPage />} />
                            

                            <Route path="/template" element={<TemplatePage />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Layout>
                </BrowserRouter>
            </DataProvider>
        </ThemeProvider>
    );
}

export default App;