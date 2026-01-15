"use client";

import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RoomDetailModal } from "@/components/pos/RoomDetailModal";
import { WalkInModal } from "@/components/pos/WalkInModal";
import { formatCurrency, cn } from "@/lib/utils";
import { UserPlus, IndianRupee, BedDouble, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { rooms, getDailyLedger, inventory } = useStore();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);

  const ledger = getDailyLedger();
  const lowStockCount = inventory.filter(i => i.stock < 10).length;
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;

  // Group rooms by floor (1, 2, 3, 4)
  const floors = [1, 2, 3, 4];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-900/40 to-indigo-950/20 border-indigo-500/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-300">Today's Sales</p>
              <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(ledger.grandTotal)}</h3>
              <p className="text-xs text-indigo-400 mt-1">{ledger.salesCount} transactions</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <IndianRupee className="h-6 w-6 text-indigo-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-400">Rooms Occupied</p>
              <h3 className="text-2xl font-bold text-white mt-1">{occupiedCount} / {rooms.length}</h3>
              <p className="text-xs text-zinc-500 mt-1">Active orders</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center">
              <BedDouble className="h-6 w-6 text-zinc-400" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "relative group overflow-visible transition-all duration-300",
          lowStockCount > 0 ? "border-amber-500/20 bg-amber-900/10" : ""
        )}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-400">Low Stock Alerts</p>
              <h3 className={cn("text-2xl font-bold mt-1", lowStockCount > 0 ? "text-amber-500" : "text-white")}>
                {lowStockCount}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Items below 10 qty</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center">
              <AlertCircle className={cn("h-6 w-6", lowStockCount > 0 ? "text-amber-500" : "text-zinc-400")} />
            </div>
          </CardContent>

          {/* Hover Detail Panel */}
          {lowStockCount > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
              <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Restock Needed</p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {inventory.filter(i => i.stock < 10).map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-zinc-200">{item.name} <span className="text-zinc-500 text-xs">({item.volume})</span></span>
                    <span className="text-amber-500 font-mono font-bold">{item.stock}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card
          className="cursor-pointer hover:bg-zinc-800/50 transition-colors border-dashed border-zinc-700 bg-transparent flex flex-col items-center justify-center"
          onClick={() => setIsWalkInOpen(true)}
        >
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-emerald-400" />
            </div>
            <span className="font-semibold text-emerald-400">New Walk-In Sale</span>
          </div>
        </Card>
      </div>

      {/* Room Grid */}
      <div className="space-y-8">
        {floors.map(floor => (
          <div key={floor}>
            <h2 className="text-lg font-semibold text-zinc-500 mb-4 pl-1">Floor {floor}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {rooms.filter(r => r.number.startsWith(floor.toString())).map(room => {
                const isActive = room.status === 'occupied';
                const total = room.currentOrders.reduce((acc, curr) => acc + curr.total, 0);

                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room.number)}
                    className={cn(
                      "relative flex flex-col p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02]",
                      isActive
                        ? "bg-indigo-950/30 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                        : "bg-zinc-900/30 border-zinc-800 hover:bg-zinc-800/50"
                    )}
                  >
                    <div className="flex justify-between items-start w-full mb-4">
                      <span className="text-2xl font-bold text-zinc-200">{room.number}</span>
                      <Badge variant={isActive ? 'warning' : 'neutral'}>
                        {isActive ? 'Active' : 'Vacant'}
                      </Badge>
                    </div>

                    <div className="mt-auto w-full">
                      {isActive ? (
                        <div className="text-left">
                          <p className="text-xs text-indigo-300 font-medium uppercase tracking-wider mb-1">Current Bill</p>
                          <p className="text-xl font-bold text-white">{formatCurrency(total)}</p>
                          <p className="text-xs text-zinc-500 mt-1">{room.currentOrders.length} items</p>
                        </div>
                      ) : (
                        <div className="text-left py-2">
                          <p className="text-sm text-zinc-600">No active orders</p>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {selectedRoom && (
        <RoomDetailModal
          roomNumber={selectedRoom}
          isOpen={!!selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}

      <WalkInModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
      />
    </div>
  );
}
