"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { X, Lock, Eye, EyeOff } from "lucide-react";
import { generateId } from "@/lib/utils";

interface AdminAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    actionTitle: string;
}

// Simple hash for "admin123" -> 21232f297a57a5a743894a0e4a801fc3
const ADMIN_HASH = "21232f297a57a5a743894a0e4a801fc3";

// Simple insecure hash for demo purposes to avoid crypto.subtle issues in non-secure contexts
function simpleHash(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

export function AdminAuthModal({ isOpen, onClose, onSuccess, actionTitle }: AdminAuthModalProps) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // For this local POS demo, we will use a simple check
            // Default password is 'admin'

            // If you want to change password, you can store it in localStorage
            // But for now, let's hardcode the check for stability across environments
            const defaultPass = 'admin';

            if (password === defaultPass) {
                onSuccess();
                onClose();
                setPassword("");
            } else {
                setError("Incorrect password");
            }
        } catch (err) {
            console.error(err);
            setError("Authentication failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-sm rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-indigo-400" />
                        Admin Authorization
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
                        <X className="h-4 w-4 text-zinc-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-zinc-400">
                        Enter admin password to <b>{actionTitle}</b>.
                    </p>

                    <div className="space-y-2">
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pr-10"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {error && <p className="text-xs text-rose-500">{error}</p>}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isLoading} className="flex-1">
                            Verify
                        </Button>
                    </div>
                </form>

            </div>
        </div>
    );
}
