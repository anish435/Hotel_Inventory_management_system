"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    DrinkItem,
    Room,
    SaleRecord,
    INITIAL_INVENTORY,
    ROOM_NUMBERS,
    OrderItem,
    PaymentMode,
    DailyLedger,
    Staff,
    User,
    CreditRecord,
    CreditStatus
} from '@/types';
import { format } from 'date-fns';
import { generateId } from '@/lib/utils';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
    setDoc,
    addDoc,
    deleteDoc,
    query,
    orderBy,
    writeBatch,
    getDocs
} from 'firebase/firestore';

interface StoreContextType {
    inventory: DrinkItem[];
    rooms: Room[];
    salesHistory: SaleRecord[];
    staff: Staff[];
    currentUser: User | null;

    credits: CreditRecord[];

    addToRoom: (roomNumber: string, drinkId: string, quantity: number, bellboyId?: string) => Promise<{ success: boolean; error?: string }>;
    removeFromRoom: (roomNumber: string, orderIndex: number) => Promise<void>;
    shiftRoom: (sourceRoomId: string, targetRoomId: string) => Promise<{ success: boolean; error?: string }>;
    updateRoomGuestName: (roomNumber: string, guestName: string) => Promise<void>;
    checkoutRoom: (roomNumber: string, paymentMode: PaymentMode, amountPaid?: number) => Promise<void>;
    processOutsideSale: (items: OrderItem[], paymentMode: PaymentMode, guestName?: string, amountPaid?: number) => Promise<{ success: boolean; error?: string }>;
    restockInventory: (drinkId: string, quantity: number) => Promise<void>;
    addInventoryItem: (item: Omit<DrinkItem, 'id'>) => Promise<void>;
    removeInventoryItem: (id: string) => Promise<{ success: boolean; error?: string }>;
    updateDrinkPrice: (drinkId: string, newPrice: number) => Promise<void>;
    deleteSale: (saleId: string) => Promise<void>;
    getDailyLedger: (date?: string) => DailyLedger;
    isLoaded: boolean;
    seedDatabase: () => Promise<void>;

    // Credits
    settleCredit: (id: string, paymentMode?: PaymentMode) => Promise<void>;
    deleteCredit: (id: string) => Promise<void>;
    addCredit: (credit: Omit<CreditRecord, 'id' | 'createdAt'>) => Promise<void>;

    // Staff & User Management
    addStaff: (staff: Omit<Staff, 'id'>) => Promise<void>;
    removeStaff: (id: string) => Promise<void>;
    updateStaff: (id: string, data: Partial<Staff>) => Promise<void>;
    logout: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [inventory, setInventory] = useState<DrinkItem[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [credits, setCredits] = useState<CreditRecord[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initial Data Seeding Check
    useEffect(() => {
        const seedDataIfNeeded = async () => {
            try {
                // Inventory & Rooms seeding
                const invSnapshot = await getDocs(collection(db, 'inventory'));
                if (invSnapshot.empty) {
                    console.log("Seeding Initial Inventory...");
                    const batch = writeBatch(db);
                    INITIAL_INVENTORY.forEach(item => {
                        const docRef = doc(db, 'inventory', item.id);
                        batch.set(docRef, item);
                    });
                    await batch.commit();
                }

                const roomSnapshot = await getDocs(collection(db, 'rooms'));
                if (roomSnapshot.empty) {
                    console.log("Seeding Initial Rooms...");
                    const batch = writeBatch(db);
                    ROOM_NUMBERS.forEach(num => {
                        const roomData = {
                            id: num,
                            number: num,
                            status: 'vacant',
                            currentOrders: [],
                        };
                        const docRef = doc(db, 'rooms', num);
                        batch.set(docRef, roomData);
                    });
                    await batch.commit();
                }
            } catch (e) {
                console.error("Error checking/seeding data:", e);
            }
        };

        seedDataIfNeeded();
    }, []);

    // Real-time Listeners
    useEffect(() => {
        const unsubInventory = onSnapshot(collection(db, 'inventory'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DrinkItem));
            setInventory(data);
        });

        const unsubRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
            data.sort((a, b) => parseInt(a.number) - parseInt(b.number));
            setRooms(data);
        });

