**Supabase Data API Grants — Why and How**

Summary
- Supabase will require explicit GRANTs for tables in `public` schema for the Data API to access them in new projects (effective May 30, 2026). Existing projects keep the old behavior until Oct 30, 2026.

What I added
- A new SQL migration at `prisma/migrations/20260527000000_add_api_grants/migration.sql` with recommended `GRANT` statements for common tables used by this app.

How to apply
1. Preferred (Prisma-managed):

   - If you use Prisma Migrate as intended, generate a migration instead of editing folders by running locally:

```bash
npx prisma migrate dev --name add-supabase-grants
```

   - Or, if you want to apply the SQL directly to your database (quick, manual):

```bash
psql "$DATABASE_URL" -f prisma/migrations/20260527000000_add_api_grants/migration.sql
```

2. Deploy to Supabase production:

   - Use `npx prisma migrate deploy` in CI/CD with `DATABASE_URL` pointed to your Supabase database, or paste the SQL into Supabase SQL editor and run it.

Security notes
- The example grants are pragmatic but conservative: read-only for `anon` on public product/category data, and CRUD for `authenticated` on customer/order tables. Adjust as needed.
- Do NOT grant broad access to `User`, `Account`, `Session`, `VerificationToken`, or `AuditLog` unless you intentionally want those accessible via the Data API.

If you'd like, I can:
- Generate a full Prisma migration instead of the manual SQL file.
- Run the migration against your development database now (requires access to `DATABASE_URL`).
- Tighten grants to only specific columns or add RLS policies instead (more secure).
