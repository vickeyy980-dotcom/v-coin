# V Coin - ADMIN ONLY ADD-ON

This ZIP is intentionally ADMIN ONLY. It does not contain user dashboard, user profile, send, receive, scan, assets, history, login, signup, global CSS, Supabase schema, or user-side components.

Copy the folders/files from this ZIP into your existing V Coin repository and choose Replace only for matching ADMIN files.

Required existing backend files in your current project:
- lib/auth.ts
- lib/supabase/admin.ts
- lib/supabase/server.ts
- existing Supabase schema/functions from the complete backend package

After copying:
1. npm run build
2. git add -A
3. git commit -m "Add admin panel only"
4. git pull --rebase origin main
5. git push origin main

Open /admin after Vercel deploy.
