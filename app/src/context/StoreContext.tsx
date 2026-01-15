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
    DailyLedger
} from '@/types';
import { format } from 'date-fns';
import { generateId } from '@/lib/utils';

interface StoreContextType {
    inventory: DrinkItem[];
    rooms: Room[];
    salesHistory: SaleRecord[];

    addToRoom: (roomNumber: string, drinkId: string, quantity: number) => { success: boolean; error?: string };
    removeFromRoom: (roomNumber: string, drinkId: string) => void;
    checkoutRoom: (roomNumber: string, paymentMode: PaymentMode) => void;
    processOutsideSale: (items: OrderItem[], paymentMode: PaymentMode) => { success: boolean; error?: string };
    restockInventory: (drinkId: string, quantity: number) => void;
    addInventoryItem: (item: Omit<DrinkItem, 'id'>) => void;
    updateDrinkPrice: (drinkId: string, newPrice: number) => void;
    deleteSale: (saleId: string) => void;
    getDailyLedger: (date?: string) => DailyLedger;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [inventory, setInventory] = useState<DrinkItem[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        const savedInventory = localStorage.getItem('pos_inventory');
        const savedRooms = localStorage.getItem('pos_rooms');
        const savedHistory = localStorage.getItem('pos_history');

        if (savedInventory) {
            setInventory(JSON.parse(savedInventory));
        } else {
            setInventory(INITIAL_INVENTORY);
        }

        if (savedRooms) {
            setRooms(JSON.parse(savedRooms));
        } else {
            const initialRooms = ROOM_NUMBERS.map(num => ({
                id: num,
                number: num,
                status: 'vacant' as const,
                currentOrders: [],
            }));
            setRooms(initialRooms);
        }

        if (savedHistory) {
            setSalesHistory(JSON.parse(savedHistory));
        }

        setIsLoaded(true);
    }, []);

    // Persist changes
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('pos_inventory', JSON.stringify(inventory));
        localStorage.setItem('pos_rooms', JSON.stringify(rooms));
        localStorage.setItem('pos_history', JSON.stringify(salesHistory));
    }, [inventory, rooms, salesHistory, isLoaded]);

    const addToRoom = (roomNumber: string, drinkId: string, quantity: number) => {
        const drink = inventory.find(d => d.id === drinkId);
        if (!drink) return { success: false, error: 'Drink not found' };

        if (drink.stock < quantity) return { success: false, error: 'Insufficient stock' };

        // Reduce stock
        setInventory(prev => prev.map(item =>
            item.id === drinkId ? { ...item, stock: item.stock - quantity } : item
        ));

        // Add to room
        setRooms(prev => prev.map(room => {
            if (room.number !== roomNumber) return room;

            const existingOrder = room.currentOrders.find(o => o.drinkId === drinkId);
            let newOrders;

            if (existingOrder) {
                newOrders = room.currentOrders.map(o =>
                    o.drinkId === drinkId
                        ? { ...o, quantity: o.quantity + quantity, total: (o.quantity + quantity) * o.price }
                        : o
                );
            } else {
                newOrders = [...room.currentOrders, {
                    drinkId,
                    drinkName: drink.name + ' ' + drink.volume,
                    price: drink.price,
                    quantity,
                    total: drink.price * quantity
                }];
            }

            return {
                ...room,
                status: 'occupied',
                currentOrders: newOrders
            };
        }));

        return { success: true };
    };

    const removeFromRoom = (roomNumber: string, drinkId: string) => {
        // Find the order to get quantity
        const room = rooms.find(r => r.number === roomNumber);
        const order = room?.currentOrders.find(o => o.drinkId === drinkId);

        if (!room || !order) return;

        // Return stock
        setInventory(prev => prev.map(item =>
            item.id === drinkId ? { ...item, stock: item.stock + 1 } : item
        ));

        // Update room (Remove 1 quantity)
        setRooms(prev => prev.map(r => {
            if (r.number !== roomNumber) return r;

            const newOrders = r.currentOrders.map(o => {
                if (o.drinkId === drinkId) {
                    return { ...o, quantity: o.quantity - 1, total: (o.quantity - 1) * o.price };
                }
                return o;
            }).filter(o => o.quantity > 0);

            return {
                ...r,
                status: newOrders.length === 0 ? 'vacant' : 'occupied',
                currentOrders: newOrders
            };
        }));
    };

    const checkoutRoom = (roomNumber: string, paymentMode: PaymentMode) => {
        const room = rooms.find(r => r.number === roomNumber);
        if (!room || room.currentOrders.length === 0) return;

        const totalAmount = room.currentOrders.reduce((sum, item) => sum + item.total, 0);

        const sale: SaleRecord = {
            id: generateId(),
            type: 'room',
            roomNumber,
            items: [...room.currentOrders],
            totalAmount,
            paymentMode,
            timestamp: Date.now()
        };

        setSalesHistory(prev => [sale, ...prev]);

        // Clear room
        setRooms(prev => prev.map(r =>
            r.number === roomNumber
                ? { ...r, status: 'vacant', currentOrders: [] }
                : r
        ));
    };

    const processOutsideSale = (items: OrderItem[], paymentMode: PaymentMode) => {
        // Verify stock first
        for (const item of items) {
            const stockItem = inventory.find(i => i.id === item.drinkId);
            if (!stockItem || stockItem.stock < item.quantity) {
                return { success: false, error: `Insufficient stock for ${item.drinkName}` };
            }
        }

        // Reduce stock
        setInventory(prev => prev.map(invItem => {
            const saleItem = items.find(i => i.drinkId === invItem.id);
            if (saleItem) {
                return { ...invItem, stock: invItem.stock - saleItem.quantity };
            }
            return invItem;
        }));

        const totalAmount = items.reduce((sum, i) => sum + i.total, 0);

        const sale: SaleRecord = {
            id: generateId(),
            type: 'outside',
            items,
            totalAmount,
            paymentMode,
            timestamp: Date.now()
        };

        setSalesHistory(prev => [sale, ...prev]);
        return { success: true };
    };

    const restockInventory = (drinkId: string, quantity: number) => {
        setInventory(prev => prev.map(item =>
            item.id === drinkId ? { ...item, stock: item.stock + quantity } : item
        ));
    };

    const addInventoryItem = (item: Omit<DrinkItem, 'id'>) => {
        const newItem: DrinkItem = {
            ...item,
            id: generateId()
        };
        setInventory(prev => [...prev, newItem]);
    };

    const updateDrinkPrice = (drinkId: string, newPrice: number) => {
        setInventory(prev => prev.map(item =>
            item.id === drinkId ? { ...item, price: newPrice } : item
        ));
    };

    const deleteSale = (saleId: string) => {
        setSalesHistory(prev => prev.filter(s => s.id !== saleId));
    };

    const getDailyLedger = (dateStr?: string) => {
        const targetDate = dateStr || format(new Date(), 'yyyy-MM-dd');

        // Check local time for accurate day filtering
        // We'll compare the date part of the timestamp

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

    if (!isLoaded) {
        return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading System...</div>;
    }

    return (
        <StoreContext.Provider value={{
            inventory,
            rooms,
            salesHistory,
            addToRoom,
            removeFromRoom,
            checkoutRoom,
            processOutsideSale,
            restockInventory,
            addInventoryItem,
            updateDrinkPrice,
            deleteSale,
            getDailyLedger
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
