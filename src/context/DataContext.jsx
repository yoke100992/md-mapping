import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    ref,
    set,
    onValue,
    remove,
    update,
    get,
    query,
    orderByChild,
    equalTo,
} from 'firebase/database';
import { db } from '../firebase';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
    const [outlets, setOutlets] = useState([]);
    const [customColors, setCustomColors] = useState({});

    // Listener ini tetap dipertahankan agar halaman lain yang memakai `outlets`
    // tidak rusak. MapPage memakai query khusus untuk mengambil outlet terpilih.
    useEffect(() => {
        const outletsRef = ref(db, 'outlets');
        const unsubscribe = onValue(
            outletsRef,
            (snapshot) => {
                const data = snapshot.val();
                setOutlets(data ? Object.values(data) : []);
            },
            (error) => console.error('Gagal membaca outlets:', error)
        );
        return unsubscribe;
    }, []);

    useEffect(() => {
        const colorsRef = ref(db, 'customColors');
        const unsubscribe = onValue(
            colorsRef,
            (snapshot) => setCustomColors(snapshot.val() || {}),
            (error) => console.error('Gagal membaca custom colors:', error)
        );
        return unsubscribe;
    }, []);

    const addOutlets = useCallback(async (newOutlets) => {
        if (!Array.isArray(newOutlets) || newOutlets.length === 0) return;
        const updates = {};
        const usedIds = new Set();

        for (const outlet of newOutlets) {
            let id = String(outlet.id ?? '').trim();
            if (!id || usedIds.has(id)) {
                id = `outlet-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            }
            usedIds.add(id);
            updates[`outlets/${id}`] = { ...outlet, id };
        }

        await update(ref(db), updates);
    }, []);

    const updateOutlet = useCallback(async (id, updates) => {
        if (id == null) return;
        await update(ref(db, `outlets/${id}`), updates);
    }, []);

    const removeOutlet = useCallback(async (id) => {
        if (id == null) return;
        await remove(ref(db, `outlets/${id}`));
    }, []);

    const clearAll = useCallback(async () => {
        await remove(ref(db, 'outlets'));
    }, []);

    const updateCustomColor = useCallback(async (frontliner, color) => {
        if (!frontliner) throw new Error('Nama frontliner tidak valid.');
        const colorRef = ref(db, `customColors/${frontliner}`);
        if (color == null) await remove(colorRef);
        else await set(colorRef, color);
    }, []);

    // Mengambil hanya outlet milik frontliner yang dipilih untuk layer peta.
    const getOutletsByFrontliner = useCallback(async (frontliner) => {
        if (!frontliner) return [];
        const outletQuery = query(
            ref(db, 'outlets'),
            orderByChild('frontliner'),
            equalTo(frontliner)
        );
        const snapshot = await get(outletQuery);
        const data = snapshot.val();
        return data ? Object.values(data) : [];
    }, []);

    const frontliners = useMemo(
        () =>
            [...new Set(outlets.map((outlet) => outlet?.frontliner).filter(Boolean))].sort(
                (a, b) => String(a).localeCompare(String(b))
            ),
        [outlets]
    );

    const value = useMemo(
        () => ({
            outlets,
            frontliners,
            customColors,
            addOutlets,
            updateOutlet,
            removeOutlet,
            clearAll,
            updateCustomColor,
            getOutletsByFrontliner,
        }),
        [
            outlets,
            frontliners,
            customColors,
            addOutlets,
            updateOutlet,
            removeOutlet,
            clearAll,
            updateCustomColor,
            getOutletsByFrontliner,
        ]
    );

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData harus di dalam DataProvider');
    return context;
};
