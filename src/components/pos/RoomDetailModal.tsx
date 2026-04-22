"use client";

import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/utils";
import { DrinkSelector } from "./DrinkSelector";
import { Button } from "../ui/Button";
import { X, Trash2, CreditCard, Banknote, ShoppingCart, User, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { PaymentMode } from "@/types";
import { BellboySelector } from "./BellboySelector";
import { AdminAuthModal } from "./AdminAuthModal";
import { ShiftRoomModal } from "./ShiftRoomModal";
import { BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

interface RoomDetailModalProps {
    roomNumber: string;
    isOpen: boolean;
    onClose: () => void;
}

export function RoomDetailModal({ roomNumber, isOpen, onClose }: RoomDetailModalProps) {
    const { rooms, addToRoom, removeFromRoom, checkoutRoom, updateRoomGuestName, currentUser } = useStore();
    const room = rooms.find(r => r.number === roomNumber);
    const [checkoutStep, setCheckoutStep] = useState<'view' | 'payment'>('view');
    const [selectedBellboy, setSelectedBellboy] = useState<string>("");
    const [adminAuthOpen, setAdminAuthOpen] = useState(false);
    const [itemToRemove, setItemToRemove] = useState<number | null>(null);
    const [localGuestName, setLocalGuestName] = useState<string>("");
    const [amountPaidInput, setAmountPaidInput] = useState<string>("");
    const [shiftModalOpen, setShiftModalOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (room) {
            setLocalGuestName(room.guestName || "");
        }
    }, [room?.guestName, room?.number]);

    const handleGuestNameBlur = () => {
        if (room && localGuestName !== (room.guestName || "")) {
            updateRoomGuestName(roomNumber, localGuestName);
        }
    };

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
        const parsedAmount = parseFloat(amountPaidInput);
        let finalAmount = isNaN(parsedAmount) ? totalAmount : parsedAmount;
        if (mode === 'credit') finalAmount = 0;
        checkoutRoom(roomNumber, mode, finalAmount);
        setCheckoutStep('view');
        onClose();

        if (mode === 'credit' || finalAmount < totalAmount) {
            router.push('/credits');
        }
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
                    <div className="p-4 md:p-6 border-b border-zinc-800 bg-zinc-900/50 space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                                    Room {roomNumber}
                                </h2>
                                <p className={room.status === 'occupied' ? "text-amber-400 text-xs md:text-sm mt-1" : "text-emerald-400 text-xs md:text-sm mt-1"}>
                                    {room.status === 'occupied' ? 'Occupied - Order Active' : 'Vacant - Ready for Order'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {room.status === 'occupied' && (
                                    <button 
                                        onClick={() => setShiftModalOpen(true)}
                                        className="text-xs md:text-sm bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-colors"
                                    >
                                        Shift Guest
                                    </button>
                                )}
                                {/* Mobile Close Button */}
                                <button onClick={onClose} className="md:hidden p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                                    <X className="h-5 w-5 text-zinc-400" />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="text"
                                placeholder="Guest Name (Optional)"
                                value={localGuestName}
                                onChange={(e) => setLocalGuestName(e.target.value)}
                                onBlur={handleGuestNameBlur}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm"
                            />
                        </div>
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
                                            {item.timestamps && item.timestamps.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {item.timestamps.map((t, i) => (
                                                        <span key={i} className="text-[10px] text-zinc-400 bg-black/40 border border-zinc-800/50 px-1.5 py-0.5 rounded">
                                                            {new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
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
                                onClick={() => {
                                    setAmountPaidInput(totalAmount.toString());
                                    setCheckoutStep('payment');
                                }}
                            >
                                Checkout & Clear
                            </Button>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-zinc-500 mb-1 block">Amount Paid (Partial Payment creates Credit)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
                                        <input
                                            type="number"
                                            value={amountPaidInput}
                                            onChange={(e) => setAmountPaidInput(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50"
                                        />
                                    </div>
                                    {parseFloat(amountPaidInput) < totalAmount && (
                                        <p className="text-amber-500 text-xs mt-2 font-medium">
                                            Will create a credit of {formatCurrency(totalAmount - parseFloat(amountPaidInput))}
                                        </p>
                                    )}
                                </div>
                                <p className="text-sm text-center text-zinc-400 mb-2">Select Payment Method</p>
                                <div className="grid grid-cols-3 gap-3">
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
                                        className="h-12 flex flex-col items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                                        onClick={() => handleCheckout('upi')}
                                    >
                                        <CreditCard className="h-4 w-4" />
                                        <span>UPI</span>
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="h-12 flex flex-col items-center gap-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20"
                                        onClick={() => handleCheckout('credit')}
                                    >
                                        <BookOpen className="h-4 w-4" />
                                        <span>Credit</span>
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

                <ShiftRoomModal 
                    isOpen={shiftModalOpen} 
                    onClose={() => {
                        setShiftModalOpen(false);
                        onClose(); // Close the room detail modal as the room is now vacant
                    }} 
                    sourceRoomId={roomNumber} 
                />
            </div>
        </div>
    );
}
