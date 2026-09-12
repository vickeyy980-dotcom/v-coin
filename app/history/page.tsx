import { requireUser } from '@/lib/auth';
import { BottomNav } from '@/components/BottomNav';
import { HistoryList } from '@/components/HistoryList';
import { IconChip } from '@/components/ui';

export default async function HistoryPage() {
  const { supabase } = await requireUser();
  const { data: tx } = await supabase
    .from('wallet_transactions')
    .select('id,amount,created_at,direction')
    .order('created_at', { ascending: false })
    .limit(100);

  const rows = (tx || []).map((x: any) => ({
    id: x.id,
    amount: Number(x.amount),
    created_at: x.created_at,
    direction: (x.direction === 'CREDIT' ? 'received' : 'sent') as 'received' | 'sent',
  }));

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-[19px] font-bold">Activity</h1>
          <IconChip name="bell" size={34} radius={17} color="text-cream" />
        </div>
        <HistoryList rows={rows} currency="VC" />
      </div>
      <BottomNav />
    </div>
  );
}
