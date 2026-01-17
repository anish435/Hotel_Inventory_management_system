"use client";

import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/utils";
import { DrinkSelector } from "./DrinkSelector";
import { Button } from "../ui/Button";
import { X, Trash2, CreditCard, Banknote, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { PaymentMode } from "@/types";
import { BellboySelector } from "./BellboySelector";
import { AdminAuthModal } from "./AdminAuthModal";

interface RoomDetailModalProps {
    roomNumber: string;
    isOpen: boolean;
    onClose: () => void;
}

export function RoomDetailModal({ roomNumber, isOpen, onClose }: RoomDetailModalProps) {
    const { rooms, addToRoom, removeFromRoom, checkoutRoom, currentUser } = useStore();
    const room = rooms.find(r => r.number === roomNumber);
    const [checkoutStep, setCheckoutStep] = useState<'view' | 'payment'>('view');
    const [selectedBellboy, setSelectedBellboy] = useState<string>("");
    const [adminAuthOpen, setAdminAuthOpen] = useState(false);
    const [itemToRemove, setItemToRemove] = useState<number | null>(null);

    if (!isOpen || !room) return null;

    const totalAmount = room.currentOrders.reduce((sum, item) => sum + item.total, 0);

    const handleHandleAdd = (drinkId: string) => {
        // We allow adding without bellboy, or we can enforce it.
        // Requirement: "Selected bellboy name must be Saved with the room sale".
        // It implies we should have one. But maybe "None" is okay?
        // Let's assume generic "Staff" if none selected?
        // StoreContext handles undefined bellboyId gracefully.
        addToRoom(roomNumber, drinkId, 1, selectedBellboy);
    };

    const handleCheckout = (mode: PaymentMode) => {
        checkoutRoom(roomNumber, mode);
        setCheckoutStep('view');
        onClose();
    };

    const initiateRemoveItem = (index: number) => {
        // User request: "add a feature to remove the item with admin authentication"
        if (currentUser?.role === 'admin') {
            removeFromRoom(roomNumber, index);
        } else {
            setItemToRemove(index);
            setAdminAuthOpen(true);
        }
    };

    const handleAdminSuccess = () => {
        if (itemToRemove !== null) {
            removeFromRoom(roomNumber, itemToRemove);
            setItemToRemove(null);
            setAdminAuthOpen(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border-0 md:border border-zinc-800 w-full md:max-w-4xl h-full md:h-[600px] md:rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* Left Side: Order Details */}
                <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-zinc-800 h-[60%] md:h-full order-1 md:order-1">
                    <div className="p-4 md:p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-white">Room {roomNumber}</h2>
                            <p className={room.status === 'occupied' ? "text-amber-400 text-xs md:text-sm" : "text-emerald-400 text-xs md:text-sm"}>
                                {room.status === 'occupied' ? 'Occupied - Order Active' : 'Vacant - Ready for Order'}
                            </p>
                        </div>
                        {/* Mobile Close Button */}
                        <button onClick={onClose} className="md:hidden p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                            <X className="h-5 w-5 text-zinc-400" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                        {room.currentOrders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                                <ShoppingCart className="h-12 w-12 opacity-20" />
                                <p>No items added yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {room.currentOrders.map((item, idx) => (
                                    <div key={`${item.drinkId}-${idx}`} className="flex items-center justify-between bg-zinc-800/30 p-3 rounded-lg border border-zinc-800">
                                        <div>
                                            <div className="font-medium text-zinc-200">{item.drinkName}</div>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                <span>{item.quantity} x {formatCurrency(item.price)}</span>
                                                {item.bellboyName && (
                                                    <span className="flex items-center text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded-full">
                                                        <User className="h-3 w-3 mr-1" />
                                                        {item.bellboyName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="font-bold text-zinc-200">{formatCurrency(item.total)}</div>
                                            <button
                                                onClick={() => initiateRemoveItem(idx)}
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
                            <span className="text-zinc-400">Total Bill</span>
                            <span className="text-2xl md:text-3xl font-bold text-white">{formatCurrency(totalAmount)}</span>
                        </div>

                        {checkoutStep === 'view' ? (
                            <Button
                                className="w-full h-12 text-lg"
                                disabled={room.currentOrders.length === 0}
                                onClick={() => setCheckoutStep('payment')}
                            >
                                Checkout & Clear
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
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Menu Selector */}
                <div className="w-full md:w-1/2 flex flex-col bg-zinc-900/30 h-[40%] md:h-full order-2 md:order-2 border-t md:border-t-0 border-zinc-800">
                    <div className="p-4 md:p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                        <h3 className="font-semibold text-zinc-300">Menu</h3>
                        <div className="flex items-center gap-3">
                            <div className="w-48">
                                <BellboySelector value={selectedBellboy} onChange={setSelectedBellboy} />
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors hidden md:block">
                                <X className="h-5 w-5 text-zinc-400" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-zinc-950/30">
                        {!selectedBellboy && (
                            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2 text-amber-500 text-xs">
                                <User className="h-4 w-4" />
                                Please select a Bellboy before adding items (Optional)
                            </div>
                        )}
                        <DrinkSelector onSelect={handleHandleAdd} />
                    </div>
                </div>


                <AdminAuthModal
                    isOpen={adminAuthOpen}
                    onClose={() => { setAdminAuthOpen(false); setItemToRemove(null); }}
                    onSuccess={handleAdminSuccess}
                    actionTitle="Authorize Item Removal"
                />
            </div>
        </div>
    );
}
