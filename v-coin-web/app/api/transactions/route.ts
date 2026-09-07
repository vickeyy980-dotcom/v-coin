import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/transactions — the signed-in user's send/receive history,
// newest first. Powers the dashboard's "Recent activity" list and the
// full Activity screen. RLS already restricts rows to transactions the
// user's own wallet is a party to, so no extra filtering is needed here.
export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') ?? '20');

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(
      `id, amount, status, created_at,
       sender_wallet_id, receiver_wallet_id,
       sender:wallets!transactions_sender_wallet_id_fkey(user_id, address),
       receiver:wallets!transactions_receiver_wallet_id_fkey(user_id, address)`
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Tag each row as sent/received from this user's point of view, since
  // the raw rows don't say which side the caller is on.
  const withDirection = transactions.map((t) => ({
    ...t,
    direction: (t.sender as any)?.user_id === user.id ? 'sent' : 'received',
  }));

  return NextResponse.json({ transactions: withDirection });
}
