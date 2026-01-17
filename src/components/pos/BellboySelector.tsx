"use client";

import { useStore } from "@/context/StoreContext";
import { UserCircle } from "lucide-react";

interface BellboySelectorProps {
    value?: string;
    onChange: (id: string) => void;
}

export function BellboySelector({ value, onChange }: BellboySelectorProps) {
    const { staff } = useStore();
    const bellboys = staff.filter(s => s.role === 'bellboy');

    return (
        <div className="flex items-center gap-2 bg-zinc-800/50 p-2 rounded-lg border border-zinc-800">
            <UserCircle className="h-5 w-5 text-zinc-400" />
            <select
                className="bg-transparent border-none text-sm text-zinc-200 focus:outline-none w-full cursor-pointer"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="" className="bg-zinc-900 text-zinc-500">Scanning for Bellboy...</option>
                {bellboys.length === 0 && <option value="" disabled>No Bellboys Found</option>}
                {bellboys.map(b => (
                    <option key={b.id} value={b.id} className="bg-zinc-900 text-zinc-200">
                        {b.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
