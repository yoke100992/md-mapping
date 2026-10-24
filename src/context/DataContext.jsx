import React, {
    createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import {
    ref, set, onValue, remove, update, get, query, orderByChild, equalTo, push,
} from 'firebase/database';
import { db } from '../firebase';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
    const [outlets, setOutlets] = useState([]);
    const [deletedOutlets, setDeletedOutlets] = useState([]);
    const [customColors, setCustomColors] = useState({});
    const [visitSchedules, setVisitSchedules] = useState([]);

    // ✅ State untuk Data Laporan Kunjungan (TREC)
    const [visitReports, setVisitReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onValue(ref(db, 'outlets'), (snapshot) => {
            const data = snapshot.val() || {};
            setOutlets(Object.entries(data).map(([key, value]) => ({ ...value, id: value?.id ?? key })));
            setIsLoading(false);
        }, (error) => {
            console.error('Gagal membaca outlets:', error);
            setIsLoading(false);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const unsubscribe = onValue(ref(db, 'deletedOutlets'), (snapshot) => {
            const data = snapshot.val() || {};
            setDeletedOutlets(Object.entries(data).map(([key, value]) => ({ ...value, id: value?.id ?? key })));
        }, (error) => console.error('Gagal membaca deleted outlets:', error));
        return unsubscribe;
    }, []);

    useEffect(() => {
        const unsubscribe = onValue(ref(db, 'customColors'), (snapshot) => {
            setCustomColors(snapshot.val() || {});
        }, (error) => console.error('Gagal membaca custom colors:', error));
        return unsubscribe;
    }, []);

    useEffect(() => {
        const unsubscribe = onValue(ref(db, 'visitSchedules'), (snapshot) => {
            const data = snapshot.val() || {};
            setVisitSchedules(Object.entries(data).map(([key, value]) => ({ ...value, id: value?.id ?? key })));
        }, (error) => console.error('Gagal membaca visit schedules:', error));
        return unsubscribe;
    }, []);

    // ✅ Listener Real-time untuk Data TREC (Diperbaiki untuk struktur Nested)
    useEffect(() => {
        const unsubscribe = onValue(ref(db, 'visitReports'), (snapshot) => {
            const data = snapshot.val() || {};
            let reportsArray = [];

            // Looping untuk membongkar struktur nested: Date -> Frontliner -> List Outlet
            Object.values(data).forEach(dateGroup => {
                if (typeof dateGroup === 'object') {
                    Object.values(dateGroup).forEach(mdGroup => {
                        if (typeof mdGroup === 'object' && !Array.isArray(mdGroup)) {
                            // Ambil semua value outlet di dalam group MD
                            const outlets = Object.values(mdGroup);
                            reportsArray = [...reportsArray, ...outlets];
                        } else if (Array.isArray(mdGroup)) {
                            // Handle jika formatnya sudah flat per MD
                            reportsArray = [...reportsArray, ...mdGroup];
                        }
                    });
                }
            });

            setVisitReports(reportsArray.filter(Boolean));
        }, (error) => console.error('Gagal membaca visit reports:', error));
        return unsubscribe;
    }, []);

    const addOutlets = useCallback(async (newOutlets) => {
        if (!Array.isArray(newOutlets) || newOutlets.length === 0) return;
        const updates = {};
        for (const outlet of newOutlets) {
            const id = String(outlet.id ?? '').trim() || `outlet-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            updates[`outlets/${id}`] = { ...outlet, id };
        }
        await update(ref(db), updates);
    }, []);

    const updateOutlet = useCallback(async (id, changes) => {
        if (id == null) throw new Error('ID outlet tidak ditemukan.');
        await update(ref(db, `outlets/${id}`), changes);
    }, []);

    const removeOutlet = useCallback(async (id) => {
        if (id == null) throw new Error('ID outlet tidak ditemukan.');
        const snapshot = await get(ref(db, `outlets/${id}`));
        if (snapshot.exists()) {
            const outlet = snapshot.val();
            await update(ref(db), {
                [`deletedOutlets/${id}`]: { ...outlet, id, deletedAt: new Date().toISOString() },
                [`outlets/${id}`]: null,
            });
        }
    }, []);

    const clearAll = useCallback(async () => {
        const snapshot = await get(ref(db, 'outlets'));
        const data = snapshot.val() || {};
        const updates = {};
        const deletedAt = new Date().toISOString();
        Object.entries(data).forEach(([id, outlet]) => {
            updates[`deletedOutlets/${id}`] = { ...outlet, id, deletedAt };
            updates[`outlets/${id}`] = null;
        });
        if (Object.keys(updates).length) await update(ref(db), updates);
    }, []);

    const restoreOutlet = useCallback(async (id) => {
        if (id == null) throw new Error('ID outlet tidak ditemukan.');
        const snapshot = await get(ref(db, `deletedOutlets/${id}`));
        if (!snapshot.exists()) throw new Error('Data outlet yang akan dipulihkan tidak ditemukan.');
        const outlet = snapshot.val();
        const { deletedAt, ...restoredOutlet } = outlet;
        await update(ref(db), {
            [`outlets/${id}`]: { ...restoredOutlet, id },
            [`deletedOutlets/${id}`]: null,
        });
    }, []);

    const permanentlyDeleteOutlet = useCallback(async (id) => {
        if (id == null) throw new Error('ID outlet tidak ditemukan.');
        await remove(ref(db, `deletedOutlets/${id}`));
    }, []);

    const clearDeletedOutlets = useCallback(async () => {
        await remove(ref(db, 'deletedOutlets'));
    }, []);

    const updateCustomColor = useCallback(async (frontliner, color) => {
        if (!frontliner) throw new Error('Nama frontliner tidak valid.');
        const colorRef = ref(db, `customColors/${frontliner}`);
        if (color == null) await remove(colorRef);
        else await set(colorRef, color);
    }, []);

    const getOutletsByFrontliner = useCallback(async (frontliner) => {
        if (!frontliner) return [];
        const outletQuery = query(ref(db, 'outlets'), orderByChild('frontliner'), equalTo(frontliner));
        const snapshot = await get(outletQuery);
        const data = snapshot.val() || {};
        return Object.entries(data).map(([key, value]) => ({ ...value, id: value?.id ?? key }));
    }, []);

    const saveVisitSchedule = useCallback(async (scheduleData) => {
        const { id, date, frontliner, outlets: scheduleOutlets, status, totalOutlets, rtgCount } = scheduleData;
        const payload = {
            date, frontliner, outlets: scheduleOutlets, status, totalOutlets, rtgCount,
            updatedAt: new Date().toISOString()
        };
        if (id) {
            await update(ref(db, `visitSchedules/${id}`), payload);
        } else {
            payload.createdAt = new Date().toISOString();
            const newRef = push(ref(db, 'visitSchedules'));
            await set(newRef, { ...payload, id: newRef.key });
        }
    }, []);

    const deleteVisitSchedule = useCallback(async (id) => {
        if (!id) throw new Error('ID jadwal tidak ditemukan.');
        await remove(ref(db, `visitSchedules/${id}`));
    }, []);

    // ✅ Fungsi Upload Batch Data TREC
    const uploadTrecData = useCallback(async (reports) => {
        if (!Array.isArray(reports) || reports.length === 0) return;
        const updates = {};

        for (const report of reports) {
            // Grouping by date and frontliner for better organization
            const path = `visitReports/${report.date}/${report.frontliner}/${report.outletId}_${Date.now()}`;
            updates[path] = { ...report, uploadedAt: new Date().toISOString() };
        }
        await update(ref(db), updates);
    }, []);

    const frontliners = useMemo(() =>
        [...new Set(outlets.map((o) => o?.frontliner).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [outlets]);

    const value = useMemo(() => ({
        outlets, deletedOutlets, frontliners, customColors, visitSchedules, visitReports, isLoading,
        addOutlets, updateOutlet, removeOutlet, clearAll, restoreOutlet, permanentlyDeleteOutlet,
        clearDeletedOutlets, updateCustomColor, getOutletsByFrontliner, saveVisitSchedule,
        deleteVisitSchedule, uploadTrecData,
    }), [outlets, deletedOutlets, frontliners, customColors, visitSchedules, visitReports, isLoading,
        addOutlets, updateOutlet, removeOutlet, clearAll, restoreOutlet, permanentlyDeleteOutlet,
        clearDeletedOutlets, updateCustomColor, getOutletsByFrontliner, saveVisitSchedule,
        deleteVisitSchedule, uploadTrecData]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData harus di dalam DataProvider');
    return context;
};
