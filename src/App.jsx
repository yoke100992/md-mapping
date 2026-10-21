
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { DataProvider } from './context/DataContext';
import { LockProvider } from './context/LockContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import DashboardPage from './components/DashboardPage';
import ManageOutletsPage from './components/ManageOutletsPage';
import UploadPage from './components/UploadPage';
import EditPage from './components/EditPage';
import MapPage from './components/MapPage';
import SettingsPage from './components/SettingsPage';

// BARU: Halaman Jadwal Kunjungan MD
import VisitSchedulePage from './components/VisitSchedulePage';

function App() {
    return (
        <DataProvider>
            <LockProvider>
                <BrowserRouter>
                    <Routes>
                        {/* DASHBOARD */}
                        <Route
                            path="/"
                            element={
                                <Layout>
                                    <ProtectedRoute pageId="dashboard">
                                        <DashboardPage />
                                    </ProtectedRoute>
                                </Layout>
                            }
                        />

                        {/* KELOLA OUTLET */}
                        <Route
                            path="/manage"
                            element={
                                <Layout>
                                    <ProtectedRoute pageId="outlets">
                                        <ManageOutletsPage />
                                    </ProtectedRoute>
                                </Layout>
                            }
                        />

                        {/* UPLOAD DATA */}
                        <Route
                            path="/upload"
                            element={
                                <Layout>
                                    <ProtectedRoute pageId="upload">
                                        <UploadPage />
                                    </ProtectedRoute>
                                </Layout>
                            }
                        />

                        {/* EDIT DATA */}
                        <Route
                            path="/edit"
                            element={
                                <Layout>
                                    <ProtectedRoute pageId="edit">
                                        <EditPage />
                                    </ProtectedRoute>
                                </Layout>
                            }
                        />

                        {/* VIEW MAP */}
                        <Route
                            path="/map"
                            element={
                                <Layout>
                                    <ProtectedRoute pageId="map">
                                        <MapPage />
                                    </ProtectedRoute>
                                </Layout>
                            }
                        />

                        {/* SETTINGS */}
                        <Route
                            path="/settings"
                            element={
                                <Layout>
                                    <ProtectedRoute pageId="settings">
                                        <SettingsPage />
                                    </ProtectedRoute>
                                </Layout>
                            }
                        />

                        {/* BARU: JADWAL KUNJUNGAN MD */}
                        <Route
                            path="/visit-schedule"
                            element={
                                <Layout>
                                    <ProtectedRoute pageId="visitSchedule">
                                        <VisitSchedulePage />
                                    </ProtectedRoute>
                                </Layout>
                            }
                        />
                    </Routes>
                </BrowserRouter>
            </LockProvider>
        </DataProvider>
    );
}

export default App;
