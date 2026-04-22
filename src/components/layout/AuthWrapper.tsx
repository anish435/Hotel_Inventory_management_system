'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import LoginPage from '@/components/auth/LoginPage';
import { Sidebar } from '@/components/layout/Sidebar';

const AUTHORIZED_EMAILS = [
    "vaishnaviinnrjy@gmail.com",
    "anishkotikalapudi1@gmail.com",
    "sailendra94@gmail.com"
];

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                if (currentUser.email && AUTHORIZED_EMAILS.includes(currentUser.email)) {
                    setUser(currentUser);
                } else {
                    await signOut(auth);
                    localStorage.setItem('authError', 'Access denied. Unauthorized account.');
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
                <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white text-3xl shadow-lg shadow-blue-500/20 mb-6 animate-pulse">V</div>
                <div className="h-6 w-6 border-2 border-zinc-500 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    return (
        <>
            <Sidebar />
            <main className="pl-20 lg:pl-64 min-h-screen transition-all duration-300">
                <div className="container mx-auto p-4 md:p-8 max-w-[1600px]">
                    {children}
                </div>
            </main>
        </>
    );
}
