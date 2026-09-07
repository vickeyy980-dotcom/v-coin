import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileSettings } from '@/components/ProfileSettings';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('handle, full_name').eq('id', user.id).single();

  const displayName = profile?.full_name || profile?.handle || 'Vicky';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div>
      <div className="mb-6 flex flex-col items-center">
        <div className="mb-3 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gradient-to-br from-brass to-brass-dim font-display text-[28px] font-extrabold text-[#1A1406]">
          {initial}
        </div>
        <div className="font-display text-[18px] font-bold">{displayName}</div>
        <div className="mt-0.5 text-[12.5px] text-muted-2">@{profile?.handle ?? 'vicky.vc'}</div>
      </div>

      <ProfileSettings />
    </div>
  );
}
