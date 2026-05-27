-- Add explicit grants so Supabase Data API can access public schema tables
-- Created: 2026-05-27
-- NOTE: Adjust roles (anon/authenticated) as appropriate for your app.

-- Read-only access for anonymous clients (public catalog)
GRANT SELECT ON TABLE public."Category" TO anon;
GRANT SELECT ON TABLE public."Product" TO anon;
GRANT SELECT ON TABLE public."ProductVariant" TO anon;

-- Authenticated users: allow create/read/update/delete for customer and order flows
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Customer" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Sale" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."SaleItem" TO authenticated;

-- Allow authenticated users to read/update inventory where appropriate
GRANT SELECT, UPDATE ON TABLE public."Inventory" TO authenticated;

-- If you use sequences (serial IDs), also grant USAGE/SELECT on those sequences.
-- Example (none used by default here):
-- GRANT USAGE, SELECT ON SEQUENCE public.my_table_id_seq TO anon;

-- Sensitive tables (auth, sessions, accounts, audit logs) intentionally left without broad grants.
