"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, Package, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { label: 'Room Grid', icon: Home, href: '/' },
    { label: 'Sales History', icon: History, href: '/history' },
    { label: 'Inventory', icon: Package, href: '/inventory' },
    // { label: 'Reports', icon: PieChart, href: '/reports' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 border-r border-zinc-800 bg-zinc-950 p-4 flex flex-col h-full fixed left-0 top-0 z-50">
            <div className="mb-8 px-2 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">V</div>
                <div>
                    <h1 className="font-bold text-zinc-100">Vaishnavi Inn</h1>
                    <p className="text-xs text-zinc-400">POS & Billing</p>
                </div>
            </div>

            <nav className="space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-indigo-500/10 text-indigo-400"
                                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto">
                <div className="rounded-xl bg-zinc-900/50 p-4 border border-zinc-800">
                    <p className="text-xs text-zinc-500">System Status</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-medium text-emerald-400">Online & Syncing</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
