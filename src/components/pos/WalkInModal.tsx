"use client";

import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/utils";
import { DrinkSelector } from "./DrinkSelector";
import { Button } from "../ui/Button";
import { X, Trash2, CreditCard, Banknote, ShoppingCart, UserPlus } from "lucide-react";
import { useState } from "react";
import { OrderItem, PaymentMode } from "@/types";

interface WalkInModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WalkInModal({ isOpen, onClose }: WalkInModalProps) {
    const { processOutsideSale, inventory } = useStore();
    const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
    const [checkoutStep, setCheckoutStep] = useState<'view' | 'payment'>('view');

    if (!isOpen) return null;

    const totalAmount = currentOrder.reduce((sum, item) => sum + item.total, 0);

    const handleAddItem = (drinkId: string) => {
        const drink = inventory.find(d => d.id === drinkId);
        if (!drink) return;

        setCurrentOrder(prev => {
            const existing = prev.find(p => p.drinkId === drinkId);
            if (existing) {
                return prev.map(p =>
                    p.drinkId === drinkId
                        ? { ...p, quantity: p.quantity + 1, total: (p.quantity + 1) * p.price }
                        : p
                );
            }
            return [...prev, {
                drinkId,
                drinkName: drink.name + ' ' + drink.volume,
                price: drink.price,
                quantity: 1,
                total: drink.price
            }];
        });
    };

    const handleRemoveItem = (drinkId: string) => {
        setCurrentOrder(prev => {
            const existing = prev.find(p => p.drinkId === drinkId);
            if (!existing) return prev;

            if (existing.quantity > 1) {
                return prev.map(p =>
                    p.drinkId === drinkId
                        ? { ...p, quantity: p.quantity - 1, total: (p.quantity - 1) * p.price }
                        : p
                );
            }
            return prev.filter(p => p.drinkId !== drinkId);
        });
    };

    const handleCheckout = (mode: PaymentMode) => {
        const result = processOutsideSale(currentOrder, mode);
        if (result.success) {
            setCurrentOrder([]);
            setCheckoutStep('view');
            onClose();
        } else {
            alert(result.error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-4xl h-[600px] rounded-2xl flex overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* Left Side: Order Details */}
                <div className="w-1/2 flex flex-col border-r border-zinc-800 bg-zinc-950/80">
                    <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <UserPlus className="h-6 w-6 text-indigo-400" />
                                Walk-in Sale
                            </h2>
                            <p className="text-zinc-400 text-sm">Direct billing (No Room)</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {currentOrder.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                                <ShoppingCart className="h-12 w-12 opacity-20" />
                                <p>Add items from the menu</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {currentOrder.map((item, idx) => (
                                    <div key={`${item.drinkId}-${idx}`} className="flex items-center justify-between bg-zinc-800/30 p-3 rounded-lg border border-zinc-800">
                                        <div>
                                            <div className="font-medium text-zinc-200">{item.drinkName}</div>
                                            <div className="text-xs text-zinc-500">
                                                {item.quantity} x {formatCurrency(item.price)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="font-bold text-zinc-200">{formatCurrency(item.total)}</div>
                                            <button
                                                onClick={() => handleRemoveItem(item.drinkId)}
                                                className="p-2 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-500 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-zinc-900/50 border-t border-zinc-800">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-zinc-400">Total Due</span>
                            <span className="text-3xl font-bold text-emerald-400">{formatCurrency(totalAmount)}</span>
                        </div>

                        {checkoutStep === 'view' ? (
                            <Button
                                className="w-full h-12 text-lg"
                                disabled={currentOrder.length === 0}
                                onClick={() => setCheckoutStep('payment')}
                            >
                                Proceed to Pay
                            </Button>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-center text-zinc-400 mb-2">Select Payment Method</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="secondary"
                                        className="h-12 flex flex-col items-center gap-1"
                                        onClick={() => handleCheckout('cash')}
                                    >
                                        <Banknote className="h-4 w-4" />
                                        <span>Cash</span>
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="h-12 flex flex-col items-center gap-1"
                                        onClick={() => handleCheckout('upi')}
                                    >
                                        <CreditCard className="h-4 w-4" />
                                        <span>UPI</span>
                                    </Button>
                                </div>
                                <Button
                                    variant="ghost"
                                    className="w-full text-zinc-500 hover:text-zinc-300"
                                    onClick={() => setCheckoutStep('view')}
                                >
                                    Back
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Menu Selector */}
                <div className="w-1/2 flex flex-col bg-zinc-900/30">
                    <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                        <h3 className="font-semibold text-zinc-300">Select Items</h3>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                            <X className="h-5 w-5 text-zinc-400" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <DrinkSelector onSelect={handleAddItem} />
                    </div>
                </div>

            </div>
        </div>
    );
}
