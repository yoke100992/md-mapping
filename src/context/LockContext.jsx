import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ref, onValue, set, get } from 'firebase/database';
import { db } from '../firebase';

const LockContext = createContext(null);

// Daftar semua page yang tersedia untuk di-lock
export const AVAILABLE_PAGES = [
    { id: 'dashboard', label: 'Dashboard', path: '/' },
    { id: 'outlets', label: 'Kelola Outlet', path: '/outlets' },
    { id: 'upload', label: 'Upload Data', path: '/upload' },
    { id: 'edit', label: 'Edit Data', path: '/edit' },
    { id: 'map', label: 'View Map', path: '/map' },
    { id: 'trec-upload', label: 'Upload TREC', path: '/trec-upload' },
    { id: 'monitoring', label: 'Monitoring Kunjungan', path: '/monitoring' },
    { id: 'template', label: 'Download Template', path: '/template' },
{ id: 'trec-monitoring', label: 'TREC Monitoring', path: '/trec-monitoring' },
    { id: 'settings', label: 'Lock Settings', path: '/settings' },
];

// Hash sederhana untuk password (bukan untuk security tinggi, cukup untuk proteksi UI)
const simpleHash = (str) => {
    if (!str) return '';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `h_${Math.abs(hash).toString(36)}_${str.length}`;
};

const SESSION_KEY = 'md_lock_session';
const SESSION_TTL = 30 * 60 * 1000; // 30 menit

export const LockProvider = ({ children }) => {
    const [lockConfig, setLockConfig] = useState({
        passwordHash: '',
        lockedPages: [],
    });
    const [loading, setLoading] = useState(true);
    const [unlockedPages, setUnlockedPages] = useState(() => {
        try {
            const saved = localStorage.getItem(SESSION_KEY);
            if (!saved) return new Set();
            const parsed = JSON.parse(saved);
            // Cek apakah session masih valid (belum expired)
            if (Date.now() - parsed.timestamp < SESSION_TTL) {
                return new Set(parsed.pages || []);
            }
            localStorage.removeItem(SESSION_KEY);
            return new Set();
        } catch {
            return new Set();
        }
    });

    // Load config dari Firebase
    useEffect(() => {
        const lockRef = ref(db, 'settings/lockConfig');
        const unsubscribe = onValue(lockRef, (snapshot) => {
            const data = snapshot.val() || {};
            setLockConfig({
                passwordHash: data.passwordHash || '',
                lockedPages: data.lockedPages || [],
            });
            setLoading(false);
        }, (error) => {
            console.error('Gagal membaca lock config:', error);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Simpan session ke localStorage
    const saveSession = useCallback((pages) => {
        const data = {
            pages: Array.from(pages),
            timestamp: Date.now(),
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    }, []);

    const isPageLocked = useCallback((pageId) => {
        return lockConfig.lockedPages.includes(pageId);
    }, [lockConfig.lockedPages]);

    const isUnlocked = useCallback((pageId) => {
        return unlockedPages.has(pageId);
    }, [unlockedPages]);

    const unlockPage = useCallback((pageId) => {
        setUnlockedPages((prev) => {
            const next = new Set(prev);
            next.add(pageId);
            saveSession(next);
            return next;
        });
    }, [saveSession]);

    const lockPage = useCallback((pageId) => {
        setUnlockedPages((prev) => {
            const next = new Set(prev);
            next.delete(pageId);
            saveSession(next);
            return next;
        });
    }, [saveSession]);

    const verifyPassword = useCallback((password) => {
        if (!lockConfig.passwordHash) return true; // Belum ada password
        return simpleHash(password) === lockConfig.passwordHash;
    }, [lockConfig.passwordHash]);

    const setPassword = useCallback(async (newPassword) => {
        const hash = simpleHash(newPassword);
        await set(ref(db, 'settings/lockConfig/passwordHash'), hash);
    }, []);

    const removePassword = useCallback(async () => {
        await set(ref(db, 'settings/lockConfig/passwordHash'), '');
    }, []);

    const setLockedPages = useCallback(async (pages) => {
        await set(ref(db, 'settings/lockConfig/lockedPages'), pages);
    }, []);

    const value = {
        lockConfig,
        loading,
        unlockedPages,
        isPageLocked,
        isUnlocked,
        unlockPage,
        lockPage,
        verifyPassword,
        setPassword,
        removePassword,
        setLockedPages,
        AVAILABLE_PAGES,
    };

    return <LockContext.Provider value={value}>{children}</LockContext.Provider>;
};

export const useLock = () => {
    const context = useContext(LockContext);
    if (!context) throw new Error('useLock harus di dalam LockProvider');
    return context;
};
