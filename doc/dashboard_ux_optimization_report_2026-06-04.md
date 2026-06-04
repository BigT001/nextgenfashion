# NextGen Fashion — Engineering Report
## Dashboard UX Optimization & Inventory Intelligence Upgrade

**Author:** Samuel Stanley  
**Date:** June 4, 2026  
**Build Status:** ✅ Passed (`next build` — 0 errors, all 35 routes compiled)  
**Version:** v1.2.0-STABLE

---

## Executive Summary

This session focused on improving the admin dashboard's usability, data density, navigation flow, and visual polish. Key deliverables include fixing a hydration error, optimizing dashboard card density, implementing deep-link navigation from dashboard widgets to detail pages, upgrading the Stock Critical system to variant-level granularity, and eliminating a persistent layout gap between the sidebar and content area.

---

## 1. Hydration Error Fix — Navbar Nested Buttons

**Problem:** React hydration error caused by `<button>` nested inside `<button>` in the notification bell dropdown trigger. The `asChild` prop pattern (Radix-style) was being used with Base UI's `DropdownMenuTrigger`, which doesn't support that API.

**Solution:** Replaced `asChild` with the `render` prop — the correct Base UI pattern for composing custom trigger elements.

### File Modified
| File | Change |
|------|--------|
| `src/components/dashboard/navbar.tsx` | Switched `DropdownMenuTrigger` from `asChild` to `render={<Button ... />}` pattern |

---

## 2. Dashboard Card Density & Scrollable Containers

**Problem:** The Recent Sales, Stock Replenishment Alerts, and Top Performance Items cards displayed excessive whitespace and limited visible entries, forcing the admin to navigate away from the dashboard to see more data.

**Solution:**
- Reduced `CardHeader` vertical padding from `pb-6` to `pb-3` across all three dashboard cards
- Added scrollable containers with `max-h-[320px] overflow-y-auto` for internal card content
- Added `pr-1` padding to prevent scrollbar overlap with content

### Files Modified
| File | Change |
|------|--------|
| `src/app/dashboard/dashboard-client.tsx` | Reduced card header padding, added scrollable containers |
| `src/modules/analytics/queries/analytics.queries.ts` | Increased `take` limit from 8 → 50 for recent sales and stock alerts queries |

---

## 3. Dashboard Deep-Link Navigation

**Problem:** Dashboard cards (Recent Sales, Stock Alerts) displayed summary data but clicking items had no navigation — admins had to manually navigate to Orders or Products pages to find the relevant item.

**Solution:** Implemented clickable deep-link navigation with automatic modal opening:

- **Recent Sales items** → Navigate to `/dashboard/orders?id={orderId}` → Auto-opens the Order Intelligence Details modal
- **Stock Replenishment items** → Navigate to `/dashboard/products?id={productId}` → Auto-opens the Catalog Modification (Edit Product) modal

### Files Modified
| File | Change |
|------|--------|
| `src/app/dashboard/dashboard-client.tsx` | Wrapped sale items in `<Link>` to orders page, stock items in `<Link>` to products page |
| `src/app/dashboard/orders/client.tsx` | Added `useEffect` to parse `?id=` query param and auto-open order detail modal |
| `src/app/dashboard/products/client.tsx` | Added `useEffect` to parse `?id=` query param and auto-trigger `handleEditProduct()` |

---

## 4. Stock Critical — Variant-Level Granularity

**Problem:** The Stock Critical metric card on the Inventory page counted products with total stock < 8. This was misleading — a product with 3 variants (sizes S, M, L) could show as "In Stock" even when size S had 0 units. The Critical Stock Ledger dialog also showed only product-level entries with no interactivity.

**Solution:**
- Changed `criticalProducts` (product-level) to `criticalVariants` (variant-level) using `flatMap` across all product variants
- Each variant in the Critical Stock Ledger now displays: product name, category, size, color, SKU, and exact stock count
- **Clickable variants:** Clicking any critical variant closes the dialog and immediately opens the Adjust Stock modal for that specific variant — enabling instant restocking without navigating away

