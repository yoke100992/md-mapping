import React, { useEffect, useState } from 'react';
import { useLock } from '../context/LockContext';
import PasswordPrompt from './PasswordPrompt';

const ProtectedRoute = ({ pageId, children }) => {
    const { isPageLocked, isUnlocked, unlockPage, verifyPassword, AVAILABLE_PAGES } = useLock();
    const [showPrompt, setShowPrompt] = useState(false);

    const pageLabel = AVAILABLE_PAGES.find((p) => p.id === pageId)?.label || pageId;
    const locked = isPageLocked(pageId);
    const unlocked = isUnlocked(pageId);

    useEffect(() => {
        // Jika page di-lock DAN belum di-unlock di sesi ini, tampilkan prompt
        if (locked && !unlocked) {
            setShowPrompt(true);
        } else {
            setShowPrompt(false);
        }
    }, [locked, unlocked]);

    const handleVerify = async (password) => {
        const valid = verifyPassword(password);
        if (valid) {
            unlockPage(pageId);
            return true;
        }
        return false;
    };

    const handleClose = () => {
        // Jika user menutup prompt tanpa unlock, biarkan showPrompt tetap true
        // (page tidak akan dirender)
    };

    // Jika tidak di-lock, atau sudah di-unlock, tampilkan konten
    if (!locked || unlocked) {
        return <>{children}</>;
    }

    // Jika di-lock tapi belum unlock, tampilkan prompt + block konten
    return (
        <>
            <PasswordPrompt
                open={showPrompt}
                pageLabel={pageLabel}
                onVerify={handleVerify}
                onClose={handleClose}
            />
        </>
    );
};

export default ProtectedRoute;