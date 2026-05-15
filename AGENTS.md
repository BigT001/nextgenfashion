<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

# ⚖️ NextGen Core Engineering Laws
These rules are MANDATORY and must be followed for every implementation:

1.  **Phase Maturity (RULE 1)**: NEVER rush ahead. Each phase must be fully functional, tested, and stable before proceeding.
2.  **Modular Decoupling (RULE 2)**: DO NOT tightly couple modules. Always communicate through services, queries, or events.
3.  **UI Purity (RULE 3)**: UI must remain logic-free. Core business logic belongs exclusively in the Service Layer.
4.  **Centralized Persistence (RULE 4)**: Database access must stay centralized in the Queries Layer. No direct Prisma calls in UI or Actions.
5.  **Aggressive Reusability (RULE 5)**: Build reusable components aggressively (Forms, Tables, Dialogs, Filters, Cards).
<!-- END:nextjs-agent-rules -->