### Files Modified
| File | Change |
|------|--------|
| `src/app/dashboard/inventory/client.tsx` | Replaced `criticalProducts` with `criticalVariants` flat-map; made dialog items clickable with direct stock adjustment |

### Before vs After
| Metric | Before | After |
|--------|--------|-------|
| Stock Critical count | Products with total stock < 8 | Individual variants with stock < 8 |
| Granularity | Product-level only | Variant-level (size, color, SKU) |
| Click action | None | Opens Adjust Stock modal |

---

## 5. Sidebar-to-Content Layout Gap Fix

**Problem:** A visible gray/navy line appeared between the dark sidebar and the white dashboard content area. This gap persisted through multiple fix attempts.

**Root Cause Analysis:**
1. An extra `<div className="flex bg-brand-mesh">` wrapper in `app-shell.tsx` created a layer behind the sidebar spacer div. Its translucent gradient background (brand-mesh) was visible in the gap as a gray seam.
2. The sidebar container in `sidebar.tsx` applied a conditional `group-data-[side=left]:border-r` class (1px border). The `border-r-0` override on the `<Sidebar>` component couldn't cancel it because the conditional selector has higher CSS specificity.

**Solution:**
- **Removed the extra wrapper div** — `AppSidebar` and `SidebarInset` are now direct children of `SidebarProvider`, which already provides a flex container. This follows the standard Shadcn layout pattern.
- **Removed the sidebar container border** — Stripped `group-data-[side=left]:border-r` and `group-data-[side=right]:border-l` from the sidebar container's default variant styles.
- **Set main content to `bg-background`** (clean white) to ensure any sub-pixel rendering gap is invisible.

### Files Modified
| File | Change |
|------|--------|
| `src/components/dashboard/app-shell.tsx` | Removed wrapper div; `AppSidebar` + `SidebarInset` are now direct children of `SidebarProvider` |
| `src/components/ui/sidebar.tsx` | Removed `border-r` / `border-l` from sidebar container default variant |

---

## Complete File Change Log

| # | File | Type | Description |
|---|------|------|-------------|
| 1 | `src/components/dashboard/navbar.tsx` | Fix | Hydration error — nested button resolution |
| 2 | `src/app/dashboard/dashboard-client.tsx` | Feature | Card density, scrolling, deep-link navigation |
| 3 | `src/modules/analytics/queries/analytics.queries.ts` | Optimization | Increased query limits (8 → 50) |
| 4 | `src/app/dashboard/orders/client.tsx` | Feature | Auto-open order modal from URL param |
| 5 | `src/app/dashboard/products/client.tsx` | Feature | Auto-open edit modal from URL param |
| 6 | `src/app/dashboard/inventory/client.tsx` | Feature | Variant-level critical stock with clickable items |
| 7 | `src/components/dashboard/app-shell.tsx` | Fix | Removed wrapper div causing sidebar gap |
| 8 | `src/components/ui/sidebar.tsx` | Fix | Removed sidebar container border |

---

## Build Verification

```
▲ Next.js 16.2.6 (Turbopack)
✓ Compiled successfully in 3.7s
✓ Finished TypeScript in 3.7s
✓ Collecting page data using 9 workers in 295ms
✓ Generating static pages using 9 workers (25/25) in 5.5s
✓ Finalizing page optimization in 7ms

35 routes compiled — 0 errors
```

---

## 6. Expandable Inventory Rows — Variant Breakdown

**Problem:** The inventory table showed only product-level data. Admins had no way to inspect individual variant stock levels (by size, color) without navigating to the product edit page.

**Solution:**
- **Backend:** Updated `getInventoryDashboardAction` in `inventory.actions.ts` to fetch audit logs for all product variants (not just the primary). Each product now returns a full variants array with sizes, colors, stock, low stock thresholds, and individual movement history.
- **Frontend:** Modified `client.tsx` to use `DataTable`'s `renderSubComponent` prop. Clicking any product row expands a responsive grid of variant cards.

