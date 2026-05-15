# 🏛️ NextGen Fashion OS: System Architecture

## 1. Overview
NextGen Fashion OS is a high-fidelity, enterprise-grade retail operating system built with **Next.js 15**, **Prisma**, and **Supabase (PostgreSQL)**. It is designed for maximum scalability, modularity, and technical purity.

---

## 2. Technical Stack
- **Frontend**: Next.js (App Router), Tailwind CSS, Lucide Icons.
- **Backend**: Next.js Server Actions & Route Handlers.
- **Database**: Supabase PostgreSQL.
- **ORM**: Prisma with Transaction Support.
- **State Management**: Zustand (Modular Stores).
- **Architecture**: 5-Layer N-Tier with Granular Services.

---

## 3. The 5-Layer N-Tier Architecture
We follow a strict downward dependency flow to ensure modularity and prevent technical debt.

1.  **UI Layer**: React components & pages (Display only, logic-free).
2.  **Action/API Layer**: Server Actions and Route Handlers (Request validation & orchestration).
3.  **Service Layer (Granular)**: One file per business use case (e.g., `process-web-order.service.ts`).
4.  **Queries Layer**: Centralized database access (Strictly Prisma logic).
5.  **Database Layer**: Supabase PostgreSQL.

---

## 4. Key Architectural Patterns

### 🧩 Modular Decoupling
Modules (Products, Orders, Inventory) are self-contained. They communicate through **Services**, **Shared Queries**, or **Events**. A module never manipulates another module's internal state directly.

### 🛰️ Event-Based Thinking
We use a global event dispatcher (`src/lib/events.ts`) for reactive side-effects.
- **Primary Action**: Order is recorded in a transaction.
- **Event**: `sale:created` is emitted.
- **Reaction**: `listeners.ts` triggers notifications, analytics, or loyalty updates independently.

### 📦 Global Services
Cross-cutting concerns are unified in `src/services/`:
- `prisma.service.ts`: Centralized database client.
- `auth.service.ts`: Authentication and Session management.
- `payment.service.ts`: Global payment orchestration.
- `notification.service.ts`: Unified messaging (Email, WhatsApp, SMS).

---

## 5. Module Dictionary

### 🛍️ Products Module
Handles the catalog, categories, and variants.
- **Services**: `GetProductsService`, `CreateProductService`.
- **Data Access**: `ProductQueries`.

### 📦 Inventory Module
Manages stock levels and audit trails.
- **Services**: `UpdateStockService`, `DecrementStockService` (for sales).
- **Data Access**: `InventoryQueries`.

### 🛒 Orders Module
The core revenue engine. Orchestrates between Customers, Payments, and Inventory.
- **Services**: `ProcessWebOrderService`, `ProcessPOSSaleService`.
- **Data Access**: `OrderQueries`.

---

## 6. Developer Standards
- **One File, One Responsibility**: Keep services small and focused.
- **Downward Flow**: Orders can call Inventory; Inventory NEVER calls Orders.
- **Thin Actions**: API handlers should only validate and delegate to services.
- **Logic-Free UI**: Components should not contain business or database logic.

---

## 🚀 Getting Started
- **Sync DB**: `npx prisma migrate dev`
- **Seed Data**: `npx prisma db seed`
- **Explore Data**: `npx prisma studio`
