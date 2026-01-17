"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, Package, Menu, X, ChevronRight, UserCircle, Users, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { UserProfileModal } from '../pos/UserProfileModal';
import { StaffManagementModal } from '../pos/StaffManagementModal';

export function Sidebar() {
    const pathname = usePathname();
    const { currentUser } = useStore();
    const { theme, toggleTheme } = useTheme();
    const [isExpanded, setIsExpanded] = useState(false);

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isStaffOpen, setIsStaffOpen] = useState(false);

    const navItems = [
        { label: 'Room Grid', icon: Home, href: '/' },
        { label: 'Sales History', icon: History, href: '/history' },
        { label: 'Inventory', icon: Package, href: '/inventory' },
    ];

    return (
        <>
            {/* Backdrop for mobile/tablet expansion */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-in fade-in"
                    onClick={() => setIsExpanded(false)}
                />
            )}

            <div
                className={cn(
                    "fixed left-0 top-0 bottom-0 z-50 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col transition-all duration-300 ease-in-out",
                    isExpanded ? "w-64" : "w-20 lg:w-64"
                )}
            >
                {/* Header / Logo Area */}
                <div className="h-20 flex items-center px-4 mb-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={cn(
                            "p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors lg:hidden",
                            isExpanded ? "hidden" : "block mx-auto"
                        )}
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className={cn(
                        "flex items-center gap-3 w-full",
                        isExpanded ? "flex" : "hidden lg:flex"
                    )}>
                        <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                            V
                        </div>
                        <div className="overflow-hidden whitespace-nowrap">
                            <h1 className="font-bold text-zinc-800 dark:text-zinc-100 text-lg">Vaishnavi Inn</h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">POS & Billing</p>
                        </div>

                        <button
                            onClick={() => setIsExpanded(false)}
                            className="ml-auto p-1 text-zinc-500 lg:hidden"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsExpanded(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden whitespace-nowrap",
                                    isActive
                                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-6 w-6 flex-shrink-0 transition-colors duration-200",
                                    isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
                                )} />

                                <span className={cn(
                                    "transition-opacity duration-200",
                                    isExpanded ? "opacity-100" : "opacity-0 lg:opacity-100 hidden lg:block"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Admin Section */}
                    {currentUser?.role === 'admin' && (
                        <>
                            <div className={cn("pt-4 pb-2", isExpanded ? "px-3" : "hidden lg:block px-3")}>
                                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Admin</p>
                            </div>
                            <button
                                onClick={() => { setIsStaffOpen(true); setIsExpanded(false); }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden whitespace-nowrap text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                )}
                            >
                                <Users className="h-6 w-6 flex-shrink-0 text-zinc-500 group-hover:text-zinc-300" />
                                <span className={cn(
                                    "transition-opacity duration-200",
                                    isExpanded ? "opacity-100" : "opacity-0 lg:opacity-100 hidden lg:block"
                                )}>
                                    Staff Management
                                </span>
                            </button>
                        </>
                    )}
                </nav>

                {/* Footer User Profile */}
                <div className="p-3 mt-auto border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                    <button
                        onClick={toggleTheme}
                        className={cn(
                            "w-full flex items-center gap-3 rounded-xl p-2 transition-all duration-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100",
                            isExpanded ? "justify-start" : "justify-center lg:justify-start"
                        )}
                    >
                        <div className="h-10 w-10 flex items-center justify-center shrink-0">
                            {theme === 'dark' ? <Sun className="h-6 w-6 text-amber-500" /> : <Moon className="h-6 w-6 text-indigo-500" />}
                        </div>
                        <span className={cn(
                            "text-sm font-medium transition-all duration-200",
                            isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 lg:w-auto lg:opacity-100"
                        )}>
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </span>
                    </button>
                    <button
                        onClick={() => setIsProfileOpen(true)}
                        className={cn(
                            "w-full flex items-center gap-3 rounded-xl p-2 transition-all duration-300 hover:bg-zinc-100 dark:hover:bg-zinc-900",
                            isExpanded ? "justify-start" : "justify-center lg:justify-start"
                        )}
                    >
                        <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                            {currentUser ? (
                                <span className="font-bold text-indigo-400">{currentUser.username.substring(0, 1).toUpperCase()}</span>
                            ) : (
                                <UserCircle className="h-6 w-6 text-zinc-400" />
                            )}
                        </div>

                        <div className={cn(
                            "text-left overflow-hidden transition-all duration-200",
                            isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 lg:w-auto lg:opacity-100"
                        )}>
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
                                {currentUser ? currentUser.username : "Guest"}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">
                                {currentUser ? currentUser.role : "Login"}
                            </p>
                        </div>
                    </button>
                </div>
            </div>

            <UserProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />

            <StaffManagementModal
                isOpen={isStaffOpen}
                onClose={() => setIsStaffOpen(false)}
            />
        </>
    );
}
