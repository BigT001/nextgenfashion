# NextGen Design System

This document outlines the technical and aesthetic standards for the **NextGen Fashion OS** UI/UX.

## 🎨 Visual Identity & Tokens

Our design system is built on **High-Fidelity Premium Aesthetics**, leveraging modern CSS features and brand-specific tokens.

### Colors (OKLCH)
- **NextGen Pink**: `oklch(0.65 0.25 15)` - Vibrant, high-energy actions.
- **NextGen Blue**: `oklch(0.6 0.2 250)` - Professional accents and information.
- **Background**: Modern neutral slate with glassmorphic layers.

### Premium Utilities
- **`.glass-card`**: High-blur, translucent container for secondary depth.
- **`.bg-brand-mesh`**: Interactive, radial-gradient background for the AppShell.
- **`.text-gradient`**: Multi-color brand gradient for headlines and primary metrics.

---

## 🏛️ Core Component Library

### 1. Structural Shell (`src/components/dashboard/app-shell.tsx`)
The master layout orchestration.
- Integrates `AppSidebar` and `Navbar`.
- Provides `SidebarProvider` context.
- Implements the animated `bg-brand-mesh` foundation.

### 2. High-Performance DataTable (`src/components/ui/data-table.tsx`)
A senior-level data explorer built on TanStack Table.
- **Searchable**: Integrated text filtering.
- **Sortable**: Interactive column headers.
- **Paginated**: Efficient large-dataset handling.
- **Aesthetic**: Glassmorphic rows with hover lifting.

### 3. Executive MetricCard (`src/components/dashboard/metric-card.tsx`)
KPI visualization with visual impact.
- **Variants**: Pink, Blue, and Slate presets.
- **Trends**: Integrated Up/Down indicators with high-fidelity color coding.
- **Iconography**: Support for any Lucide icon.

### 4. Feedback States
- **`EmptyState`**: Guiding UI for zero-result views.
- **`LoadingSpinner`**: Hardware-accelerated brand feedback.
- **`FullPageLoader`**: Celebratory transitional view for heavy data operations.

---

## 🛠️ Implementation Guidelines

1.  **Mobile First**: Always test on mobile breakpoints (375px) first. Use fluid Tailwind classes.
2.  **Animation**: Use `.animate-slow-fade` for page transitions to ensure a "living" interface.
3.  **Semantic HTML**: Ensure all interactive triggers use the `asChild` pattern or appropriate Base UI roles.
4.  **Tokenization**: Avoid ad-hoc hex codes; always use CSS variables or Tailwind brand classes (e.g., `bg-brand-pink`).
