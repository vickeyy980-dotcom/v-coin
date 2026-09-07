import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TopBar, DateLabel, IconChip } from '@/components/ui';

// NOTE: there's no notifications table in the schema yet — these rows are
// derived from recent transactions so the screen isn't empty. For real
// push-style notifications (security alerts, marketing, etc.) add a
// `notifications` table and a row per event instead.
export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: transactions } = await supabase
    .from('transactions')
    .select(
      `id, amount, created_at,
       sender:wallets!transactions_sender_wallet_id_fkey(user_id)`
    )
    .order('created_at', { ascending: false })
    .limit(10);

  const items =
    transactions?.map((t) => {
      const received = (t.sender as any)?.user_id !== user.id;
      return {
        id: t.id,
        title: received ? 'Payment received' : 'Payment sent',
        desc: received ? `You received ${Number(t.amount).toFixed(2)} VC` : `Your transfer of ${Number(t.amount).toFixed(2)} VC was completed`,
        time: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        icon: received ? ('receive' as const) : ('send' as const),
      };
    }) ?? [];

  return (
    <div>
      <TopBar title="Notifications" backHref="/dashboard" />
      {items.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted-2">Nothing yet.</p>
      ) : (
        <>
          <DateLabel>Recent</DateLabel>
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 border-b border-line py-3.5 last:border-none">
              <IconChip name={item.icon} size={36} radius={11} />
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold">{item.title}</div>
                <div className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{item.desc}</div>
                <div className="mt-1 text-[11px] text-muted-2">{item.time}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
