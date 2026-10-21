
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
    push,
    query,
    orderByChild,
    equalTo,
} from 'firebase/database';

import { db } from '../firebase';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
    const [outlets, setOutlets] = useState([]);
    const [deletedOutlets, setDeletedOutlets] = useState([]);
    const [customColors, setCustomColors] = useState({});

    // ==========================================
    // BARU: STATE JADWAL KUNJUNGAN MD
    // ==========================================
    const [visitSchedules, setVisitSchedules] = useState([]);

    // ==========================================
    // LISTENER OUTLETS
    // ==========================================
    useEffect(() => {
        const unsubscribe = onValue(
            ref(db, 'outlets'),
            (snapshot) => {
                const data = snapshot.val() || {};

                setOutlets(
                    Object.entries(data).map(([key, value]) => ({
                        ...value,
                        id: value?.id ?? key,
                    }))
                );
            },
            (error) => console.error('Gagal membaca outlets:', error)
        );

        return unsubscribe;
    }, []);

    // ==========================================
    // LISTENER DELETED OUTLETS
    // ==========================================
    useEffect(() => {
        const unsubscribe = onValue(
            ref(db, 'deletedOutlets'),
            (snapshot) => {
                const data = snapshot.val() || {};

                setDeletedOutlets(
                    Object.entries(data).map(([key, value]) => ({
                        ...value,
                        id: value?.id ?? key,
                    }))
                );
            },
            (error) => console.error(
                'Gagal membaca deleted outlets:',
                error
            )
        );

        return unsubscribe;
    }, []);

    // ==========================================
    // LISTENER CUSTOM COLORS
    // ==========================================
    useEffect(() => {
        const unsubscribe = onValue(
            ref(db, 'customColors'),
            (snapshot) => {
                setCustomColors(snapshot.val() || {});
            },
            (error) => console.error(
                'Gagal membaca custom colors:',
                error
            )
        );

        return unsubscribe;
    }, []);

    // ==========================================
    // BARU: LISTENER JADWAL KUNJUNGAN MD
    // Firebase path: visitSchedules
    // ==========================================
    useEffect(() => {
        const unsubscribe = onValue(
            ref(db, 'visitSchedules'),
            (snapshot) => {
                const data = snapshot.val() || {};

                const schedules = Object.entries(data).map(
                    ([key, value]) => ({
                        ...value,
                        id: value?.id ?? key,
                    })
                );

                // Jadwal terbaru ditampilkan lebih dahulu.
                schedules.sort((a, b) => {
                    const dateA = String(a.date || '');
                    const dateB = String(b.date || '');

                    if (dateA !== dateB) {
                        return dateB.localeCompare(dateA);
                    }

                    return String(b.updatedAt || b.createdAt || '')
                        .localeCompare(
                            String(a.updatedAt || a.createdAt || '')
                        );
                });

                setVisitSchedules(schedules);
            },
            (error) => console.error(
                'Gagal membaca jadwal kunjungan:',
                error
            )
        );

        return unsubscribe;
    }, []);

    // ==========================================
    // TAMBAH OUTLETS
    // ==========================================
    const addOutlets = useCallback(async (newOutlets) => {
        if (!Array.isArray(newOutlets) || newOutlets.length === 0) {
            return;
        }

        const updates = {};

        for (const outlet of newOutlets) {
            const id = String(outlet.id ?? '').trim()
                || `outlet-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 9)}`;

            updates[`outlets/${id}`] = {
                ...outlet,
                id,
            };
        }

        await update(ref(db), updates);
    }, []);

    // ==========================================
    // UPDATE SATU OUTLET
    // ==========================================
    const updateOutlet = useCallback(async (id, changes) => {
        if (id == null) {
            throw new Error('ID outlet tidak ditemukan.');
        }

        await update(ref(db, `outlets/${id}`), changes);
    }, []);

    // ==========================================
    // UPDATE BANYAK OUTLET
    // ==========================================
    const updateOutlets = useCallback(async (ids, changes) => {
        if (!Array.isArray(ids) || ids.length === 0) {
            return;
        }

        const updates = {};

        ids.filter((id) => id != null).forEach((id) => {
            Object.entries(changes).forEach(([key, value]) => {
                updates[`outlets/${id}/${key}`] = value;
            });
        });

        if (Object.keys(updates).length) {
            await update(ref(db), updates);
        }
    }, []);

    // ==========================================
    // HAPUS OUTLET (SOFT DELETE)
    // ==========================================
    const removeOutlet = useCallback(async (id) => {
        if (id == null) {
            throw new Error('ID outlet tidak ditemukan.');
        }

        const snapshot = await get(ref(db, `outlets/${id}`));

        if (snapshot.exists()) {
            const outlet = snapshot.val();

            await update(ref(db), {
                [`deletedOutlets/${id}`]: {
                    ...outlet,
                    id,
                    deletedAt: new Date().toISOString(),
                },
                [`outlets/${id}`]: null,
            });
        }
    }, []);

    // ==========================================
    // HAPUS SEMUA OUTLET (SOFT DELETE)
    // ==========================================
    const clearAll = useCallback(async () => {
        const snapshot = await get(ref(db, 'outlets'));
        const data = snapshot.val() || {};
        const updates = {};
        const deletedAt = new Date().toISOString();

        Object.entries(data).forEach(([id, outlet]) => {
            updates[`deletedOutlets/${id}`] = {
                ...outlet,
                id,
                deletedAt,
            };

            updates[`outlets/${id}`] = null;
        });

        if (Object.keys(updates).length) {
            await update(ref(db), updates);
        }
    }, []);

    // ==========================================
    // PULIHKAN OUTLET
    // ==========================================
    const restoreOutlet = useCallback(async (id) => {
        if (id == null) {
            throw new Error('ID outlet tidak ditemukan.');
        }

        const snapshot = await get(ref(db, `deletedOutlets/${id}`));

        if (!snapshot.exists()) {
            throw new Error(
                'Data outlet yang akan dipulihkan tidak ditemukan.'
            );
        }

        const outlet = snapshot.val();
        const { deletedAt, ...restoredOutlet } = outlet;

        await update(ref(db), {
            [`outlets/${id}`]: {
                ...restoredOutlet,
                id,
            },
            [`deletedOutlets/${id}`]: null,
        });
    }, []);

    // ==========================================
    // HAPUS PERMANEN SATU OUTLET
    // ==========================================
    const permanentlyDeleteOutlet = useCallback(async (id) => {
        if (id == null) {
            throw new Error('ID outlet tidak ditemukan.');
        }

        await remove(ref(db, `deletedOutlets/${id}`));
    }, []);

    // ==========================================
    // HAPUS PERMANEN SEMUA OUTLET TERHAPUS
    // ==========================================
    const clearDeletedOutlets = useCallback(async () => {
        await remove(ref(db, 'deletedOutlets'));
    }, []);

    // ==========================================
    // UPDATE WARNA FRONTLINER
    // ==========================================
    const updateCustomColor = useCallback(async (frontliner, color) => {
        if (!frontliner) {
            throw new Error('Nama frontliner tidak valid.');
        }

        const colorRef = ref(db, `customColors/${frontliner}`);

        if (color == null) {
            await remove(colorRef);
        } else {
            await set(colorRef, color);
        }
    }, []);

    // ==========================================
    // AMBIL OUTLET BERDASARKAN FRONTLINER
    // ==========================================
    const getOutletsByFrontliner = useCallback(async (frontliner) => {
        if (!frontliner) {
            return [];
        }

        const outletQuery = query(
            ref(db, 'outlets'),
            orderByChild('frontliner'),
            equalTo(frontliner)
        );

        const snapshot = await get(outletQuery);
        const data = snapshot.val() || {};

        return Object.entries(data).map(([key, value]) => ({
            ...value,
            id: value?.id ?? key,
        }));
    }, []);

    // ==========================================
    // BARU: SIMPAN / UPDATE JADWAL KUNJUNGAN MD
    //
    // schedule minimal berisi:
    // {
    //   id, date, frontliner, outlets, status
    // }
    //
    // status: draft / final
    // ==========================================
    const saveVisitSchedule = useCallback(async (schedule) => {
        if (!schedule || typeof schedule !== 'object') {
            throw new Error('Data jadwal tidak valid.');
        }

        if (!schedule.date) {
            throw new Error('Tanggal kunjungan wajib diisi.');
        }

        if (!schedule.frontliner) {
            throw new Error('Nama MD wajib dipilih.');
        }

        if (!Array.isArray(schedule.outlets)) {
            throw new Error('Daftar outlet harus berupa array.');
        }

        const status = schedule.status || 'draft';

        if (!['draft', 'final'].includes(status)) {
            throw new Error('Status jadwal tidak valid.');
        }

        // Validasi target saat finalisasi.
        if (status === 'final' && schedule.outlets.length !== 13) {
            throw new Error(
                'Jadwal final wajib berisi tepat 13 outlet.'
            );
        }

        const now = new Date().toISOString();

        const scheduleData = {
            ...schedule,
            status,
            updatedAt: now,
        };

        // Update jadwal yang sudah tersimpan.
        if (schedule.id) {
            const scheduleRef = ref(
                db,
                `visitSchedules/${schedule.id}`
            );

            const existingSnapshot = await get(scheduleRef);
            const existingData = existingSnapshot.val() || {};

            const dataToSave = {
                ...existingData,
                ...scheduleData,
                id: schedule.id,
                createdAt: existingData.createdAt
                    || schedule.createdAt
                    || now,
                updatedAt: now,
            };

            await set(scheduleRef, dataToSave);

            return schedule.id;
        }

        // Buat jadwal baru dengan Firebase push key.
        const newScheduleRef = push(ref(db, 'visitSchedules'));

        const dataToSave = {
            ...scheduleData,
            id: newScheduleRef.key,
            createdAt: schedule.createdAt || now,
            updatedAt: now,
        };

        await set(newScheduleRef, dataToSave);

        return newScheduleRef.key;
    }, []);

    // ==========================================
    // BARU: HAPUS JADWAL KUNJUNGAN
    // ==========================================
    const deleteVisitSchedule = useCallback(async (id) => {
        if (!id) {
            throw new Error('ID jadwal tidak ditemukan.');
        }

        await remove(ref(db, `visitSchedules/${id}`));
    }, []);

    // ==========================================
    // BARU: AMBIL SATU JADWAL BERDASARKAN ID
    // ==========================================
    const getVisitScheduleById = useCallback(async (id) => {
        if (!id) {
            return null;
        }

        const snapshot = await get(
            ref(db, `visitSchedules/${id}`)
        );

        if (!snapshot.exists()) {
            return null;
        }

        return {
            ...snapshot.val(),
            id: snapshot.val()?.id ?? id,
        };
    }, []);

    // ==========================================
    // DAFTAR FRONTLINER
    // ==========================================
    const frontliners = useMemo(
        () => [
            ...new Set(
                outlets
                    .map((outlet) => outlet?.frontliner)
                    .filter(Boolean)
            ),
        ].sort((a, b) =>
            String(a).localeCompare(String(b))
        ),
        [outlets]
    );

    // ==========================================
    // CONTEXT VALUE
    // ==========================================
    const value = useMemo(() => ({
        // Data utama
        outlets,
        deletedOutlets,
        frontliners,
        customColors,

        // Jadwal kunjungan MD
        visitSchedules,
        saveVisitSchedule,
        deleteVisitSchedule,
        getVisitScheduleById,

        // Fungsi outlet
        addOutlets,
        updateOutlet,
        updateOutlets,
        removeOutlet,
        clearAll,
        restoreOutlet,
        permanentlyDeleteOutlet,
        clearDeletedOutlets,

        // Fungsi tambahan
        updateCustomColor,
        getOutletsByFrontliner,
    }), [
        outlets,
        deletedOutlets,
        frontliners,
        customColors,
        visitSchedules,
        addOutlets,
        updateOutlet,
        updateOutlets,
        removeOutlet,
        clearAll,
        restoreOutlet,
        permanentlyDeleteOutlet,
        clearDeletedOutlets,
        updateCustomColor,
        getOutletsByFrontliner,
        saveVisitSchedule,
        deleteVisitSchedule,
        getVisitScheduleById,
    ]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);

    if (!context) {
        throw new Error('useData harus di dalam DataProvider');
    }

    return context;
};
