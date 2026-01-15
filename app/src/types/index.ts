export type DrinkItem = {
    id: string;
    name: string;
    price: number;
    stock: number;
    volume: string;
};

export type OrderItem = {
    drinkId: string;
    drinkName: string;
    price: number;
    quantity: number;
    total: number;
};

export type RoomStatus = 'vacant' | 'occupied';

export type Room = {
    id: string;
    number: string;
    status: RoomStatus;
    currentOrders: OrderItem[];
};

export type PaymentMode = 'cash' | 'upi';
export type SaleType = 'room' | 'outside';

export type SaleRecord = {
    id: string;
    type: SaleType;
    roomNumber?: string; // If type is 'room'
    items: OrderItem[];
    totalAmount: number;
    paymentMode: PaymentMode;
    timestamp: number; // Date.now()
};

export type DailyLedger = {
    date: string; // YYYY-MM-DD
    cashTotal: number;
    upiTotal: number;
    grandTotal: number;
    salesCount: number;
};

// INITIAL DATA CONSTANTS

export const INITIAL_INVENTORY: DrinkItem[] = [
    { id: '1', name: 'Kinley Water', volume: '1L', price: 20, stock: 50 },
    { id: '2', name: 'Kinley Water', volume: '2L', price: 30, stock: 50 },
    { id: '3', name: 'Thums Up', volume: '250ml', price: 20, stock: 50 },
    { id: '4', name: 'Thums Up', volume: '500ml', price: 30, stock: 50 },
    { id: '5', name: 'Sprite', volume: '250ml', price: 20, stock: 50 },
];

export const ROOM_NUMBERS = [
    '101', '102', '103', '104', '105',
    '201', '202', '203', '204', '205',
    '301', '302', '303', '304', '305',
    '401', '402', '403', '404', '405'
];
