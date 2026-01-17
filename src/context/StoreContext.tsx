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
    User
} from '@/types';
import { format } from 'date-fns';
import { generateId } from '@/lib/utils';
import { db } from '@/lib/firebase';
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
    users: User[];
    currentUser: User | null;

    addToRoom: (roomNumber: string, drinkId: string, quantity: number, bellboyId?: string) => Promise<{ success: boolean; error?: string }>;
    removeFromRoom: (roomNumber: string, orderIndex: number) => Promise<void>;
    checkoutRoom: (roomNumber: string, paymentMode: PaymentMode) => Promise<void>;
    processOutsideSale: (items: OrderItem[], paymentMode: PaymentMode) => Promise<{ success: boolean; error?: string }>;
    restockInventory: (drinkId: string, quantity: number) => Promise<void>;
    addInventoryItem: (item: Omit<DrinkItem, 'id'>) => Promise<void>;
    removeInventoryItem: (id: string) => Promise<{ success: boolean; error?: string }>;
    updateDrinkPrice: (drinkId: string, newPrice: number) => Promise<void>;
    deleteSale: (saleId: string) => Promise<void>;
    getDailyLedger: (date?: string) => DailyLedger;
    isLoaded: boolean;
    seedDatabase: () => Promise<void>;

    // Staff & User Management
    addStaff: (staff: Omit<Staff, 'id'>) => Promise<void>;
    removeStaff: (id: string) => Promise<void>;
    updateStaff: (id: string, data: Partial<Staff>) => Promise<void>;
    login: (password: string) => Promise<boolean>;
    logout: () => void;
    changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean, error?: string }>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [inventory, setInventory] = useState<DrinkItem[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initial Data Seeding Check
    useEffect(() => {
        const seedDataIfNeeded = async () => {
            try {
                // Inventory & Rooms seeding (existing code)
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

                // Seed Default Admin User if missing
                const usersSnapshot = await getDocs(collection(db, 'users'));
                if (usersSnapshot.empty) {
                    console.log("Seeding Default Admin...");
                    const adminUser: User = {
                        id: 'admin',
                        username: 'Administrator',
                        password: 'admin', // Default password
                        role: 'admin'
                    };
                    await setDoc(doc(db, 'users', 'admin'), adminUser);
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

        // Users Listener
        const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(data);
        });

        // Recover session
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setCurrentUser(parsed);
            } catch (e) { }
        }

        return () => {
            unsubInventory();
            unsubRooms();
            unsubSales();
            unsubStaff();
            unsubUsers();
        };
    }, []);

    // Sync currentUser with latest data if updated
    useEffect(() => {
        if (currentUser && users.length > 0) {
            const freshUser = users.find(u => u.id === currentUser.id);
            if (freshUser) {
                if (freshUser.password !== currentUser.password) {
                    // Pass changed remotely? 
                    setCurrentUser(freshUser);
                    localStorage.setItem('currentUser', JSON.stringify(freshUser));
                }
                // Handle role changes etc if needed
            }
        }
    }, [users, currentUser]);

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

                if (existingOrderIndex >= 0) {
                    updatedOrders[existingOrderIndex].quantity += quantity;
                    updatedOrders[existingOrderIndex].total = updatedOrders[existingOrderIndex].quantity * updatedOrders[existingOrderIndex].price;
                } else {
                    updatedOrders.push({
                        drinkId,
                        drinkName: drink.name + ' ' + drink.volume,
                        price: drink.price,
                        quantity,
                        total: drink.price * quantity,
                        bellboyId: bellboy?.id,
                        bellboyName: bellboy?.name
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
                updatedOrders[orderIndex].quantity -= 1;
                updatedOrders[orderIndex].total = updatedOrders[orderIndex].quantity * updatedOrders[orderIndex].price;
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

    const checkoutRoom = async (roomNumber: string, paymentMode: PaymentMode) => {
        const room = rooms.find(r => r.number === roomNumber);
        if (!room || room.currentOrders.length === 0) return;

        const totalAmount = room.currentOrders.reduce((sum, item) => sum + item.total, 0);
        const saleId = generateId();

        const sale: SaleRecord = {
            id: saleId,
            type: 'room',
            roomNumber,
            items: room.currentOrders,
            totalAmount,
            paymentMode,
            timestamp: Date.now()
        };

        try {
            const batch = writeBatch(db);
            const saleRef = doc(db, 'sales', saleId);
            batch.set(saleRef, sale);

            const roomRef = doc(db, 'rooms', room.id);
            batch.update(roomRef, { status: 'vacant', currentOrders: [] });

            await batch.commit();
        } catch (e) {
            console.error(e);
        }
    };

    const processOutsideSale = async (items: OrderItem[], paymentMode: PaymentMode) => {
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
            const sale: SaleRecord = {
                id: saleId,
                type: 'outside',
                items,
                totalAmount,
                paymentMode,
                timestamp: Date.now()
            };
            const saleRef = doc(db, 'sales', saleId);
            batch.set(saleRef, sale);

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
    const login = async (password: string): Promise<boolean> => {
        const foundUser = users.find(u => u.password === password);
        if (foundUser) {
            setCurrentUser(foundUser);
            localStorage.setItem('currentUser', JSON.stringify(foundUser));
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
    };

    const changePassword = async (oldPass: string, newPass: string) => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        if (currentUser.password !== oldPass) {
            return { success: false, error: "Incorrect old password" };
        }
        try {
            const userRef = doc(db, 'users', currentUser.id);
            await updateDoc(userRef, { password: newPass });
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    };

    return (
        <StoreContext.Provider value={{
            inventory,
            rooms,
            salesHistory,
            staff,
            users,
            currentUser,
            addToRoom,
            removeFromRoom,
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
            login,
            logout,
            changePassword
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
