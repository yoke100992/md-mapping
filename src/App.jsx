import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 1. TAMBAHKAN IMPORT DATA PROVIDER DI SINI
import { DataProvider } from './context/DataContext';
import { LockProvider } from './context/LockContext';

// Import komponen proteksi & layout
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Import halaman-halaman
import DashboardPage from './components/DashboardPage';
import ManageOutletsPage from './components/ManageOutletsPage';
import UploadPage from './components/UploadPage';
import EditPage from './components/EditPage';
import MapPage from './components/MapPage';
import SettingsPage from './components/SettingsPage';

// Jika kamu sudah membuat LockSettingsPage, import di sini:
// import LockSettingsPage from './components/LockSettingsPage';

function App() {
    return (
        // 2. PENTING: DataProvider HARUS membungkus semuanya agar useData() bisa bekerja
        <DataProvider>
            <LockProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Layout />}>
                            <Route index element={
                                <ProtectedRoute pageId="dashboard">
                                    <DashboardPage />
                                </ProtectedRoute>
                            } />
                            
                            <Route path="outlets" element={
                                <ProtectedRoute pageId="outlets">
                                    <ManageOutletsPage />
                                </ProtectedRoute>
                            } />
                            
                            <Route path="upload" element={
                                <ProtectedRoute pageId="upload">
                                    <UploadPage />
                                </ProtectedRoute>
                            } />
                            
                            <Route path="edit" element={
                                <ProtectedRoute pageId="edit">
                                    <EditPage />
                                </ProtectedRoute>
                            } />
                            
                            <Route path="map" element={
                                <ProtectedRoute pageId="map">
                                    <MapPage />
                                </ProtectedRoute>
                            } />
                            
                            <Route path="settings" element={
                                <ProtectedRoute pageId="settings">
                                    <SettingsPage />
                                </ProtectedRoute>
                            } />

                            {/* Jika ada halaman Lock Settings, tambahkan di sini (tanpa ProtectedRoute agar selalu bisa diakses untuk mengatur password) */}
                            {/* <Route path="lock-settings" element={<LockSettingsPage />} /> */}
                            
                        </Route>
                    </Routes>
                </BrowserRouter>
            </LockProvider>
        </DataProvider>
    );
}

export default App;