        const q = query(collection(db, 'sales'), orderBy('timestamp', 'desc'));
        const unsubSales = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SaleRecord));
            setSalesHistory(data);
            setIsLoaded(true);
        });

        // Staff Listener
        const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
            setStaff(data);
        });

        // Auth Listener
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser({
                    id: user.uid,
                    username: user.email || 'Admin',
                    password: '',
                    role: 'admin'
                });
            } else {
                setCurrentUser(null);
            }
        });

        // Credits Listener
        const unsubCredits = onSnapshot(query(collection(db, 'credits'), orderBy('createdAt', 'desc')), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CreditRecord));
            setCredits(data);
        });

        return () => {
            unsubInventory();
            unsubRooms();
            unsubSales();
            unsubStaff();
            unsubAuth();
            unsubCredits();
        };
    }, []);

    const addToRoom = async (roomNumber: string, drinkId: string, quantity: number, bellboyId?: string) => {
        const drink = inventory.find(d => d.id === drinkId);
        if (!drink) return { success: false, error: 'Drink not found' };

        if (drink.stock < quantity) return { success: false, error: 'Insufficient stock' };

        const bellboy = bellboyId ? staff.find(s => s.id === bellboyId) : undefined;

        try {
            const batch = writeBatch(db);

            // 1. Reduce Stock
            const drinkRef = doc(db, 'inventory', drinkId);
            batch.update(drinkRef, { stock: drink.stock - quantity });

            // 2. Add to Room
            const room = rooms.find(r => r.number === roomNumber);
            if (room) {
                const updatedOrders = [...room.currentOrders];

                // We prioritize splitting by Bellboy if specified
                const existingOrderIndex = updatedOrders.findIndex(o => o.drinkId === drinkId && o.bellboyId === bellboyId);

                const now = Date.now();
                if (existingOrderIndex >= 0) {
                    const current = updatedOrders[existingOrderIndex];
                    current.quantity += quantity;
                    current.total = current.quantity * current.price;
                    current.timestamps = [...(current.timestamps || (current.timestamp ? [current.timestamp] : [])), now];
                    current.timestamp = now;
                } else {
                    updatedOrders.push({
                        drinkId,
                        drinkName: drink.name + ' ' + drink.volume,
                        price: drink.price,
                        quantity,
                        total: drink.price * quantity,
                        bellboyId: bellboy?.id,
                        bellboyName: bellboy?.name,
                        timestamp: now,
                        timestamps: [now]
                    });
                }

                const roomRef = doc(db, 'rooms', room.id);
                batch.update(roomRef, {
                    status: 'occupied',
                    currentOrders: updatedOrders
                });
            }

            await batch.commit();
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    };

    const removeFromRoom = async (roomNumber: string, orderIndex: number) => {
        const room = rooms.find(r => r.number === roomNumber);
        if (!room) return;

        // Validation of index
        if (orderIndex < 0 || orderIndex >= room.currentOrders.length) return;

        const itemToRemove = room.currentOrders[orderIndex];
        const drinkId = itemToRemove.drinkId;
        const drink = inventory.find(d => d.id === drinkId);

        try {
            const batch = writeBatch(db);

            // Restock if inventory item exists
            if (drink) {
                const drinkRef = doc(db, 'inventory', drinkId);
                batch.update(drinkRef, { stock: drink.stock + 1 });
            }

            let updatedOrders = [...room.currentOrders];
            if (updatedOrders[orderIndex].quantity > 1) {
                updatedOrders[orderIndex] = {
                    ...updatedOrders[orderIndex],
                    quantity: updatedOrders[orderIndex].quantity - 1,
                    total: (updatedOrders[orderIndex].quantity - 1) * updatedOrders[orderIndex].price,
                    timestamps: updatedOrders[orderIndex].timestamps ? updatedOrders[orderIndex].timestamps.slice(0, -1) : []
                };
            } else {
                updatedOrders = updatedOrders.filter((_, idx) => idx !== orderIndex);
            }

            const roomRef = doc(db, 'rooms', room.id);
            batch.update(roomRef, {
                status: updatedOrders.length === 0 ? 'vacant' : 'occupied',
                currentOrders: updatedOrders
            });

            await batch.commit();
        } catch (e) {
            console.error(e);
        }
    };

    const checkoutRoom = async (roomNumber: string, paymentMode: PaymentMode, amountPaid?: number) => {
        const room = rooms.find(r => r.number === roomNumber);
        if (!room || room.currentOrders.length === 0) return;

        const totalAmount = room.currentOrders.reduce((sum, item) => sum + item.total, 0);
        const saleId = generateId();
        const finalAmountPaid = amountPaid !== undefined ? amountPaid : totalAmount;
        const finalPaymentMode = amountPaid !== undefined && amountPaid < totalAmount ? 'partial' : paymentMode;

            const sale: SaleRecord = {
                id: saleId,
                type: 'room',
                roomNumber,
                guestName: room.guestName,
                items: room.currentOrders,
                totalAmount,
                amountPaid: finalAmountPaid,
                paymentMode: finalPaymentMode,
                timestamp: Date.now()
            };

            try {
                const batch = writeBatch(db);
                const saleRef = doc(db, 'sales', saleId);
                batch.set(saleRef, sale);

                if (finalAmountPaid < totalAmount) {
                    const creditId = generateId();
                    const creditRecord: CreditRecord = {
                        id: creditId,
                        customerName: room.guestName || `Room ${roomNumber} Guest`,
                        roomNumber,
                        amount: totalAmount - finalAmountPaid,
                        items: room.currentOrders,
                        status: 'pending',
                        paymentMode: paymentMode,
                        createdAt: Date.now()
                    };
                    const creditRef = doc(db, 'credits', creditId);
                    batch.set(creditRef, creditRecord);
                }

                const roomRef = doc(db, 'rooms', room.id);
                batch.update(roomRef, { status: 'vacant', currentOrders: [], guestName: '' });

            await batch.commit();
        } catch (e) {
            console.error(e);
        }
    };

    const shiftRoom = async (sourceRoomId: string, targetRoomId: string) => {
        const sourceRoom = rooms.find(r => r.number === sourceRoomId);
        const targetRoom = rooms.find(r => r.number === targetRoomId);

        if (!sourceRoom || !targetRoom) return { success: false, error: 'Room not found' };
        if (targetRoom.status === 'occupied') return { success: false, error: 'Target room is already occupied' };
        if (sourceRoom.currentOrders.length === 0 && !sourceRoom.guestName) return { success: false, error: 'Source room is empty' };

        try {
            const batch = writeBatch(db);

            // Copy data to target room
            const targetRef = doc(db, 'rooms', targetRoom.id);
            batch.update(targetRef, {
                status: 'occupied',
                currentOrders: sourceRoom.currentOrders,
                guestName: sourceRoom.guestName || ''
            });

            // Clear source room
            const sourceRef = doc(db, 'rooms', sourceRoom.id);
            batch.update(sourceRef, {
                status: 'vacant',
                currentOrders: [],
                guestName: ''
            });

            await batch.commit();
            return { success: true };
        } catch (e: any) {
            console.error(e);
            return { success: false, error: e.message };
        }
    };

    const updateRoomGuestName = async (roomNumber: string, guestName: string) => {
        const room = rooms.find(r => r.number === roomNumber);
        if (!room) return;

        try {
            const roomRef = doc(db, 'rooms', room.id);
            await updateDoc(roomRef, { guestName });
        } catch (e) {
            console.error(e);
        }
    };

    const processOutsideSale = async (items: OrderItem[], paymentMode: PaymentMode, guestName?: string, amountPaid?: number) => {
        for (const item of items) {
            const stockItem = inventory.find(i => i.id === item.drinkId);
            if (!stockItem || stockItem.stock < item.quantity) {
                return { success: false, error: `Insufficient stock for ${item.drinkName}` };
            }
        }

        try {
            const batch = writeBatch(db);

            items.forEach(item => {
                const drinkRef = doc(db, 'inventory', item.drinkId);
                const currentStock = inventory.find(i => i.id === item.drinkId)?.stock || 0;
                batch.update(drinkRef, { stock: currentStock - item.quantity });
            });

            const saleId = generateId();
            const totalAmount = items.reduce((sum, i) => sum + i.total, 0);
            const finalAmountPaid = amountPaid !== undefined ? amountPaid : totalAmount;
            const finalPaymentMode = amountPaid !== undefined && amountPaid < totalAmount ? 'partial' : paymentMode;

            const sale: SaleRecord = {
                id: saleId,
                type: 'outside',
                guestName,
                items,
                totalAmount,
                amountPaid: finalAmountPaid,
                paymentMode: finalPaymentMode,
                timestamp: Date.now()
            };
            const saleRef = doc(db, 'sales', saleId);
            batch.set(saleRef, sale);

            if (finalAmountPaid < totalAmount) {
                if (!guestName) throw new Error("Guest Name is required for credit sales");
                const creditId = generateId();
                const creditRecord: CreditRecord = {
                    id: creditId,
                    customerName: guestName,
                    amount: totalAmount - finalAmountPaid,
                    items: items,
                    status: 'pending',
                    paymentMode: paymentMode,
                    createdAt: Date.now()
                };
                const creditRef = doc(db, 'credits', creditId);
                batch.set(creditRef, creditRecord);
            }

            await batch.commit();
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    };

    const restockInventory = async (drinkId: string, quantity: number) => {
        const drink = inventory.find(d => d.id === drinkId);
        if (!drink) return;
        try {
            const drinkRef = doc(db, 'inventory', drinkId);
            await updateDoc(drinkRef, { stock: drink.stock + quantity });
        } catch (e) { console.error(e); }
    };

    const addInventoryItem = async (item: Omit<DrinkItem, 'id'>) => {
        const newItem = { ...item, id: generateId() };
        try { await setDoc(doc(db, 'inventory', newItem.id), newItem); } catch (e) { console.error(e); }
    };

    const removeInventoryItem = async (id: string) => {
        // Check integrity: ensure item is not in any active room order
        const isUsedInActiveOrder = rooms.some(room =>
            room.status === 'occupied' && room.currentOrders.some(order => order.drinkId === id)
        );

        if (isUsedInActiveOrder) {
            return {
                success: false,
                error: "Cannot delete item. It is currently part of an active room order."
            };
        }

        try {
            await deleteDoc(doc(db, 'inventory', id));
            return { success: true };
        } catch (e: any) {
            console.error(e);
            return { success: false, error: e.message };
        }
    };

    const updateDrinkPrice = async (drinkId: string, newPrice: number) => {
        try {
            const drinkRef = doc(db, 'inventory', drinkId);
            await updateDoc(drinkRef, { price: newPrice });
        } catch (e) { console.error(e); }
    };

    const deleteSale = async (saleId: string) => {
        try { await deleteDoc(doc(db, 'sales', saleId)); } catch (e) { console.error(e); }
    };

    const getDailyLedger = (dateStr?: string) => {
        const targetDate = dateStr || format(new Date(), 'yyyy-MM-dd');
        const daySales = salesHistory.filter(sale => {
            const saleDate = format(new Date(sale.timestamp), 'yyyy-MM-dd');
            return saleDate === targetDate;
        });
        return {
            date: targetDate,
            cashTotal: daySales.filter(s => s.paymentMode === 'cash').reduce((sum, s) => sum + s.totalAmount, 0),
            upiTotal: daySales.filter(s => s.paymentMode === 'upi').reduce((sum, s) => sum + s.totalAmount, 0),
            grandTotal: daySales.reduce((sum, s) => sum + s.totalAmount, 0),
            salesCount: daySales.length
        };
    };

    const seedDatabase = async () => {
        try {
            console.log("Forcing Database Seeding (Rooms Only)...");
            const batch = writeBatch(db);
            ROOM_NUMBERS.forEach(num => {
                const docRef = doc(db, 'rooms', num);
                const roomData = { id: num, number: num, status: 'vacant', currentOrders: [] };
                batch.set(docRef, roomData);
            });
            await batch.commit();
            window.location.reload();
        } catch (e) {
            console.error("Manual Seed Failed:", e);
            alert("Failed to seed database.");
        }
    };

    // Staff Functions
    const addStaff = async (staffData: Omit<Staff, 'id'>) => {
        try {
            const newStaff: Staff = { ...staffData, id: generateId() };
            await setDoc(doc(db, 'staff', newStaff.id), newStaff);
        } catch (e) { console.error(e); }
    };

    const removeStaff = async (id: string) => {
        try { await deleteDoc(doc(db, 'staff', id)); } catch (e) { console.error(e); }
    };

    const updateStaff = async (id: string, data: Partial<Staff>) => {
        try { await updateDoc(doc(db, 'staff', id), data); } catch (e) { console.error(e); }
    };

    // User Functions
    const logout = async () => {
        try {
            await signOut(auth);
        } catch (e) {
            console.error(e);
        }
    };

    // Credit Functions
    const settleCredit = async (id: string, paymentMode?: PaymentMode) => {
        try {
            const creditRef = doc(db, 'credits', id);
            await updateDoc(creditRef, { 
                status: 'settled', 
                settledAt: Date.now(),
                ...(paymentMode ? { paymentMode } : {})
            });
        } catch (e) { console.error(e); }
    };

    const deleteCredit = async (id: string) => {
        try { await deleteDoc(doc(db, 'credits', id)); } catch (e) { console.error(e); }
    };

    const addCredit = async (creditData: Omit<CreditRecord, 'id' | 'createdAt'>) => {
        try {
            const newCredit: CreditRecord = { ...creditData, id: generateId(), createdAt: Date.now() };
            await setDoc(doc(db, 'credits', newCredit.id), newCredit);
        } catch (e) { console.error(e); }
    };

    return (
        <StoreContext.Provider value={{
            inventory,
            rooms,
            salesHistory,
            staff,
            credits,
            currentUser,
            addToRoom,
            removeFromRoom,
            shiftRoom,
            updateRoomGuestName,
            checkoutRoom,
            processOutsideSale,
            restockInventory,
            addInventoryItem,
            removeInventoryItem,
            updateDrinkPrice,
            deleteSale,
            getDailyLedger,
            seedDatabase,
            isLoaded,
            addStaff,
            removeStaff,
            updateStaff,
            logout,
            settleCredit,
            deleteCredit,
            addCredit
        }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
}
