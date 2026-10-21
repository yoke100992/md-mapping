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
  
  // ✅ State untuk Jadwal Kunjungan
  const [visitSchedules, setVisitSchedules] = useState([]);

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

  // ✅ Listener untuk Visit Schedules
  useEffect(() => {
    const unsubscribe = onValue(ref(db, 'visitSchedules'), (snapshot) => {
      const data = snapshot.val() || {};
      const schedulesArray = Object.entries(data).map(([key, value]) => ({
        ...value,
        id: value?.id ?? key,
      }));
      setVisitSchedules(schedulesArray);
    }, (error) => console.error('Gagal membaca visit schedules:', error));
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

  const updateCustomColor = useCallback(async (frontliner, color) => {
    if (!frontliner) throw new Error('Nama frontliner tidak valid.');
    const colorRef = ref(db, `customColors/${frontliner}`);
    if (color == null) await remove(colorRef);
    else await set(colorRef, color);
  }, []);

  // ✅ Simpan Jadwal Kunjungan (Baru atau Update)
  const saveVisitSchedule = useCallback(async (scheduleData) => {
    const { id, date, frontliner, outlets: scheduleOutlets, status, totalOutlets, rtgCount } = scheduleData;
    const payload = {
      date,
      frontliner,
      outlets: scheduleOutlets,
      status,
      totalOutlets,
      rtgCount,
      updatedAt: new Date().toISOString(),
    };

    if (id) {
      await update(ref(db, `visitSchedules/${id}`), payload);
    } else {
      payload.createdAt = new Date().toISOString();
      const newScheduleRef = push(ref(db, 'visitSchedules'));
      await set(newScheduleRef, { ...payload, id: newScheduleRef.key });
    }
  }, []);

  // ✅ Hapus Jadwal Kunjungan
  const deleteVisitSchedule = useCallback(async (id) => {
    if (!id) throw new Error('ID jadwal tidak ditemukan.');
    await remove(ref(db, `visitSchedules/${id}`));
  }, []);

  const frontliners = useMemo(
    () => [...new Set(outlets.map((outlet) => outlet?.frontliner).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b))),
    [outlets]
  );

  const value = useMemo(() => ({
    outlets,
    deletedOutlets,
    frontliners,
    customColors,
    visitSchedules,
    addOutlets,
    updateOutlet,
    removeOutlet,
    updateCustomColor,
    saveVisitSchedule,
    deleteVisitSchedule,
  }), [
    outlets, deletedOutlets, frontliners, customColors, visitSchedules,
    addOutlets, updateOutlet, removeOutlet, updateCustomColor, saveVisitSchedule, deleteVisitSchedule,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData harus di dalam DataProvider');
  return context;
};