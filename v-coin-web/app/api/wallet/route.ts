import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/wallet — returns the signed-in user's balance and address.
// Powers the Dashboard hero card and the Wallet screen.
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { data: wallet, error } = await supabase
    .from('wallets')
    .select('balance, currency, address')
    .eq('user_id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ wallet });
}
