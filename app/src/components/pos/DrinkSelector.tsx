"use client";

import { useStore } from "@/context/StoreContext";
import { cn, formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";

interface DrinkSelectorProps {
    onSelect: (drinkId: string) => void;
}

export function DrinkSelector({ onSelect }: DrinkSelectorProps) {
    const { inventory } = useStore();

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {inventory.map((item) => {
                const hasStock = item.stock > 0;
                return (
                    <button
                        key={item.id}
                        onClick={() => hasStock && onSelect(item.id)}
                        disabled={!hasStock}
                        className={cn(
                            "relative flex flex-col items-start p-4 rounded-xl border transition-all text-left",
                            hasStock
                                ? "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-indigo-500/50 active:scale-[0.98]"
                                : "bg-zinc-900/30 border-zinc-800 opacity-50 cursor-not-allowed"
                        )}
                    >
                        <div className="flex w-full justify-between items-start mb-2">
                            <div className="font-semibold text-zinc-100">{item.name}</div>
                            <span className="text-xs font-mono bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400">
                                {item.volume}
                            </span>
                        </div>

                        <div className="mt-auto flex w-full justify-between items-end">
                            <div className="text-indigo-400 font-bold">
                                {formatCurrency(item.price)}
                            </div>
                            <div className={cn("text-xs", item.stock < 10 ? "text-amber-500" : "text-zinc-500")}>
                                {item.stock} left
                            </div>
                        </div>

                        {hasStock && (
                            <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                                <Plus className="h-4 w-4 text-indigo-400" />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
