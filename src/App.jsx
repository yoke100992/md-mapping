import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import { LockProvider } from './context/LockContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import DashboardPage from './components/DashboardPage';
import ManageOutletsPage from './components/ManageOutletsPage';
import UploadPage from './components/UploadPage';
import EditPage from './components/EditPage';
import MapPage from './components/MapPage';
import SettingsPage from './components/SettingsPage';
import VisitSchedulePage from './components/VisitSchedulePage';
// ✅ Import Halaman Baru
import TrecUploadPage from './components/TrecUploadPage';
import TrecMonitoringPage from './components/TrecMonitoringPage'; // Pastikan nama file sesuai
import LoadingScreen from './components/LoadingScreen';

const AppContent = () => {
    const { isLoading } = useData();

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={
                    <Layout>
                        <ProtectedRoute pageId="dashboard">
                            <DashboardPage />
                        </ProtectedRoute>
                    </Layout>
                } />
                <Route path="/manage" element={
                    <Layout>
                        <ProtectedRoute pageId="outlets">
                            <ManageOutletsPage />
                        </ProtectedRoute>
                    </Layout>
                } />
                <Route path="/upload" element={
                    <Layout>
                        <ProtectedRoute pageId="upload">
                            <UploadPage />
                        </ProtectedRoute>
                    </Layout>
                } />
                <Route path="/edit" element={
                    <Layout>
                        <ProtectedRoute pageId="edit">
                            <EditPage />
                        </ProtectedRoute>
                    </Layout>
                } />
                <Route path="/map" element={
                    <Layout>
                        <ProtectedRoute pageId="map">
                            <MapPage />
                        </ProtectedRoute>
                    </Layout>
                } />
                <Route path="/visitschedule" element={
                    <Layout>
                        <ProtectedRoute pageId="visitschedule">
                            <VisitSchedulePage />
                        </ProtectedRoute>
                    </Layout>
                } />

                {/* ✅ Route Baru untuk TREC */}
                <Route path="/trec-upload" element={
                    <Layout>
                        <ProtectedRoute pageId="trec-upload">
                            <TrecUploadPage />
                        </ProtectedRoute>
                    </Layout>
                } />
                <Route path="/trec-monitoring" element={
                    <Layout>
                        <ProtectedRoute pageId="trec-monitoring">
                            <TrecMonitoringPage />
                        </ProtectedRoute>
                    </Layout>
                } />

                <Route path="/settings" element={
                    <Layout>
                        <ProtectedRoute pageId="settings">
                            <SettingsPage />
                        </ProtectedRoute>
                    </Layout>
                } />
            </Routes>
        </BrowserRouter>
    );
};

function App() {
    return (
        <DataProvider>
            <LockProvider>
                <AppContent />
            </LockProvider>
        </DataProvider>
    );
}

export default App;
