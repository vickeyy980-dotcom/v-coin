import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { IconChip } from '@/components/ui';
import { HistoryList } from '@/components/HistoryList';

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [{ data: wallet }, { data: transactions }] = await Promise.all([
    supabase.from('wallets').select('currency').eq('user_id', user.id).single(),
    supabase
      .from('transactions')
      .select(
        `id, amount, created_at,
         sender:wallets!transactions_sender_wallet_id_fkey(user_id)`
      )
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const rows =
    transactions?.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      created_at: t.created_at,
      direction: ((t.sender as any)?.user_id === user.id ? 'sent' : 'received') as 'sent' | 'received',
    })) ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-[19px] font-bold">Activity</h1>
        <IconChip name="bell" size={34} radius={17} color="text-cream" />
      </div>
      <HistoryList rows={rows} currency={wallet?.currency ?? 'VC'} />
    </div>
  );
}
