# GitHub + Vercel deployment

## 1. Supabase
Run `supabase/schema.sql` in the Supabase SQL Editor.

Copy these values from Supabase Project Settings -> API:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. GitHub
Create an empty GitHub repository, then upload the contents of this project (not the outer ZIP folder). Do **not** upload `.env.local`.

Or from the project folder:

```bash
git init
git add .
git commit -m "Initial V Coin app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

## 3. Vercel
Import the GitHub repository into Vercel. Framework should be detected as Next.js.

Add the two Supabase environment variables above for Production, Preview, and Development, then deploy.

## 4. Supabase Auth URL settings
After Vercel gives you a domain, add it in Supabase Authentication -> URL Configuration as your Site URL / allowed redirect origin as appropriate.

## 5. Test
Create two accounts at `/signup`. Give one test account balance using the optional development SQL in `supabase/sample_data.sql`, then send VC to the other account by handle or by scanning/copying its Receive wallet address.
