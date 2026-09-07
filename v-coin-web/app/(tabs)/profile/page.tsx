import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileSettings } from '@/components/ProfileSettings';

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('handle, full_name, role, status')
    .eq('id', user.id)
    .single();

  const displayName =
    profile?.full_name ||
    profile?.handle ||
    'Vicky';

  const initial = displayName.charAt(0).toUpperCase();

  const isAdmin =
    profile?.role === 'admin' &&
    profile?.status === 'active';

  return (
    <div>
      <div className="mb-6 flex flex-col items-center">
        <div className="mb-3 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gradient-to-br from-brass to-brass-dim font-display text-[28px] font-extrabold text-[#1A1406]">
          {initial}
        </div>

        <div className="font-display text-[18px] font-bold">
          {displayName}
        </div>

        <div className="mt-0.5 text-[12.5px] text-muted-2">
          {profile?.handle
            ? `@${profile.handle}`
            : user.email}
        </div>
      </div>

      {isAdmin && (
        <div className="mb-5">
          <Link
            href="/admin"
            className="flex w-full items-center justify-between rounded-2xl border border-[#D8AA4E]/30 bg-[#1B1E2C] px-5 py-4"
          >
            <div>
              <div className="font-semibold text-[#D8AA4E]">
                Admin Panel
              </div>

              <div className="mt-1 text-[12px] text-muted-2">
                Manage users and add VC
              </div>
            </div>

            <span className="text-xl text-[#D8AA4E]">
              →
            </span>
          </Link>
        </div>
      )}

      <ProfileSettings />
    </div>
  );
}
