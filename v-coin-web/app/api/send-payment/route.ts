import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/send-payment  { receiverHandle: string, amount: number }
//
// This is the endpoint the Send screen's "Review transfer" button
// ultimately calls. All the real validation — balance check, locking,
// atomic debit/credit — happens inside the transfer_funds() Postgres
// function (see supabase/schema.sql), not here. This route's job is
// just to authenticate the request and pass it through, so the money
// logic lives in exactly one place.
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const body = await request.json();
  const { receiverHandle, amount } = body as { receiverHandle?: string; amount?: number };

  if (!receiverHandle || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'receiverHandle and a positive amount are required' }, { status: 400 });
  }

  const { data: transaction, error } = await supabase
    .rpc('transfer_funds', {
      receiver_handle: receiverHandle,
      transfer_amount: amount,
    })
    .single();

  if (error) {
    // transfer_funds() raises plain-text exceptions ("Insufficient
    // balance", "Recipient not found", ...) — safe to surface directly.
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ transaction });
}
