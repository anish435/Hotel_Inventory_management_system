# 🏨 Vaishnavi Inn - POS & Room Billing System

A modern, production-grade Point of Sale (POS) and Room Service Billing System built for hotel operations. This system handles room order tracking, walk-in sales, real-time inventory management, and financial reporting.

![Dashboard Preview](https://placehold.co/1200x600/18181b/6366f1?text=Vaishnavi+Inn+POS)

## ✨ Key Features

### 🖥️ POS Operations
- **Room Sales**: Interactive grid interface for tracking orders across 4 floors (Rooms 101-405).
- **Walk-in Sales**: Dedicated mode for direct over-the-counter billing without room occupancy.
- **Live Order Tracking**: Real-time status indicators (Vacant/Occupied) for all rooms.
- **Smart Checkout**: Integrated payment processing (Cash/UPI) with auto-clearing and history logging.

### 📦 Inventory Management
- **Real-time Stock Tracking**: Automatic stock reduction on every sale.
- **Low Stock Alerts**: Visual dashboard alerts when items drop below 10 units.
- **Admin Controls**: Password-protected ability to add new items, refill stock, and update prices.
- **Quick Actions**: Hover-to-view details for critical stock needs.

### 📊 Reports & History
- **Sales History**: Complete audit trail of every transaction.
- **Excel Export**: One-click download of sales records for accounting (.xlsx).
- **Daily Ledger**: Dashboard summary of "Today's Sales," broken down by Cash vs. UPI.

### 🛡️ Security
- **Admin Authorization**: Sensitive actions (Inventory changes, Price updates, History deletion) are secured with an admin password.
- **Safe Persistence**: All data persists locally via `LocalStorage`, ensuring no data loss on page reloads.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, `clsx`, `tailwind-merge`
- **Icons**: Lucide React
- **State Management**: React Context API + LocalStorage Hooks
- **Utils**: `xlsx` (Excel Export), `date-fns`

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Vaishnavi_Inn_RMS
   ```

2. **Install dependencies**
   ```bash
   cd app
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Default Credentials

- **Admin Password**: `admin`
  *(Used for adding items, restock, pricing edits, and deleting history)*

## 📂 Project Structure

```
src/
├── app/               # Next.js App Router pages
│   ├── inventory/     # Inventory management page
│   ├── history/       # Sales history & audit page
│   └── page.tsx       # Main POS Dashboard
├── components/
│   ├── pos/           # POS-specific modals & widgets
│   ├── ui/            # Reusable UI kit (Buttons, Cards, Inputs)
│   └── layout/        # Sidebar & Global layouts
├── context/           # Global Store (State & Logic)
├── types/             # TypeScript interfaces
└── lib/               # Utility functions
```

---
Built with ❤️ using the Next.js stack.
