"use client";

import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/utils";
import { DrinkSelector } from "./DrinkSelector";
import { Button } from "../ui/Button";
import { X, Trash2, CreditCard, Banknote, ShoppingCart, UserPlus } from "lucide-react";
import { useState } from "react";
import { OrderItem, PaymentMode } from "@/types";
import { AdminAuthModal } from "./AdminAuthModal";

interface WalkInModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WalkInModal({ isOpen, onClose }: WalkInModalProps) {
    const { processOutsideSale, inventory, currentUser } = useStore();
    const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
    const [checkoutStep, setCheckoutStep] = useState<'view' | 'payment'>('view');
    const [adminAuthOpen, setAdminAuthOpen] = useState(false);
    const [itemToRemove, setItemToRemove] = useState<string | null>(null);

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

    const initiateRemoveItem = (drinkId: string) => {
        // If user is admin, assume they can remove without extra prompt (or do we always prompt? Usually logged-in admin is enough)
        // User request: "add a feature to remove the item with admin authentication"
        // Let's assume if CURRENT user works as admin, they proceed. 
        // IF NOT, they need to authenticate as admin.

        if (currentUser?.role === 'admin') {
            performRemove(drinkId);
        } else {
            setItemToRemove(drinkId);
            setAdminAuthOpen(true);
        }
    };

    const performRemove = (drinkId: string) => {
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

    const handleAdminSuccess = () => {
        if (itemToRemove) {
            performRemove(itemToRemove);
            setItemToRemove(null);
            setAdminAuthOpen(false);
        }
    };

    const handleCheckout = async (mode: PaymentMode) => {
        try {
            const result = await processOutsideSale(currentOrder, mode);

            if (result && result.success) {
                // 1. Reset Internal State
                setCurrentOrder([]);
                setCheckoutStep('view');

                // 2. Close Modal
                onClose();
            } else {
                alert((result && result.error) || "Transaction failed. Please try again.");
            }
        } catch (e) {
            console.error("Checkout Execution Error:", e);
            alert("System error during checkout.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border-0 md:border border-zinc-800 w-full md:max-w-4xl h-full md:h-[600px] md:rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* Left Side: Order Details */}
                <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-950/80 h-[60%] md:h-full order-1 md:order-1">
                    <div className="p-4 md:p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                                <UserPlus className="h-5 w-5 md:h-6 md:w-6 text-indigo-400" />
                                Walk-in Sale
                            </h2>
                            <p className="text-zinc-400 text-xs md:text-sm">Direct billing (No Room)</p>
                        </div>
                        <button onClick={onClose} className="md:hidden p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                            <X className="h-5 w-5 text-zinc-400" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
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
                                                onClick={() => initiateRemoveItem(item.drinkId)}
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

                    <div className="p-4 md:p-6 bg-zinc-900/50 border-t border-zinc-800 mt-auto">
                        <div className="flex justify-between items-center mb-4 md:mb-6">
                            <span className="text-zinc-400">Total Due</span>
                            <span className="text-2xl md:text-3xl font-bold text-emerald-400">{formatCurrency(totalAmount)}</span>
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
                <div className="w-full md:w-1/2 flex flex-col bg-zinc-900/30 h-[40%] md:h-full order-2 md:order-2 border-t md:border-t-0 border-zinc-800">
                    <div className="p-4 md:p-6 border-b border-zinc-800 flex justify-between items-center">
                        <h3 className="font-semibold text-zinc-300">Select Items</h3>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors hidden md:block">
                            <X className="h-5 w-5 text-zinc-400" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                        <DrinkSelector onSelect={handleAddItem} />
                    </div>
                </div>

            </div>

            <AdminAuthModal
                isOpen={adminAuthOpen}
                onClose={() => { setAdminAuthOpen(false); setItemToRemove(null); }}
                onSuccess={handleAdminSuccess}
                actionTitle="Authorize Item Removal"
            />
        </div>
    );
}