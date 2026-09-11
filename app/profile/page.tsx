import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { ProfileSettings } from '@/components/ProfileSettings';
import { BottomNav } from '@/components/BottomNav';

export default async function ProfilePage(){
  const {profile}=await requireUser();
  const displayName=profile.full_name||profile.username||'V Coin User';
  const initial=displayName.charAt(0).toUpperCase();
  return <div className="flex min-h-screen flex-col"><main className="flex-1 px-5 pb-7 pt-5">
    <div className="mb-6 flex flex-col items-center">
      <div className="mb-3 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gradient-to-br from-brass to-brass-dim font-display text-[28px] font-extrabold text-[#1A1406]">{initial}</div>
      <div className="font-display text-[18px] font-bold">{displayName}</div>
      <div className="mt-0.5 text-[12.5px] text-muted-2">@{profile.username}</div>
      <div className="mt-2 rounded-full bg-brass-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brass">{profile.role}</div>
    </div>
    {(profile.role==='admin'||profile.role==='super_admin') && <Link href="/admin" className="mb-5 flex items-center justify-between rounded-2xl border border-brass/30 bg-panel2 px-4 py-4"><div><div className="font-semibold text-brass">Admin dashboard</div><div className="mt-1 text-[12px] text-muted">Manage users, VC and requests</div></div><span className="text-brass">→</span></Link>}
    {profile.role==='master' && <Link href="/master" className="mb-5 flex items-center justify-between rounded-2xl border border-brass/30 bg-panel2 px-4 py-4"><div><div className="font-semibold text-brass">Master dashboard</div><div className="mt-1 text-[12px] text-muted">Assigned users and commissions</div></div><span className="text-brass">→</span></Link>}
    <ProfileSettings/>
  </main><BottomNav/></div>
}
