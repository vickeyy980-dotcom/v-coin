# V Coin – Next.js + Supabase + Vercel

This repository implements the PDF specification as a deployable MVP: role hierarchy (super admin/admin/master/user), wallets, username/address transfers, immutable ledger, configurable charges and commissions, top-up/crypto/bank requests, audit logs, permissions, admin credit/debit, master dashboard, and daily maintenance cron.

## Quick start
1. Create a Supabase project.
2. Run `supabase/schema.sql` in SQL Editor.
3. Run `supabase/seed.sql` (optional defaults).
4. Copy `.env.local.example` to `.env.local` and fill values. **Never expose the service-role key in browser code.**
5. `npm install && npm run dev`.
6. Push to GitHub and import the repo into Vercel. Add the same environment variables, including `BANK_DATA_ENCRYPTION_KEY`. Generate it with `openssl rand -base64 32` or an equivalent secure generator.
7. Sign up the first account, then run the SQL shown in `supabase/make_admin.sql` after replacing the email.

## Core security
All wallet balance changes happen through SECURITY DEFINER database functions that lock the wallet row, write a ledger record, and use idempotency keys. Direct client balance updates are blocked by RLS.

## Production note
This is an application baseline, not a substitute for a security audit or legal review. If VC represents real value or converts to bank/crypto value, add KYC/AML, secure secret management, encryption/key management for bank data, monitoring, rate limiting, fraud controls, reconciliation, backups, and jurisdiction-specific compliance before launch.

## Previous-design UI merge
This package keeps the PDF-spec Supabase schema, secure transfer/admin/request APIs, and financial ledger logic, while restoring the earlier mobile dark-navy + brass/gold V Coin user interface for Login, Signup, Dashboard, Assets, Send, Receive, Scan, Activity, and Profile.

## Previous UI restoration
This package restores the original compact dark-navy/gold wallet UI. The user application is intentionally constrained to a 480px mobile-wallet shell on desktop while keeping the current Supabase financial backend and API routes.
