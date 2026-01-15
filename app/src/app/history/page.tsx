"use client";

import { useStore } from "@/context/StoreContext";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { History, Search, ArrowDownLeft, ArrowUpRight, Download, Trash2, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import * as XLSX from 'xlsx';
import { AdminAuthModal } from "@/components/pos/AdminAuthModal";

export default function HistoryPage() {
    const { salesHistory, deleteSale } = useStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const filteredHistory = salesHistory.filter(sale => {
        const searchString = searchTerm.toLowerCase();
        const typeMatch = sale.type.toLowerCase().includes(searchString);
        const roomMatch = sale.roomNumber?.toLowerCase().includes(searchString);
        const dateMatch = formatDate(sale.timestamp).toLowerCase().includes(searchString);
        return typeMatch || roomMatch || dateMatch;
    });

    const handleExport = () => {
        const data = filteredHistory.map(sale => ({
            "Sale ID": sale.id,
            "Date": new Date(sale.timestamp).toLocaleString(),
            "Type": sale.type,
            "Room Number": sale.roomNumber || "Walk-In",
            "Items Summary": sale.items.map(i => `${i.drinkName} (${i.quantity})`).join(', '),
            "Total Amount": sale.totalAmount,
            "Payment Mode": sale.paymentMode
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sales History");
        XLSX.writeFile(workbook, `Sales_History_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const initiateDelete = (id: string) => {
        setPendingDeleteId(id);
        setIsAdminOpen(true);
    };

    const handleAdminSuccess = () => {
        if (pendingDeleteId) {
            deleteSale(pendingDeleteId);
            setPendingDeleteId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white tracking-tight">Sales History</h1>

                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Search sales..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="secondary" onClick={handleExport}>
                        <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-500" />
                        Export Excel
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                        <History className="h-12 w-12 mb-4 opacity-20" />
                        <p>No sales records found</p>
                    </div>
                ) : (
                    filteredHistory.map((sale) => (
                        <Card key={sale.id} className="p-4 bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/60 transition-colors group">
                            <div className="flex items-center justify-between">

                                {/* Left: Icon & Type */}
                                <div className="flex items-center gap-4 w-1/4">
                                    <div className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center",
                                        sale.type === 'room' ? "bg-indigo-500/10 text-indigo-400" : "bg-emerald-500/10 text-emerald-400"
                                    )}>
                                        {sale.type === 'room' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-zinc-200">
                                            {sale.type === 'room' ? `Room ${sale.roomNumber}` : 'Walk-in Sale'}
                                        </h4>
                                        <span className="text-xs text-zinc-500 font-mono">#{sale.id.slice(0, 8)}</span>
                                    </div>
                                </div>

                                {/* Middle: Items Summary */}
                                <div className="flex-1 px-4">
                                    <p className="text-sm text-zinc-400 line-clamp-1">
                                        {sale.items.map(i => `${i.quantity}x ${i.drinkName}`).join(', ')}
                                    </p>
                                    <p className="text-xs text-zinc-600 mt-1">
                                        {sale.items.length} Items Total
                                    </p>
                                </div>

                                {/* Right: Amount & Date & Delete */}
                                <div className="flex items-center gap-6 w-auto justify-end">
                                    <div className="text-right">
                                        <p className="font-bold text-white">{formatCurrency(sale.totalAmount)}</p>
                                        <p className="text-xs text-zinc-500 capitalize">{sale.paymentMode}</p>
                                    </div>
                                    <div className="text-right min-w-[120px]">
                                        <p className="text-xs text-zinc-400">{formatDate(sale.timestamp)}</p>
                                    </div>
                                    <button
                                        onClick={() => initiateDelete(sale.id)}
                                        className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete Record (Admin)"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
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
                actionTitle="Delete Sale Record"
            />
        </div>
    );
}
