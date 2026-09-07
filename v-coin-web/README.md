# V Coin Web

GitHub/Vercel-ready V Coin P2P wallet built with Next.js 14, TypeScript, Tailwind CSS, Supabase Auth, Postgres and Row Level Security.

## Included

- Email/password signup and login
- Automatic profile + wallet creation after signup
- Dashboard with live Supabase balance and recent activity
- Send VC by `@handle` or wallet address
- Receive page with a real QR code for the wallet address
- Atomic Postgres transfer function with balance checks and row locking
- Transaction history with sent/received filters
- Wallet/profile/notification screens
- Supabase RLS policies
- Re-runnable database setup SQL
- Optional development sample-data SQL
- Vercel configuration and GitHub Actions build workflow

## Local setup

```bash
npm ci
cp .env.local.example .env.local
```

Fill `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Run `supabase/schema.sql` in Supabase SQL Editor, then:

```bash
npm run dev
```

Open `http://localhost:3000/signup` and create two test accounts.

## Database files

- `supabase/schema.sql` — complete database, RLS, signup trigger and transfer backend
- `supabase/migrations/202609070001_v_coin_initial.sql` — same setup in migration form
- `supabase/sample_data.sql` — optional test-wallet balance helper
- `supabase/README.md` — Supabase setup steps

## Deployment

See `DEPLOYMENT.md` for GitHub, Supabase and Vercel steps.

## Security notes

The browser only uses the Supabase anon key. Do not put the Supabase service-role key in frontend code or any `NEXT_PUBLIC_*` variable. Wallet balances cannot be directly updated through client RLS; P2P transfers go through `transfer_funds()` in Postgres.

The current project is an MVP. Face/biometric UI is not a real biometric security implementation, and production money/asset systems need additional auditing, abuse controls, monitoring, recovery processes and regulatory review.
