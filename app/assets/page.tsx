import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { AssetRow, IconChip, SectionHeader } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';

export default async function AssetsPage(){
  const {supabase,profile}=await requireUser();
  const {data:w}=await supabase.from('wallets').select('vcoin_balance,locked_balance,status').eq('user_id',profile.id).single();
  const available=Number(w?.vcoin_balance||0)-Number(w?.locked_balance||0);
  return <div className="flex min-h-screen flex-col"><main className="flex-1 px-5 pb-7 pt-4">
    <div className="mb-5 flex items-center justify-between"><h1 className="font-display text-[20px] font-bold">Your assets</h1><IconChip name="wallet" size={36} radius={18} color="text-brass"/></div>
    <div className="mb-5"><div className="text-[12.5px] text-muted">Available V Coin</div><div className="mt-1 font-display text-[30px] font-extrabold tabular-nums">{available.toFixed(2)} VC</div></div>
    <div className="rounded-2xl border border-line bg-panel2 px-3">
      <AssetRow mono="VC" name="V Coin" holding={`${Number(w?.vcoin_balance||0).toFixed(2)} total`} value={`${available.toFixed(2)} VC`} change={w?.status==='active'?'Active':'Frozen'} changeColor={w?.status==='active'?'text-green':'text-red'} />
    </div>
    <div className="mt-6"><SectionHeader title="Asset operations"/></div>
    <div className="grid grid-cols-2 gap-3">
      <Link href="/topup" className="rounded-2xl border border-line bg-panel2 p-4"><div className="text-brass">Top up</div><div className="mt-1 text-[12px] text-muted">Request more VC</div></Link>
      <Link href="/crypto" className="rounded-2xl border border-line bg-panel2 p-4"><div className="text-brass">Crypto</div><div className="mt-1 text-[12px] text-muted">Conversion request</div></Link>
      <Link href="/bank" className="rounded-2xl border border-line bg-panel2 p-4"><div className="text-brass">Bank transfer</div><div className="mt-1 text-[12px] text-muted">Convert VC to bank</div></Link>
      <Link href="/history" className="rounded-2xl border border-line bg-panel2 p-4"><div className="text-brass">History</div><div className="mt-1 text-[12px] text-muted">Wallet ledger</div></Link>
    </div>
  </main><BottomNav/></div>
}
