"use client";

import { useStore } from "@/context/StoreContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency, cn } from "@/lib/utils";
import { useState } from "react";
import { Plus, Package, AlertTriangle, Edit2 } from "lucide-react";
import { AdminAuthModal } from "@/components/pos/AdminAuthModal";
import { AddItemModal } from "@/components/pos/AddItemModal";

export default function InventoryPage() {
    const { inventory, restockInventory, updateDrinkPrice } = useStore();
    const [restockAmounts, setRestockAmounts] = useState<Record<string, string>>({});

    // Admin & Modal State
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [isAddItemOpen, setIsAddItemOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'restock' | 'add_item' | 'edit_price', payload?: any } | null>(null);

    // Edit Price State
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [tempPrice, setTempPrice] = useState("");

    const initiateAction = (type: 'restock' | 'add_item' | 'edit_price', payload?: any) => {
        setPendingAction({ type, payload });
        setIsAdminOpen(true);
    };

    const handleAdminSuccess = () => {
        if (!pendingAction) return;

        if (pendingAction.type === 'add_item') {
            setIsAddItemOpen(true);
        } else if (pendingAction.type === 'restock') {
            const { id, amount } = pendingAction.payload;
            restockInventory(id, amount);
            setRestockAmounts(prev => ({ ...prev, [id]: '' }));
        } else if (pendingAction.type === 'edit_price') {
            const { id } = pendingAction.payload;
            const item = inventory.find(i => i.id === id);
            if (item) {
                setEditingPriceId(id);
                setTempPrice(item.price.toString());
            }
        }

        setPendingAction(null);
    };

    const handleSavePrice = (id: string) => {
        if (!tempPrice) return;
        updateDrinkPrice(id, parseFloat(tempPrice));
        setEditingPriceId(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Inventory Management</h1>
                    <p className="text-zinc-400 text-sm mt-1">Manage stock levels and menu items</p>
                </div>
                <Button onClick={() => initiateAction('add_item')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Item
                </Button>
            </div>

            <div className="grid gap-6">
                {inventory.map((item) => {
                    const isLowStock = item.stock < 10;
                    const restockVal = restockAmounts[item.id] || '';
                    const isEditing = editingPriceId === item.id;

                    return (
                        <Card key={item.id} className="overflow-hidden bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 transition-colors">
                            <div className="flex flex-col md:flex-row items-center p-6 gap-6">

                                {/* Icon & Info */}
                                <div className="flex items-center gap-4 flex-1 w-full">
                                    <div className={cn(
                                        "h-12 w-12 rounded-xl flex items-center justify-center",
                                        isLowStock ? "bg-amber-500/10 text-amber-500" : "bg-zinc-800 text-zinc-400"
                                    )}>
                                        {isLowStock ? <AlertTriangle className="h-6 w-6" /> : <Package className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-zinc-100">{item.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-zinc-500 text-sm">{item.volume} •</span>

                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        className="h-6 w-20 text-xs bg-zinc-950"
                                                        type="number"
                                                        value={tempPrice}
                                                        onChange={e => setTempPrice(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <Button size="sm" className="h-6 px-2 text-xs" onClick={() => handleSavePrice(item.id)}>Save</Button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => initiateAction('edit_price', { id: item.id })}
                                                    className="group flex items-center gap-1 text-sm text-zinc-400 hover:text-indigo-400 transition-colors"
                                                >
                                                    {formatCurrency(item.price)}
                                                    <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Stock Level */}
                                <div className="flex flex-col items-center justify-center w-32 border-x border-zinc-800 px-6">
                                    <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1">Stock</span>
                                    <span className={cn("text-3xl font-bold", isLowStock ? "text-amber-500" : "text-white")}>
                                        {item.stock}
                                    </span>
                                </div>

                                {/* Restock Action */}
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <Input
                                        type="number"
                                        placeholder="Qty"
                                        className="w-24 bg-zinc-950 border-zinc-800 focus:border-indigo-500"
                                        value={restockVal}
                                        onChange={(e) => setRestockAmounts(prev => ({ ...prev, [item.id]: e.target.value }))}
                                    />
                                    <Button
                                        variant="secondary"
                                        disabled={!restockVal || parseInt(restockVal) <= 0}
                                        onClick={() => initiateAction('restock', { id: item.id, amount: parseInt(restockVal) })}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Restock
                                    </Button>
                                </div>

                            </div>

                            {/* Progress Bar for Visual Stock */}
                            <div className="h-1 bg-zinc-900 w-full">
                                <div
                                    className={cn("h-full transition-all duration-500", isLowStock ? "bg-amber-500" : "bg-emerald-500")}
                                    style={{ width: `${Math.min(item.stock, 100)}%` }} // Assuming 100 is "full" for visual
                                />
                            </div>
                        </Card>
                    );
                })}
            </div>

            <AdminAuthModal
                isOpen={isAdminOpen}
                onClose={() => setIsAdminOpen(false)}
                onSuccess={handleAdminSuccess}
                actionTitle={pendingAction?.type === 'add_item' ? 'Add New Item' : pendingAction?.type === 'edit_price' ? 'Edit Price' : 'Restock Inventory'}
            />

            <AddItemModal
                isOpen={isAddItemOpen}
                onClose={() => setIsAddItemOpen(false)}
            />
        </div>
    );
}
