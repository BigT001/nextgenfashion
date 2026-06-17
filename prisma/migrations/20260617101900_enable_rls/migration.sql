-- Enable Row Level Security (RLS) on all tables in public schema
ALTER TABLE public."Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Inventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProductVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Sale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SaleItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Warehouse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EmailMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EmailCampaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EmailSubscriber" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."_ProductToCategory" ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies to allow the Data API access granted in migration 20260527000000_add_api_grants
-- (Note: Prisma bypasses these policies because it connects via the postgres superuser role)

-- Category public select policy
CREATE POLICY "Allow public read access to Category" ON public."Category"
    FOR SELECT USING (true);

-- Product public select policy
CREATE POLICY "Allow public read access to Product" ON public."Product"
    FOR SELECT USING (true);

-- ProductVariant public select policy
CREATE POLICY "Allow public read access to ProductVariant" ON public."ProductVariant"
    FOR SELECT USING (true);

-- Join table select policy
CREATE POLICY "Allow public read access to _ProductToCategory" ON public."_ProductToCategory"
    FOR SELECT USING (true);

-- Customer authenticated CRUD policies
CREATE POLICY "Allow authenticated CRUD on Customer" ON public."Customer"
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sale authenticated CRUD policies
CREATE POLICY "Allow authenticated CRUD on Sale" ON public."Sale"
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SaleItem authenticated CRUD policies
CREATE POLICY "Allow authenticated CRUD on SaleItem" ON public."SaleItem"
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inventory authenticated SELECT/UPDATE policies
CREATE POLICY "Allow authenticated select and update on Inventory" ON public."Inventory"
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
