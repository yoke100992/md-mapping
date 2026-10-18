import React, {
    createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import {
    ref, set, onValue, remove, update, get, query, orderByChild, equalTo,
} from 'firebase/database';
import { db } from '../firebase';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
    const [outlets, setOutlets] = useState([]);
    const [deletedOutlets, setDeletedOutlets] = useState([]);
    const [customColors, setCustomColors] = useState({});

    useEffect(() => {
        const unsubscribe = onValue(ref(db, 'outlets'), (snapshot) => {
            const data = snapshot.val() || {};
            setOutlets(Object.entries(data).map(([key, value]) => ({ ...value, id: value?.id ?? key })));
        }, (error) => console.error('Gagal membaca outlets:', error));
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

    const updateOutlets = useCallback(async (ids, changes) => {
        if (!Array.isArray(ids) || ids.length === 0) return;
        const updates = {};
        ids.filter((id) => id != null).forEach((id) => {
            Object.entries(changes).forEach(([key, value]) => {
                updates[`outlets/${id}/${key}`] = value;
            });
        });
        if (Object.keys(updates).length) await update(ref(db), updates);
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

    // ✅ BARU: Hapus permanen satu outlet dari deletedOutlets
    const permanentlyDeleteOutlet = useCallback(async (id) => {
        if (id == null) throw new Error('ID outlet tidak ditemukan.');
        await remove(ref(db, `deletedOutlets/${id}`));
    }, []);

    // ✅ BARU: Hapus permanen SEMUA outlet dari deletedOutlets
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

    const frontliners = useMemo(
        () => [...new Set(outlets.map((outlet) => outlet?.frontliner).filter(Boolean))]
            .sort((a, b) => String(a).localeCompare(String(b))),
        [outlets]
    );

    const value = useMemo(() => ({
        outlets, deletedOutlets, frontliners, customColors,
        addOutlets, updateOutlet, updateOutlets, removeOutlet, clearAll, restoreOutlet,
        permanentlyDeleteOutlet, clearDeletedOutlets, // ✅ Ditambahkan
        updateCustomColor, getOutletsByFrontliner,
    }), [
        outlets, deletedOutlets, frontliners, customColors, addOutlets, updateOutlet,
        updateOutlets, removeOutlet, clearAll, restoreOutlet, permanentlyDeleteOutlet, clearDeletedOutlets, updateCustomColor, getOutletsByFrontliner,
    ]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData harus di dalam DataProvider');
    return context;
};
