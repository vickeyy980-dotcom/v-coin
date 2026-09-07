import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminPanel } from '@/components/AdminPanel';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase.from('profiles').select('role,status').eq('id', user.id).single();
  if (me?.role !== 'admin' || me?.status !== 'active') redirect('/dashboard');

  const [{ data: profiles }, { data: wallets }] = await Promise.all([
    supabase.from('profiles').select('id,handle,full_name,role,status').order('created_at', { ascending: true }),
    supabase.from('wallets').select('user_id,balance,currency,address'),
  ]);

  const walletByUser = new Map((wallets ?? []).map((w) => [w.user_id, w]));
  const users = (profiles ?? []).map((p) => {
    const w = walletByUser.get(p.id);
    return {
      id: p.id,
      handle: p.handle,
      full_name: p.full_name,
      role: p.role as 'user' | 'admin',
      status: p.status as 'active' | 'blocked',
      balance: Number(w?.balance ?? 0),
      currency: w?.currency ?? 'VC',
      address: w?.address ?? '',
    };
  });

  return (
    <main className="mx-auto min-h-screen max-w-[480px] bg-bg px-5 py-6 text-cream">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-[12px] text-muted-2">V Coin</div>
          <h1 className="font-display text-[20px] font-bold">Admin dashboard</h1>
        </div>
        <Link href="/dashboard" className="rounded-xl border border-line px-3 py-2 text-[12px] text-brass">Wallet</Link>
      </div>
      <AdminPanel users={users} />
    </main>
  );
}
