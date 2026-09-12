import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { AssetRow, IconChip, PrimaryButton } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';

export default async function AssetsPage() {
  const { supabase, profile } = await requireUser();
  const { data: wallet } = await supabase
    .from('wallets')
    .select('vcoin_balance,locked_balance,status')
    .eq('user_id', profile.id)
    .single();

  const total = Number(wallet?.vcoin_balance || 0);
  const locked = Number(wallet?.locked_balance || 0);
  const available = total - locked;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="font-display text-[19px] font-bold">Your assets</h1>
          <IconChip name="bell" size={34} radius={17} color="text-cream" />
        </div>

        <div className="mb-5">
          <div className="text-[12.5px] text-muted">Combined value</div>
          <div className="mt-1 font-display text-[28px] font-extrabold tabular-nums">
            ${available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <AssetRow
          mono="VC"
          name="V Coin"
          holding={`${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VC`}
          value={`$${available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={wallet?.status === 'active' ? 'Active' : 'Frozen'}
          changeColor={wallet?.status === 'active' ? 'text-green' : 'text-red'}
        />

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link href="/topup" className="rounded-2xl border border-line bg-panel2 p-4">
            <div className="text-[14px] font-semibold text-cream">Top up</div>
            <div className="mt-1 text-[11.5px] text-muted-2">Request more VC</div>
          </Link>
          <Link href="/crypto" className="rounded-2xl border border-line bg-panel2 p-4">
            <div className="text-[14px] font-semibold text-cream">Crypto</div>
            <div className="mt-1 text-[11.5px] text-muted-2">Conversion request</div>
          </Link>
          <Link href="/bank" className="rounded-2xl border border-line bg-panel2 p-4">
            <div className="text-[14px] font-semibold text-cream">Bank transfer</div>
            <div className="mt-1 text-[11.5px] text-muted-2">Convert VC to bank</div>
          </Link>
          <Link href="/history" className="rounded-2xl border border-line bg-panel2 p-4">
            <div className="text-[14px] font-semibold text-cream">History</div>
            <div className="mt-1 text-[11.5px] text-muted-2">Wallet ledger</div>
          </Link>
        </div>

        <div className="pb-2 pt-5">
          <PrimaryButton href="/topup">Add funds</PrimaryButton>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
