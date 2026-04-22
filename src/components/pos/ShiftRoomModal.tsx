import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { X, ArrowRightLeft } from "lucide-react";
import { Button } from "../ui/Button";

interface ShiftRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceRoomId: string;
}

export function ShiftRoomModal({ isOpen, onClose, sourceRoomId }: ShiftRoomModalProps) {
    const { rooms, shiftRoom } = useStore();
    const [targetRoomId, setTargetRoomId] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const vacantRooms = rooms.filter(r => r.status === 'vacant' && r.number !== sourceRoomId);

    const handleShift = async () => {
        if (!targetRoomId) {
            alert("Please select a target room.");
            return;
        }

        setIsSubmitting(true);
        const result = await shiftRoom(sourceRoomId, targetRoomId);
        setIsSubmitting(false);

        if (result && result.success) {
            onClose(); // Room detail modal should also handle being closed if current room becomes vacant.
        } else {
            alert(result?.error || "Failed to shift room.");
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5 text-indigo-400" />
                        Shift Guest
                    </h3>
                    <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                        <X className="h-5 w-5 text-zinc-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex flex-col items-center p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/50 w-24">
                            <span className="text-zinc-500">From</span>
                            <span className="font-bold text-white mt-1">Room {sourceRoomId}</span>
                        </div>
                        <ArrowRightLeft className="h-6 w-6 text-zinc-600" />
                        <div className="flex flex-col items-center p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20 w-24">
                            <span className="text-indigo-400/70">To</span>
                            <span className="font-bold text-indigo-400 mt-1">{targetRoomId ? `Room ${targetRoomId}` : '?'}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Select Target Room</label>
                        <select
                            value={targetRoomId}
                            onChange={(e) => setTargetRoomId(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        >
                            <option value="" disabled>-- Select a Vacant Room --</option>
                            {vacantRooms.map(room => (
                                <option key={room.id} value={room.number}>
                                    Room {room.number}
                                </option>
                            ))}
                        </select>
                        {vacantRooms.length === 0 && (
                            <p className="text-xs text-rose-400 mt-1">No vacant rooms available.</p>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleShift} 
                        disabled={!targetRoomId || isSubmitting || vacantRooms.length === 0}
                    >
                        {isSubmitting ? 'Shifting...' : 'Confirm Shift'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
