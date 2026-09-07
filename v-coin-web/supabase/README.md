# Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** and run `schema.sql`.
3. In **Authentication -> Providers -> Email**, keep Email enabled.
4. For easy testing, either disable email confirmation temporarily or confirm the signup email normally.
5. Copy **Project URL** and the **anon/public key** into `.env.local` and Vercel environment variables.
6. Create two accounts at `/signup` and test a transfer using `@handle` or the QR wallet address.

`sample_data.sql` contains an optional development-only balance credit example. Do not expose a service-role key in the browser and do not add a public wallet-update policy.
