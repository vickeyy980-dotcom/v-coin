import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import NotificationCenter from '@/components/NotificationCenter';
import { BottomNav } from '@/components/BottomNav';

export const dynamic='force-dynamic';
export const revalidate=0;

export default async function NotificationsPage(){
 const {supabase,profile}=await requireUser();
 const {data}=await supabase.from('notifications').select('id,title,message,type,is_read,reference_id,created_at').eq('user_id',profile.id).order('created_at',{ascending:false}).limit(100);
 return <div className="flex min-h-screen flex-1 flex-col bg-ink"><div className="flex-1 px-5 pb-24 pt-5"><div className="mb-6 flex items-center gap-3"><Link href="/dashboard" aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel text-xl">‹</Link><div><h1 className="font-display text-[22px] font-extrabold">Notifications</h1><p className="text-[12.5px] text-muted">Wallet and transfer updates</p></div></div><NotificationCenter userId={profile.id} initialRows={(data||[]) as any}/></div><BottomNav/></div>;
}
