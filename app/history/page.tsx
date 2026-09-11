import { requireUser } from '@/lib/auth';
import { BottomNav } from '@/components/BottomNav';
import { HistoryList } from '@/components/HistoryList';
import { IconChip } from '@/components/ui';

export default async function HistoryPage(){
  const {supabase}=await requireUser();
  const {data:tx}=await supabase.from('wallet_transactions').select('id,amount,created_at,direction').order('created_at',{ascending:false}).limit(100);
  const rows=(tx||[]).map((x:any)=>({id:x.id,amount:Number(x.amount),created_at:x.created_at,direction:(x.direction==='CREDIT'?'received':'sent') as 'received'|'sent'}));
  return <div className="flex min-h-screen flex-col"><main className="flex-1 px-5 pb-7 pt-4"><div className="mb-4 flex items-center justify-between"><h1 className="font-display text-[20px] font-bold">Activity</h1><IconChip name="clock" size={36} radius={18} color="text-brass"/></div><HistoryList rows={rows} currency="VC"/></main><BottomNav/></div>
}
