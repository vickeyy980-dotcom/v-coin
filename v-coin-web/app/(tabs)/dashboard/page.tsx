import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BalanceCard, QuickAction, SectionHeader, TxRow, IconChip } from '@/components/ui';
import Link from 'next/link';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [{ data: profile }, { data: wallet }, { data: transactions }] = await Promise.all([
    supabase.from('profiles').select('handle, full_name').eq('id', user.id).single(),
    supabase.from('wallets').select('balance, currency').eq('user_id', user.id).single(),
    supabase
      .from('transactions')
      .select(
        `id, amount, created_at,
         sender:wallets!transactions_sender_wallet_id_fkey(user_id),
         receiver:wallets!transactions_receiver_wallet_id_fkey(user_id)`
      )
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  const displayName = profile?.full_name || profile?.handle || 'there';
  const balance = wallet?.balance ?? 0;
  const currency = wallet?.currency ?? 'VC';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12.5px] text-muted">{greeting()}</div>
          <div className="font-display text-[19px] font-bold">{displayName}</div>
        </div>
        <Link href="/notifications" className="relative">
          <IconChip name="bell" size={34} radius={17} color="text-cream" />
          <span className="absolute right-[7px] top-[6px] h-[7px] w-[7px] rounded-full border-2 border-panel2 bg-red" />
        </Link>
      </div>

      <BalanceCard
        label="Total balance"
        amount={`${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`}
        fiat={`≈ $${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        changeLabel="↑ 2.4% today"
      />

      <div className="flex justify-between">
        <QuickAction name="send" label="Send" href="/send" />
        <QuickAction name="receive" label="Receive" href="/receive" />
        <QuickAction name="scan" label="Scan" href="/scan" />
        <QuickAction name="plus" label="Top up" href="/receive" />
      </div>

      <div>
        <SectionHeader title="Recent activity" actionLabel="See all" actionHref="/history" />
        {!transactions || transactions.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-muted-2">No transactions yet.</p>
        ) : (
          transactions.map((t) => {
            const received = (t.sender as any)?.user_id !== user.id;
            return (
              <TxRow
                key={t.id}
                direction={received ? 'received' : 'sent'}
                name={received ? 'Received' : 'Sent'}
                time={new Date(t.created_at).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' })}
                amount={`${received ? '+' : '-'}${Number(t.amount).toFixed(2)} ${currency}`}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
