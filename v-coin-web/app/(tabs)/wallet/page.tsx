import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AssetRow, IconChip, PrimaryButton } from '@/components/ui';

export default async function WalletPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: wallet } = await supabase.from('wallets').select('balance, currency').eq('user_id', user.id).single();

  const balance = wallet?.balance ?? 0;
  const currency = wallet?.currency ?? 'VC';

  // Only one real holding exists in the schema today (the wallet's VC
  // balance). USD Reserve / Staked VC are shown as illustrative rows —
  // wire these up once those products exist as real tables.
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="font-display text-[19px] font-bold">Your assets</h1>
          <IconChip name="bell" size={34} radius={17} color="text-cream" />
        </div>

        <div className="mb-5">
          <div className="text-[12.5px] text-muted">Combined value</div>
          <div className="mt-1 font-display text-[28px] font-extrabold tabular-nums">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <AssetRow
          mono="VC"
          name="V Coin"
          holding={`${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`}
          value={`$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          change="+2.4%"
          changeColor="text-green"
        />
        <AssetRow mono="$" name="USD Reserve" holding="0.00 USD" value="$0.00" change="0.0%" />
      </div>

      <div className="pb-2 pt-4">
        <PrimaryButton href="/receive">Add funds</PrimaryButton>
      </div>
    </div>
  );
}
