# NextGen Fashion: MVP Specification & Roadmap

This document captures the full scope, project structure, and execution plan for the **NextGen Fashion** MVP.

---

## 1. Project Structure (Monorepo)
```txt
nextgen-fashion/
├── apps/
│   ├── web/        → Next.js (Storefront, Dashboard, POS)
│   └── api/        → NestJS (Backend API)
├── packages/
│   ├── ui/         → Shared shadcn/ui components
│   ├── types/      → Shared TypeScript interfaces
│   ├── utils/      → Shared helper functions
│   └── config/     → Shared configurations (ESLint, Tailwind)
├── docs/           → Documentation
└── package.json    → Root workspace
```

---

## 2. Core Stack
| Layer | Technology |
| :--- | :--- |
| **Monorepo** | Turborepo |
| **Frontend** | Next.js 14+ (App Router, Turbopack) |
| **Backend** | NestJS |
| **Database** | PostgreSQL + Prisma ORM |
| **Styling** | Tailwind CSS + shadcn/ui |
| **State** | Zustand |

---

## 3. MVP Features

### 🛡️ 1. Authentication
- Admin login
- Protected dashboard
- Role-based permissions

### 📊 2. Admin Dashboard
- Overview stats & Sales summary
- Low stock alerts
- Recent orders tracking

### 📦 3. Product & Inventory Management
- Full CRUD for products
- Image uploads (Cloudinary)
- Categories, sizes, colors, and pricing
- Barcode generation & scanning
- Stock movement logs & adjustments

### 🛒 4. Storefront
- Homepage & Collections
- Product discovery (Listing, Search, Filters)
- Shopping cart & Checkout
- Paystack payment integration

### 👥 5. Customer Management
- Customer records & profiles
- Order history tracking

---

## 4. Development Execution Order

### STEP 1: Foundation (COMPLETED)
- Setup Monorepo, Frontend, and Backend.
- Database & Prisma initialization.
- Core package installation.

### STEP 2: UI System (IN PROGRESS)
- Install `shadcn/ui`.
- Setup Dashboard layout & Sidebar.
- Implement Theme system.

### STEP 3: Product Module
- CRUD operations.
- Image upload integration.
- Variant logic (Size/Color).

### STEP 4: Inventory & Barcodes
- Real-time stock updates.
- Barcode generation/scanning.

### STEP 5: Storefront & Orders
- Customer-facing pages.
- Cart & Checkout flow.
- Paystack integration.

---

## 5. Final MVP Deliverables
- **Admin**: Full control over products, inventory, and orders.
- **Customers**: Seamless shopping and payment experience.
- **System**: Centralized, consistent data across all platforms.
