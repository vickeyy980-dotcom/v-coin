import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { BalanceCard, IconChip, QuickAction, SectionHeader, TxRow } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';

export default async function DashboardPage() {
  const { supabase, profile } = await requireUser();
  const [{ data: wallet }, { data: tx }] = await Promise.all([
    supabase.from('wallets').select('vcoin_balance,locked_balance,status').eq('user_id', profile.id).single(),
    supabase.from('wallet_transactions').select('id,transaction_type,direction,amount,created_at').order('created_at',{ascending:false}).limit(5),
  ]);

  const available = Number(wallet?.vcoin_balance || 0) - Number(wallet?.locked_balance || 0);
  const name = profile.full_name || profile.username;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 px-5 pb-7 pt-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-[12px] text-muted-2">Welcome back</div>
            <h1 className="mt-0.5 font-display text-[20px] font-bold">{name}</h1>
          </div>
          <Link href="/profile"><IconChip name="user" size={38} radius={19} color="text-cream" /></Link>
        </div>

        <BalanceCard
          label="Available balance"
          amount={`${available.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})} VC`}
          fiat={`Locked ${Number(wallet?.locked_balance || 0).toFixed(2)} VC`}
          changeLabel={wallet?.status === 'active' ? 'Wallet active' : 'Wallet frozen'}
        />

        <div className="my-6 grid grid-cols-4 gap-3">
          <QuickAction name="send" label="Send" href="/send" />
          <QuickAction name="receive" label="Receive" href="/receive" />
          <QuickAction name="scan" label="Scan" href="/scan" />
          <QuickAction name="plus" label="Top up" href="/topup" />
        </div>

        <SectionHeader title="Recent activity" actionLabel="View all" actionHref="/history" />
        <div className="rounded-2xl border border-line bg-panel2 px-3">
          {tx?.length ? tx.map((row:any) => {
            const received = row.direction === 'CREDIT';
            return (
              <TxRow
                key={row.id}
                direction={received ? 'received' : 'sent'}
                name={row.transaction_type.replaceAll('_',' ')}
                time={new Date(row.created_at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}
                amount={`${received ? '+' : '-'}${Number(row.amount).toFixed(2)} VC`}
              />
            );
          }) : <p className="py-6 text-center text-[13px] text-muted-2">No transactions yet.</p>}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
