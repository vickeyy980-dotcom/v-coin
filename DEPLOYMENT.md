# V Coin deployment

## Recommended: fresh Supabase project
This package uses the PDF-spec schema (`profiles.username`, `wallets.vcoin_balance`, ledger, Admin/Master/User roles). Do not mix it with the older prototype schema that used `profiles.handle` or `wallets.balance`.

1. Create a new Supabase project.
2. In SQL Editor run `supabase/schema.sql`.
3. Run `supabase/seed.sql`.
4. If Auth already had users before the schema, run `supabase/BACKFILL_EXISTING_AUTH_USERS.sql`.
5. Sign up/login in the app.
6. Edit `supabase/make_admin.sql`, replace the placeholder email, and run it once.
7. Add Vercel environment variables from `.env.local.example`.
8. Deploy the GitHub repository root to Vercel.

## If you intentionally want to reuse a test Supabase database
`supabase/RESET_DEV_DATABASE.sql` deletes all V Coin public-schema data but keeps Supabase Auth users. Run it only when you accept that data loss. Then run `schema.sql`, `seed.sql`, and `BACKFILL_EXISTING_AUTH_USERS.sql` in that order.

## Important
Do not run `seed.sql` before `schema.sql`. The `permissions` table is created by `schema.sql`.
