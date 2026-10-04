import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { QuickAction, SectionHeader, IconChip } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';
import { BalanceCardLive } from '@/components/BalanceCardLive';
import { LiveRecentActivity } from '@/components/LiveRecentActivity';
import WalletReceiveAnimation from '@/components/WalletReceiveAnimation';

export const dynamic='force-dynamic';
export const revalidate=0;
function greeting(){const hour=new Date().getHours();if(hour<12)return 'Good morning';if(hour<18)return 'Good afternoon';return 'Good evening'}
export default async function DashboardPage(){
 const {supabase,profile}=await requireUser();
 const [{data:wallet},{data:transactions},{count:unreadCount}]=await Promise.all([
  supabase.from('wallets').select('id,vcoin_balance,locked_balance,status').eq('user_id',profile.id).single(),
  supabase.from('wallet_transactions').select('id,transaction_id,transaction_type,direction,amount,created_at,description,reference_id').order('created_at',{ascending:false}).limit(3),
  supabase.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',profile.id).eq('is_read',false)
 ]);
 const totalBalance=Number(wallet?.vcoin_balance||0);const displayName=profile.full_name||profile.username||'there';
 return <div className="flex flex-1 flex-col overflow-hidden">{wallet?.id&&<WalletReceiveAnimation walletId={wallet.id}/>}<div className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
  <div className="flex items-center justify-between"><div><div className="text-[12.5px] text-muted">{greeting()}</div><div className="font-display text-[19px] font-bold">{displayName}</div></div><Link href="/notifications" aria-label="Notifications" className="relative"><IconChip name="bell" size={34} radius={17} color="text-cream"/>{Number(unreadCount||0)>0&&<><span className="absolute right-[5px] top-[4px] h-[8px] w-[8px] rounded-full border-2 border-panel2 bg-red"/>{Number(unreadCount||0)>1&&<span className="absolute -right-2 -top-2 min-w-[18px] rounded-full bg-red px-1 text-center text-[10px] font-bold leading-[18px] text-white">{Number(unreadCount||0)>99?'99+':unreadCount}</span>}</>}</Link></div>
  <div className="mt-6"><BalanceCardLive userId={profile.id} initialBalance={totalBalance}/></div>
  <div className="my-6 flex justify-between"><QuickAction name="send" label="Send" href="/send"/><QuickAction name="receive" label="Receive" href="/receive"/><QuickAction name="scan" label="Scan" href="/scan"/><QuickAction name="plus" label="Top up" href="/topup"/></div>
  <div><SectionHeader title="Recent activity" actionLabel="See all" actionHref="/history"/><LiveRecentActivity userId={profile.id} walletId={wallet?.id || ''} initialRows={(transactions||[]).map((x:any)=>({...x,amount:Number(x.amount)}))}/></div>
 </div><BottomNav/></div>
}
