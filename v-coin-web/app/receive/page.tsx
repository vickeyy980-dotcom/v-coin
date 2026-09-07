import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/ui';
import { CopyButton, CopyPill } from '@/components/CopyButton';

export default async function ReceivePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [{ data: wallet }, { data: profile }] = await Promise.all([
    supabase.from('wallets').select('address').eq('user_id', user.id).single(),
    supabase.from('profiles').select('handle').eq('id', user.id).single(),
  ]);

  const address = wallet?.address ?? '';
  const qrSvg = await QRCode.toString(address || 'v-coin:unknown', {
    type: 'svg',
    margin: 1,
    color: { dark: '#14161F', light: '#EEEAE0' },
  });

  return (
    <div className="flex flex-1 flex-col px-5 pb-6 pt-2">
      <TopBar title="Receive" backHref="/dashboard" />

      <div className="mt-2 flex flex-col items-center rounded-2xl bg-cream p-6">
        <div className="h-[180px] w-[180px]" dangerouslySetInnerHTML={{ __html: qrSvg }} />
        <div className="mt-4 font-display text-[15px] font-bold text-[#14161F]">@{profile?.handle ?? 'vicky.vc'}</div>
      </div>

      <div className="my-4">
        <CopyPill value={address} />
      </div>

      <div className="flex gap-2.5">
        <CopyButton value={address} label="Copy address" />
      </div>

      <p className="mt-4 text-center text-[12px] leading-relaxed text-muted">
        Only send V Coin (VC) to this address. Sending other assets may result in permanent loss.
      </p>
    </div>
  );
}
