"use client";

import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Trash2, UserPlus, Shield } from "lucide-react";
import { X } from "lucide-react";
import { Staff, StaffRole } from "@/types";

interface StaffManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function StaffManagementModal({ isOpen, onClose }: StaffManagementModalProps) {
    const { staff, addStaff, removeStaff } = useStore();
    const [newName, setNewName] = useState("");
    const [newRole, setNewRole] = useState<StaffRole>('bellboy');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName) return;
        setIsLoading(true);
        await addStaff({ name: newName, role: newRole });
        setNewName("");
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 w-full max-w-lg rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-zinc-800">

                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                    <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-indigo-400" />
                        Staff Management
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
                        <X className="h-5 w-5 text-zinc-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Add Staff Form */}
                    <form onSubmit={handleAdd} className="flex gap-3 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs text-zinc-400 font-medium ml-1">Name</label>
                            <Input
                                placeholder="Staff Name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="w-32 space-y-2">
                            <label className="text-xs text-zinc-400 font-medium ml-1">Role</label>
                            <select
                                className="w-full h-10 px-3 rounded-md border border-zinc-800 bg-zinc-950 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value as StaffRole)}
                            >
                                <option value="bellboy">Bellboy</option>
                                <option value="front_office">Front Office</option>
                                <option value="admin">Admin Type</option>
                            </select>
                        </div>
                        <Button type="submit" isLoading={isLoading} disabled={!newName}>
                            <UserPlus className="h-4 w-4" />
                        </Button>
                    </form>

                    {/* Staff List */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Current Staff</h4>
                        {staff.length === 0 && <p className="text-zinc-600 text-sm italic">No staff members found.</p>}

                        {staff.map((s) => (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                        {s.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-200">{s.name}</p>
                                        <p className="text-xs text-zinc-500 capitalize">{s.role.replace('_', ' ')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeStaff(s.id)}
                                    className="p-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                </div>

            </div>
        </div>
    );
}
