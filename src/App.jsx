import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LockProvider } from './context/LockContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import halaman-halaman kamu
import DashboardPage from './components/DashboardPage';
import ManageOutletsPage from './components/ManageOutletsPage';
import UploadPage from './components/UploadPage';
import EditPage from './components/EditPage';
import MapPage from './components/MapPage';
import SettingsPage from './components/SettingsPage';
import Layout from './components/Layout'; // sidebar kamu

function App() {
    return (
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
                    </Route>
                </Routes>
            </BrowserRouter>
        </LockProvider>
    );
}

export default App;