### Variant Card Details
| Data Point | Description |
|------------|-------------|
| Variant SKU | Unique identifier badge per variant |
| Size & Color | Distinct tags for each variant attribute |
| Stock Units | Exact available stock for that variant |
| Last Movement | Badge showing Sales Outflow, Stock Increment, etc. |
| Low Stock Flag | Amber "Low Stock" badge when at/below threshold |
| Out of Stock Flag | Rose "Out of Stock" badge for depleted variants |
| Quick Adjust (⚡) | Direct stock modification button per variant |

### Files Modified
| File | Change |
|------|--------|
| `src/modules/inventory/actions/inventory.actions.ts` | Expanded variant data fetching with per-variant audit logs |
| `src/app/dashboard/inventory/client.tsx` | Added `renderSubComponent` with expandable variant grid |

---

## 7. Movement History Dialog — Per-Variant Tracking

**Problem:** The Movement History modal only showed logs for the primary variant. Admins couldn't see which specific size/color variant was affected by a stock movement.

**Solution:**
- **Backend:** Upgraded the audit log query and server action to fetch logs for all variants belonging to a product.
- **Frontend:** Each movement entry now displays variant-specific Size and Color tags, enabling precise tracking of which variant is shifting.

### Movement Types Tracked
| Movement | Trigger |
|----------|---------|
| Sales Outflow | Customer checkout / POS flows |
| Stock Increment | Restocks / Manual additions |
| Stock Decrement | Shrinkage / Damage / Returns |
| Suspend / Activate | Product visibility status changes |

### Files Modified
| File | Change |
|------|--------|
| `src/modules/inventory/actions/inventory.actions.ts` | Aggregated audit logs across all variants |
| `src/modules/inventory/components/inventory-history-viewer.tsx` | Added size/color tags to each movement entry |

---

## 8. Inventory KPI Cards — 4-Card Layout with Critical Threshold

**Problem:** The inventory page needed a clear, at-a-glance overview of catalog health with a consistent critical stock threshold.

**Solution:**
- Implemented 4 responsive metric cards in the inventory dashboard:

| Card | Data |
|------|------|
| Total Products | Total SKUs in the catalog |
| Total Stock Units | Sum of all physical stock across all products |
| Stock Critical | Count of products with < 8 units (clickable → opens dialog) |
| Inventory Value | Aggregated stock asset value (₦) |

- **Critical Threshold:** Standardized to < 8 units across the entire system:
  - `criticalProducts` / `criticalVariants` client filter
  - Quantity column highlight (turns red when stock < 8)
  - `stockAlerts` KPI computed in backend action
  - Critical Stock Dialog description text

### Files Modified
| File | Change |
|------|--------|
| `src/app/dashboard/inventory/client.tsx` | 4-card KPI grid with < 8 threshold |
| `src/modules/inventory/actions/inventory.actions.ts` | Backend `stockAlerts` count using < 8 |

---

## 9. Global Search Bar — Universal Product/Order/Category Search

**Problem:** The search bar in the dashboard header was non-functional — it was purely decorative with no search capability.

**Solution:**
- Built a fully functional universal search system activated by click or `Cmd/Ctrl + K`.
- Performs real-time search across Products, Categories, and Orders with debounced input (300ms).
- Results appear in a polished dropdown panel grouped by entity type with navigable items.
- Click-outside and `Escape` key close the search panel.

### Architecture
```
User Input → debounced 300ms → universalSearchAction() → Prisma queries
  → Products (name match)
  → Orders (orderNumber match)
  → Categories (name match)
→ Grouped results rendered in dropdown
```

### Files Modified
| File | Change |
|------|--------|
| `src/components/dashboard/navbar.tsx` | Search UI, keyboard shortcuts, result rendering |
| `src/modules/search/actions/search.actions.ts` | `universalSearchAction` server action |

---

## 10. Notification Bell — Live Activity Feed

**Problem:** The notification bell icon in the header was non-functional — no data, no indicators, no interaction.

