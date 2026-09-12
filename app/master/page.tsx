import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { Nav } from '@/components/Nav';

export const dynamic = 'force-dynamic';

export default async function MasterPage() {
  const { supabase, profile } = await requireUser();

  if (profile.role !== 'master' && profile.role !== 'admin' && profile.role !== 'super_admin') {
    redirect('/dashboard');
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('id,username,full_name,status,wallets(vcoin_balance)')
    .eq('master_id', profile.id)
    .order('created_at', { ascending: false });

  const { data: commissions } = await supabase
    .from('commissions')
    .select('master_commission')
    .eq('master_id', profile.id);

  const totalCommission = (commissions || []).reduce(
    (sum, row) => sum + Number(row.master_commission || 0),
    0
  );

  return (
    <main className="wrap">
      <h1>Master dashboard</h1>
      <div className="gridcards">
        <div className="card" style={{ padding: 18 }}>
          Users
          <h2>{users?.length || 0}</h2>
        </div>
        <div className="card" style={{ padding: 18 }}>
          Commission
          <h2>{totalCommission.toFixed(2)} VC</h2>
        </div>
      </div>
      <div className="card" style={{ padding: 18 }}>
        {users?.length ? (
          users.map((row: any) => (
            <p key={row.id}>
              @{row.username} · {row.status} · {Number(row.wallets?.[0]?.vcoin_balance || 0).toFixed(2)} VC
            </p>
          ))
        ) : (
          <p>No assigned users.</p>
        )}
      </div>
      <Nav role={profile.role} />
    </main>
  );
}
