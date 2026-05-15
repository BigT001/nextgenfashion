# Catalog & Inventory System (v1.0)

This document provides a comprehensive overview of the Product, Inventory, and Barcode modules within the NextGen Fashion OS.

---

## 🏛️ Core Architecture
The system follows an **N-Tier Hexagonal Architecture**, ensuring strict separation of concerns:
1.  **Queries Layer**: Low-level Prisma interactions.
2.  **Service Layer**: Atomic business logic (e.g., updating stock, creating products).
3.  **Action Layer**: Next.js Server Actions for UI integration and cache revalidation.
4.  **UI Layer**: High-fidelity, logic-free components.

---

## 🛍️ 1. Products Module
The Products module is responsible for managing the digital representation of the fashion catalog.

### Key Features
*   **Hierarchical Data Model**: Products are grouped by **Categories** and contain multiple **Variants** (Size/Color).
*   **Intelligent SKU Generation**: Automatically generates standardized identities (e.g., `NG-DR-B-2T`) during registration.
*   **Multi-Image Support**: Integrated with Cloudinary for high-performance asset management.
*   **CRUD Lifecycle**: Full support for Registering (Create), Refining (Update), and Retiring (Delete) fashion lines.

### Critical Files
- `src/modules/products/queries/product.queries.ts`: Database access.
- `src/modules/products/services/create-product.service.ts`: Business logic for product creation.
- `src/modules/products/components/product-form.tsx`: The primary interface for catalog management.

---

## 📦 2. Inventory Module
The Inventory module ensures real-time precision in stock tracking and management.

### Key Features
*   **Atomic Adjustments**: Stock changes (increments/decrements) are performed in a single database transaction.
*   **Immutable Audit Trail**: Every stock movement is logged in the **Audit Intelligence** ledger with a mandatory reason (e.g., Restock, Sale, Damage).
*   **Stock Health KPIs**:
    *   **Global Catalog**: Total active products.
    *   **Stock Critical**: Real-time alerts for items below threshold.
    *   **Inventory Value**: Aggregated asset value calculation.
*   **Inventory Command Center**: A professional dashboard at `/dashboard/inventory` for global stock orchestration.

### Critical Files
- `src/modules/inventory/services/update-stock.service.ts`: Logic for stock movements and logging.
- `src/app/dashboard/audit/page.tsx`: The activity ledger (Audit Intelligence).

---

## 🏷️ 3. Barcode Module
The Barcode module provides the optical bridge between physical inventory and the digital OS.

### Key Features
*   **Optical Identity**: Uses **Code128** standard for high-density, reliable scanning.
*   **High-Fidelity Scanner**: A web-based camera scanner integrated into the dashboard for rapid product identification.
*   **Automated Labeling**: Generates barcodes automatically for every SKU in the catalog.
*   **Scan-to-Adjust**: Staff can scan a physical item to immediately open its stock adjustment interface, reducing manual entry errors.

### Critical Files
- `src/lib/barcodes.ts`: Barcode generation engine (bwip-js).
- `src/modules/products/components/barcode-scanner.tsx`: The optical capture component.
- `src/modules/products/components/barcode-visualizer.tsx`: Dashboard rendering of barcodes.

---

## 🛠️ Operational Guide

### Registering a New Product
1.  Navigate to **Inventory Command**.
2.  Click **"New Line"**.
3.  Fill in product metadata and upload images.
4.  Add variants (Sizes/Colors).
5.  Click **"Generate All SKUs"** to establish optical identities.
6.  Click **"Save Product"**.

### Adjusting Stock via Scanner
1.  In **Inventory Command**, click **"Scan Catalog"**.
2.  Grant camera permissions and align the physical barcode.
3.  Once identified, the **Adjust Stock** dialog will appear.
4.  Enter the quantity change (e.g., `+50`) and the reason.
5.  Click **"Commit Adjustment"**.

### Auditing Movements
1.  Navigate to **Audit Intelligence** (`/dashboard/audit`).
2.  View the immutable ledger of all recent operations.
3.  Filter by "Operation" or "Timestamp" to track specific changes.

---

**Certified by Antigravity AI Engine**
*Status: Production Ready*