**Solution:**
- Built a dedicated server action that checks for both recent Orders and inbound Emails from the Mailroom.
- The bell now:
  - **Polls automatically** every 60 seconds for new activity
  - **Shows a red badge** with count when unread/new activity exists
  - **Animated ping** indicator for visual urgency
  - **Dropdown panel** with recent events from orders and mailroom
  - **Clickable items** that navigate to the relevant page
  - **Stale refresh** — re-fetches if data is > 30s old when dropdown opens

### Files Modified
| File | Change |
|------|--------|
| `src/components/dashboard/navbar.tsx` | Notification UI, polling, badge rendering |
| `src/modules/dashboard/actions/notifications.actions.ts` | `getNotificationsAction` server action |

---

## 11. Accurate Dashboard KPIs — Real Database Aggregation

**Problem:** Dashboard KPI values were hardcoded or using stale/incorrect data. The stock alerts list didn't properly display product names and sizes.

**Solution:**
- **Backend:** `getExecutiveKPIs` now pulls real totals from the database using Prisma aggregations.
- **Stock Alerts mapping** updated to properly display product names and sizes directly from `ProductVariant` records.
- **< 8 threshold** applied globally across both analytics and inventory alert systems.

### Files Modified
| File | Change |
|------|--------|
| `src/modules/analytics/queries/analytics.queries.ts` | Real database aggregations for KPIs |
| `src/app/dashboard/dashboard-client.tsx` | Corrected stock alert display mapping |

---

## 12. Sales Channel Detection — Online vs POS Classification

**Problem:** All recent sales in the dashboard were incorrectly displaying as "Offline" regardless of the actual transaction channel (web store vs POS terminal).

**Solution:**
- Updated the sales query to identify the transaction channel based on:
  - Presence of a registered customer record
  - Payment method type (Transfer = Online, Cash = POS)
- Web store transactions now correctly display as **"ONLINE"** with proper customer names or "Guest" labels
- POS transactions display as **"POS"** with terminal-specific identifiers

### Files Modified
| File | Change |
|------|--------|
| `src/modules/analytics/queries/analytics.queries.ts` | Sales channel detection logic |
| `src/app/dashboard/dashboard-client.tsx` | Channel badge rendering (ONLINE / POS) |

---

## Complete File Change Log (Full Session)

| # | File | Type | Description |
|---|------|------|-------------|
| 1 | `src/components/dashboard/navbar.tsx` | Fix + Feature | Hydration fix, global search, notifications |
| 2 | `src/app/dashboard/dashboard-client.tsx` | Feature | Card density, scrolling, deep-links, KPIs, channel badges |
| 3 | `src/modules/analytics/queries/analytics.queries.ts` | Optimization | Query limits, real KPIs, sales channel detection |
| 4 | `src/app/dashboard/orders/client.tsx` | Feature | Auto-open order modal from URL param |
| 5 | `src/app/dashboard/products/client.tsx` | Feature | Auto-open edit modal from URL param |
| 6 | `src/app/dashboard/inventory/client.tsx` | Feature | Expandable variants, critical stock, KPI cards |
| 7 | `src/modules/inventory/actions/inventory.actions.ts` | Feature | Full variant data, per-variant audit logs |
| 8 | `src/modules/inventory/components/inventory-history-viewer.tsx` | Feature | Per-variant movement tracking with size/color tags |
| 9 | `src/components/dashboard/app-shell.tsx` | Fix | Removed wrapper div causing sidebar gap |
| 10 | `src/components/ui/sidebar.tsx` | Fix | Removed sidebar container border |
| 11 | `src/modules/search/actions/search.actions.ts` | Feature | Universal search server action |
| 12 | `src/modules/dashboard/actions/notifications.actions.ts` | Feature | Live notification aggregation |

---

## Build Verification

```
▲ Next.js 16.2.6 (Turbopack)
✓ Compiled successfully in 3.7s
✓ Finished TypeScript in 3.7s
✓ Collecting page data using 9 workers in 295ms
✓ Generating static pages using 9 workers (25/25) in 5.5s
✓ Finalizing page optimization in 7ms

35 routes compiled — 0 errors
```

---

*Report generated for NextGen Fashion Business Suite — Samuel Stanley*
