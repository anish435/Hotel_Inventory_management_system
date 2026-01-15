"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { X, Plus, Package } from "lucide-react";
import { useStore } from "@/context/StoreContext";

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
    const { addInventoryItem } = useStore();
    const [name, setName] = useState("");
    const [volume, setVolume] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !volume || !price || !stock) return;

        addInventoryItem({
            name,
            volume,
            price: parseFloat(price),
            stock: parseInt(stock)
        });

        // Reset and close
        setName("");
        setVolume("");
        setPrice("");
        setStock("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                        <Package className="h-4 w-4 text-indigo-400" />
                        Add New Item
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
                        <X className="h-4 w-4 text-zinc-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-400">Drink Name</label>
                        <Input placeholder="e.g. Coca Cola" value={name} onChange={e => setName(e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-zinc-400">Volume</label>
                        <Input placeholder="e.g. 500ml" value={volume} onChange={e => setVolume(e.target.value)} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-400">Price (₹)</label>
                            <Input type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} required min="0" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-400">Initial Stock</label>
                            <Input type="number" placeholder="0" value={stock} onChange={e => setStock(e.target.value)} required min="0" />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
                        <Button type="submit" className="flex-1">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                        </Button>
                    </div>
                </form>

            </div>
        </div>
    );
}
