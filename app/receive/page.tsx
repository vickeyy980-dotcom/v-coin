import { requireUser } from '@/lib/auth';
import { TopBar } from '@/components/ui';
import { QrCard } from '@/components/QrCard';
export default async function ReceivePage(){const {supabase,profile}=await requireUser();const {data:w}=await supabase.from('wallets').select('wallet_address').eq('user_id',profile.id).single();return <main className="flex min-h-screen flex-col px-5 pb-6 pt-2"><TopBar title="Receive" backHref="/dashboard"/>{w?<QrCard address={w.wallet_address} username={profile.username}/>:<p className="mt-6 text-center text-muted">Wallet not found.</p>}<p className="mt-4 text-center text-[12px] leading-relaxed text-muted">Only send V Coin (VC) to this address.</p></main>}
