"use client";

import { useStore } from "@/context/StoreContext";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { History, Search, ArrowDownLeft, ArrowUpRight, Download, Trash2, FileSpreadsheet, Calendar, User } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import * as XLSX from 'xlsx';
import { AdminAuthModal } from "@/components/pos/AdminAuthModal";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subWeeks, startOfWeek, endOfWeek, subMonths, eachMonthOfInterval, isSameMonth, subYears, getYear } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useTheme } from "@/context/ThemeContext";

export default function HistoryPage() {
    const { theme } = useTheme();
    const { salesHistory, deleteSale } = useStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'monthly' | 'analytics'>('analytics');
    const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

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
            "Items Summary": sale.items.map(i => `${i.drinkName} (${i.quantity}) [Served By: ${i.bellboyName || 'N/A'}]`).join(', '),
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

    // Monthly Grouping Logic
    const monthlyStats = salesHistory.reduce((acc, sale) => {
        const monthKey = format(new Date(sale.timestamp), 'MMMM yyyy'); // e.g., "January 2024"
        if (!acc[monthKey]) {
            acc[monthKey] = {
                month: monthKey,
                totalSales: 0,
                cashTotal: 0,
                upiTotal: 0,
                count: 0,
                sales: []
            };
        }
        acc[monthKey].totalSales += sale.totalAmount;
        if (sale.paymentMode === 'cash') acc[monthKey].cashTotal += sale.totalAmount;
        if (sale.paymentMode === 'upi') acc[monthKey].upiTotal += sale.totalAmount;
        acc[monthKey].count += 1;
        acc[monthKey].sales.push(sale);
        return acc;
    }, {} as Record<string, any>);

    const sortedMonths = Object.keys(monthlyStats).sort((a, b) => {
        // Sort specifically by date logic or just simplistic logic
        return new Date(monthlyStats[b].sales[0].timestamp).getTime() - new Date(monthlyStats[a].sales[0].timestamp).getTime();
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-white tracking-tight">Sales History</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">View transaction logs and financial reports</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <button
                            onClick={() => setViewMode('analytics')}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                viewMode === 'analytics' ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            Analytics
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                viewMode === 'list' ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            Transactions
                        </button>
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                viewMode === 'monthly' ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            Reports
                        </button>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Search sales..."
                            className="pl-9 bg-white dark:bg-zinc-900"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="secondary" onClick={handleExport}>
                        <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-500" />
                        Export
                    </Button>
                </div>
            </div>

            {viewMode === 'list' && (
                <div className="space-y-4">
                    {filteredHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900/20">
                            <History className="h-12 w-12 mb-4 opacity-20" />
                            <p>No sales records found</p>
                        </div>
                    ) : (
                        filteredHistory.map((sale) => (
                            <Card key={sale.id} className="p-4 bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                                    {/* Left: Icon & Type */}
                                    <div className="flex items-center gap-4 w-full md:w-1/4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center",
                                            sale.type === 'room' ? "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400" : "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                                        )}>
                                            {sale.type === 'room' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">
                                                {sale.type === 'room' ? `Room ${sale.roomNumber}` : 'Walk-in Sale'}
                                            </h4>
                                            <span className="text-xs text-zinc-500 font-mono">#{sale.id.slice(0, 8)}</span>
                                        </div>
                                    </div>

                                    {/* Middle: Items Summary */}
                                    <div className="flex-1 px-0 md:px-4">
                                        <div className="flex flex-wrap gap-2">
                                            {sale.items.map((i, idx) => (
                                                <Badge key={idx} variant="neutral" className="gap-1.5 font-normal">
                                                    <span>{i.quantity}x {i.drinkName}</span>
                                                    {i.bellboyName && (
                                                        <span className="flex items-center text-xs text-indigo-500 dark:text-indigo-400 border-l border-zinc-300 dark:border-zinc-700 pl-1.5 ml-1">
                                                            <User className="h-3 w-3 mr-1" />
                                                            {i.bellboyName}
                                                        </span>
                                                    )}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right: Amount & Date & Delete */}
                                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                        <div className="text-right">
                                            <p className="font-bold text-zinc-900 dark:text-white">{formatCurrency(sale.totalAmount)}</p>
                                            <p className="text-xs text-zinc-500 capitalize">{sale.paymentMode}</p>
                                        </div>
                                        <div className="text-right min-w-[100px]">
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(sale.timestamp)}</p>
                                        </div>
                                        <button
                                            onClick={() => initiateDelete(sale.id)}
                                            className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all md:opacity-0 md:group-hover:opacity-100"
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
            )}

            {viewMode === 'monthly' && (
                <div className="space-y-6">
                    {sortedMonths.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">No data available for reports</div>
                    ) : (
                        sortedMonths.map(month => {
                            const data = monthlyStats[month];
                            return (
                                <div key={month} className="space-y-3">
                                    <h3 className="text-lg font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        {month}
                                    </h3>

                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-500/20">
                                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Total Sales</p>
                                            <h2 className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{formatCurrency(data.totalSales)}</h2>
                                            <p className="text-xs text-indigo-600/60 dark:text-indigo-400/60 mt-2">{data.count} transactions</p>
                                        </Card>

                                        <Card className="p-6 bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Cash Collection</p>
                                                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{formatCurrency(data.cashTotal)}</h3>
                                                </div>
                                                <div className="h-10 w-10 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                                    <BanknoteIcon />
                                                </div>
                                            </div>
                                        </Card>

                                        <Card className="p-6 bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">UPI Collection</p>
                                                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{formatCurrency(data.upiTotal)}</h3>
                                                </div>
                                                <div className="h-10 w-10 text-blue-500 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
                                                    <CreditCardIcon />
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {viewMode === 'analytics' && (
                <AnalyticsSection
                    data={salesHistory}
                    timeframe={timeframe}
                    setTimeframe={setTimeframe}
                    theme={theme}
                />
            )}

            <AdminAuthModal
                isOpen={isAdminOpen}
                onClose={() => setIsAdminOpen(false)}
                onSuccess={handleAdminSuccess}
                actionTitle="Delete Sale Record"
            />
        </div>
    );
}

// Simple Icons to avoid larger imports
function BanknoteIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
    )
}

const AnalyticsSection = ({ data, timeframe, setTimeframe, theme }: any) => {
    // Process Data based on timeframe
    const chartData = (() => {
        const today = new Date();
        let processed = [];

        if (timeframe === 'daily') {
            // Last 30 days
            const start = subDays(today, 30);
            const days = eachDayOfInterval({ start, end: today });
            processed = days.map(day => {
                const daySales = data.filter((s: any) => isSameDay(new Date(s.timestamp), day));
                return {
                    name: format(day, 'dd MMM'),
                    total: daySales.reduce((sum: number, s: any) => sum + s.totalAmount, 0),
                    cash: daySales.filter((s: any) => s.paymentMode === 'cash').reduce((sum: number, s: any) => sum + s.totalAmount, 0),
                    upi: daySales.filter((s: any) => s.paymentMode === 'upi').reduce((sum: number, s: any) => sum + s.totalAmount, 0),
                    count: daySales.length
                };
            });
        } else if (timeframe === 'monthly') {
            // Last 12 months
            const start = subMonths(today, 11);
            const months = eachMonthOfInterval({ start, end: today });
            processed = months.map(month => {
                const monthSales = data.filter((s: any) => isSameMonth(new Date(s.timestamp), month));
                return {
                    name: format(month, 'MMM yyyy'),
                    total: monthSales.reduce((sum: number, s: any) => sum + s.totalAmount, 0),
                    cash: monthSales.filter((s: any) => s.paymentMode === 'cash').reduce((sum: number, s: any) => sum + s.totalAmount, 0),
                    upi: monthSales.filter((s: any) => s.paymentMode === 'upi').reduce((sum: number, s: any) => sum + s.totalAmount, 0),
                    count: monthSales.length
                };
            });
        }
        else if (timeframe === 'yearly') {
            // Last 5 years
            const years = [0, 1, 2, 3, 4].map(n => getYear(subYears(today, n))).reverse();
            processed = years.map(year => {
                const yearSales = data.filter((s: any) => getYear(new Date(s.timestamp)) === year);
                return {
                    name: year.toString(),
                    total: yearSales.reduce((sum: number, s: any) => sum + s.totalAmount, 0),
                    cash: yearSales.filter((s: any) => s.paymentMode === 'cash').reduce((sum: number, s: any) => sum + s.totalAmount, 0),
                    upi: yearSales.filter((s: any) => s.paymentMode === 'upi').reduce((sum: number, s: any) => sum + s.totalAmount, 0),
                    count: yearSales.length
                };
            });
        }
        // Fallback for weekly or others if needed
        else {
            // weekly logic simplified to last 7 days for now to avoid complexity without date-fns/week
            // Actually let's just show last 7 days as default "weekly" view or group by week
            // Let's stick to daily (30d) and monthly (12m) as primary.
            // If user selected weekly, we can show last 8 weeks.
            const start = subWeeks(today, 8);
            // We'd need to group by week. simplified:
            processed = []; // ... implementation skipped for brevity, falling back to daily logic
            const days = eachDayOfInterval({ start, end: today });
            processed = days.map(day => {
                const daySales = data.filter((s: any) => isSameDay(new Date(s.timestamp), day));
                return {
                    name: format(day, 'dd MMM'),
                    total: daySales.reduce((sum: number, s: any) => sum + s.totalAmount, 0),
                    cash: daySales.filter((s: any) => s.paymentMode === 'cash').reduce((sum: number, s: any) => sum + s.totalAmount, 0),
                    upi: daySales.filter((s: any) => s.paymentMode === 'upi').reduce((sum: number, s: any) => sum + s.totalAmount, 0),
                    count: daySales.length
                };
            });
        }
        return processed;
    })();

    const isDark = theme === 'dark';
    const gridColor = isDark ? "#27272a" : "#e4e4e7"; // zinc-800 : zinc-200
    const textColor = isDark ? "#a1a1aa" : "#71717a"; // zinc-400 : zinc-500

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Controls */}
            <div className="flex justify-end">
                <div className="inline-flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    {['daily', 'monthly', 'yearly'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all",
                                timeframe === t ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Trend Chart */}
            <Card className="p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Sales Trend</h3>
                    <p className="text-sm text-zinc-500">Revenue over time</p>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke={textColor}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                stroke={textColor}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `₹${value}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', borderColor: gridColor, borderRadius: '8px' }}
                                itemStyle={{ color: isDark ? '#fff' : '#000' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Split Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Payment Methods</h3>
                        <p className="text-sm text-zinc-500">Cash vs UPI Comparison</p>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke={textColor}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                />
                                <YAxis
                                    stroke={textColor}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `₹${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: isDark ? '#27272a' : '#f4f4f5' }}
                                    contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', borderColor: gridColor, borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar dataKey="cash" name="Cash" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="upi" name="UPI" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Transaction Volume</h3>
                        <p className="text-sm text-zinc-500">Number of daily orders</p>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke={textColor}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                />
                                <YAxis
                                    stroke={textColor}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: isDark ? '#27272a' : '#f4f4f5' }}
                                    contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', borderColor: gridColor, borderRadius: '8px' }}
                                />
                                <Bar dataKey="count" name="Orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};

function CreditCardIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
    )
}

