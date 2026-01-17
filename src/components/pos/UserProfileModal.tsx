"use client";

import { useStore } from "@/context/StoreContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { X, User, LogOut, Sun, Moon, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
    const { currentUser, login, logout, changePassword } = useStore();
    const { theme, toggleTheme } = useTheme();

    const [password, setPassword] = useState("");
    const [view, setView] = useState<'info' | 'change_pass' | 'login'>('info'); // 'info' is default if logged in

    // Login State
    const [loginPass, setLoginPass] = useState("");
    const [loginError, setLoginError] = useState("");

    // Change Password State
    const [oldPass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [passError, setPassError] = useState("");
    const [passSuccess, setPassSuccess] = useState("");

    if (!isOpen) return null;

    // Derived Logic: if not logged in, default to login view
    const renderView = !currentUser ? 'login' : view;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError("");
        const success = await login(loginPass);
        if (success) {
            setLoginPass("");
            onClose(); // Close on success or stay to show profile? Close is cleaner.
        } else {
            setLoginError("Invalid password");
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassError("");
        setPassSuccess("");

        if (newPass !== confirmPass) {
            setPassError("New passwords do not match");
            return;
        }

        const res = await changePassword(oldPass, newPass);
        if (res.success) {
            setPassSuccess("Password updated successfully");
            setTimeout(() => {
                setOldPass("");
                setNewPass("");
                setConfirmPass("");
                setView('info');
            }, 1000);
        } else {
            setPassError(res.error || "Failed");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-sm rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-400" />
                        {currentUser ? 'User Profile' : 'Login'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
                        <X className="h-4 w-4 text-zinc-400" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Logged Out / Login View */}
                    {renderView === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="text-center mb-4">
                                <div className="h-16 w-16 bg-zinc-800 rounded-full mx-auto flex items-center justify-center mb-3">
                                    <Lock className="h-8 w-8 text-zinc-500" />
                                </div>
                                <h4 className="text-lg font-medium text-white">System Access</h4>
                                <p className="text-sm text-zinc-400">Enter password to continue</p>
                            </div>

                            <Input
                                type="password"
                                placeholder="Details..."
                                value={loginPass}
                                onChange={e => setLoginPass(e.target.value)}
                                autoFocus
                            />
                            {loginError && <p className="text-xs text-rose-500">{loginError}</p>}

                            <Button className="w-full">Sign In</Button>
                        </form>
                    )}

                    {/* Logged In Info View */}
                    {renderView === 'info' && currentUser && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-3xl font-bold text-indigo-400">
                                    {currentUser.username.substring(0, 1).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-white">{currentUser.username}</h4>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 capitalize">
                                        {currentUser.role}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setView('change_pass')}
                                    className="flex w-full items-center justify-center gap-3 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-300"
                                >
                                    <Lock className="h-5 w-5 text-zinc-400" />
                                    <span className="text-sm font-medium">Change Password</span>
                                </button>
                            </div>

                            <Button variant="ghost" className="w-full text-zinc-500 hover:text-rose-500 mt-2" onClick={logout}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    )}

                    {/* Change Password View */}
                    {renderView === 'change_pass' && (
                        <ChangePasswordForm
                            oldPass={oldPass} setOldPass={setOldPass}
                            newPass={newPass} setNewPass={setNewPass}
                            confirmPass={confirmPass} setConfirmPass={setConfirmPass}
                            onSubmit={handleChangePassword}
                            onBack={() => setView('info')}
                            error={passError}
                            success={passSuccess}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

function ChangePasswordForm({ oldPass, setOldPass, newPass, setNewPass, confirmPass, setConfirmPass, onSubmit, onBack, error, success }: any) {
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <h4 className="font-medium text-zinc-900 dark:text-white mb-2">Change Password</h4>
            <div className="space-y-3">
                <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400">Old Password</label>
                    <div className="relative">
                        <Input
                            type={showOld ? "text" : "password"}
                            value={oldPass}
                            onChange={e => setOldPass(e.target.value)}
                            className="pr-10"
                        />
                        <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                            {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400">New Password</label>
                    <div className="relative">
                        <Input
                            type={showNew ? "text" : "password"}
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            className="pr-10"
                        />
                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400">Confirm Password</label>
                    <div className="relative">
                        <Input
                            type={showConfirm ? "text" : "password"}
                            value={confirmPass}
                            onChange={e => setConfirmPass(e.target.value)}
                            className="pr-10"
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {error && <p className="text-xs text-rose-500">{error}</p>}
            {success && <p className="text-xs text-emerald-500">{success}</p>}

            <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={onBack}>Back</Button>
                <Button type="submit" className="flex-1">Update</Button>
            </div>
        </form>
    );
}
