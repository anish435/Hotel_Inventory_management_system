"use client";

import { useStore } from "@/context/StoreContext";
import { Button } from "../ui/Button";
import { X, User, LogOut } from "lucide-react";

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
    const { currentUser, logout } = useStore();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-sm rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-400" />
                        User Profile
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
                        <X className="h-4 w-4 text-zinc-400" />
                    </button>
                </div>

                <div className="p-6">
                    {currentUser ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-3xl font-bold text-indigo-400">
                                    {currentUser.username.substring(0, 1).toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                    <h4 className="text-xl font-bold text-white truncate">{currentUser.username}</h4>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 capitalize mt-1">
                                        {currentUser.role}
                                    </span>
                                </div>
                            </div>

                            <Button variant="ghost" className="w-full text-zinc-500 hover:text-rose-500 mt-2" onClick={() => { onClose(); logout(); }}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-zinc-500">No active session.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
