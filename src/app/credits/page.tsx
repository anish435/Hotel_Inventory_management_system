"use client";

import { useStore } from "@/context/StoreContext";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { BookOpen, CheckCircle, Clock, Trash2, Search, ArrowUpRight, User, BedDouble, Banknote, CreditCard } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { AdminAuthModal } from "@/components/pos/AdminAuthModal";
import { Badge } from "@/components/ui/Badge";

export default function CreditsPage() {
    const { credits, settleCredit, deleteCredit, currentUser } = useStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<'pending' | 'settled' | 'all'>('pending');
    
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const pendingCredits = credits.filter(c => c.status === 'pending');
    const settledCredits = credits.filter(c => c.status === 'settled');

    const totalPending = pendingCredits.reduce((sum, c) => sum + c.amount, 0);
    const totalSettled = settledCredits.reduce((sum, c) => sum + c.amount, 0);

    const filteredCredits = credits.filter(credit => {
        if (viewMode === 'pending' && credit.status !== 'pending') return false;
        if (viewMode === 'settled' && credit.status !== 'settled') return false;
        
        const searchString = searchTerm.toLowerCase();
        const nameMatch = credit.customerName.toLowerCase().includes(searchString);
        const roomMatch = credit.roomNumber?.toLowerCase().includes(searchString);
        return nameMatch || roomMatch;
    });

    const initiateDelete = (id: string) => {
        if (currentUser?.role === 'admin') {
            deleteCredit(id);
        } else {
            setPendingDeleteId(id);
            setIsAdminOpen(true);
        }
    };

    const handleAdminSuccess = () => {
        if (pendingDeleteId) {
            deleteCredit(pendingDeleteId);
            setPendingDeleteId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-zinc-800 dark:text-white tracking-tight flex items-center gap-2">
                    <BookOpen className="h-8 w-8 text-amber-500" />
                    Credit Ledger
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Track outstanding guest credits</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 bg-zinc-900 border-amber-500/30 border shadow-lg relative overflow-hidden group">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                        <Clock className="h-32 w-32 text-amber-500" />
                    </div>
                    <p className="text-sm font-medium text-amber-500 mb-1">Total Pending</p>
                    <h2 className="text-4xl font-bold text-amber-400">{formatCurrency(totalPending)}</h2>
                    <p className="text-xs text-amber-500/60 mt-2">{pendingCredits.length} unsettled</p>
                </Card>

                <Card className="p-6 bg-zinc-900 border-emerald-500/30 border shadow-lg relative overflow-hidden group">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                        <CheckCircle className="h-32 w-32 text-emerald-500" />
                    </div>
                    <p className="text-sm font-medium text-emerald-500 mb-1">Total Settled</p>
                    <h2 className="text-4xl font-bold text-emerald-400">{formatCurrency(totalSettled)}</h2>
                    <p className="text-xs text-emerald-500/60 mt-2">{settledCredits.length} settled</p>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div className="flex gap-6">
                    <button
                        onClick={() => setViewMode('pending')}
                        className={cn(
                            "text-sm font-medium pb-4 -mb-4 border-b-2 transition-colors",
                            viewMode === 'pending' ? "border-amber-500 text-amber-500" : "border-transparent text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setViewMode('settled')}
                        className={cn(
                            "text-sm font-medium pb-4 -mb-4 border-b-2 transition-colors",
                            viewMode === 'settled' ? "border-zinc-300 text-zinc-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        Settled
                    </button>
                    <button
                        onClick={() => setViewMode('all')}
                        className={cn(
                            "text-sm font-medium pb-4 -mb-4 border-b-2 transition-colors",
                            viewMode === 'all' ? "border-zinc-300 text-zinc-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        All
                    </button>
                </div>
                
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search credits..."
                        className="pl-9 bg-zinc-900 border-zinc-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-4">
                {filteredCredits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                        <BookOpen className="h-12 w-12 mb-4 opacity-20" />
                        <p>No {viewMode !== 'all' ? viewMode : ''} credit records found</p>
                    </div>
                ) : (
                    filteredCredits.map((credit) => (
                        <Card key={credit.id} className="p-4 bg-zinc-950 border-zinc-800 shadow-md">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 text-zinc-300">
                                        <User className="h-4 w-4 text-amber-500" />
                                        <h4 className="font-bold">{credit.customerName}</h4>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                                        {credit.roomNumber && (
                                            <div className="flex items-center gap-1.5">
                                                <BedDouble className="h-3.5 w-3.5" />
                                                Room {credit.roomNumber}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" />
                                            {formatDate(credit.createdAt)}
                                        </div>
                                    </div>
                                    {credit.items && credit.items.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {credit.items.map((item, idx) => (
                                                <div key={idx} className="bg-zinc-900/50 border border-zinc-800/50 text-zinc-400 text-[11px] px-2 py-1 rounded flex items-center">
                                                    {item.drinkName} x {item.quantity}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-800">
                                    <p className={cn("font-bold text-2xl mr-2", credit.status === 'pending' ? "text-amber-400" : "text-emerald-400")}>
                                        {formatCurrency(credit.amount)}
                                    </p>

                                    {credit.status === 'pending' ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => settleCredit(credit.id, 'cash')}
                                                className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
                                            >
                                                <Banknote className="h-4 w-4" />
                                                Cash
                                            </button>
                                            <button
                                                onClick={() => settleCredit(credit.id, 'upi')}
                                                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 border border-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm transition-colors shadow-lg shadow-indigo-500/20"
                                            >
                                                <CreditCard className="h-4 w-4" />
                                                UPI
                                            </button>
                                            <button
                                                onClick={() => initiateDelete(credit.id)}
                                                className="p-1.5 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all ml-2"
                                                title="Delete Record (Admin)"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <Badge variant="success" className="uppercase text-[10px] tracking-wider font-semibold">
                                                {credit.paymentMode || 'Settled'}
                                            </Badge>
                                            <button
                                                onClick={() => initiateDelete(credit.id)}
                                                className="p-1.5 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all"
                                                title="Delete Record (Admin)"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <AdminAuthModal
                isOpen={isAdminOpen}
                onClose={() => setIsAdminOpen(false)}
                onSuccess={handleAdminSuccess}
                actionTitle="Delete Credit Record"
            />
        </div>
    );
}
