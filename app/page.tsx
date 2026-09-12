import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status !== 'active') redirect('/login');

  if (profile.role === 'admin' || profile.role === 'super_admin') redirect('/admin');
  if (profile.role === 'master') redirect('/master');
  redirect('/dashboard');
}
