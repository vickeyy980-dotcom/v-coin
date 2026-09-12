import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { AdminDesktopPanel } from '@/components/AdminDesktopPanel';

export default async function AdminPage() {
  const { supabase, profile } = await requireUser();
  if (!['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard');

  const [{ data: profiles }, { data: topups }, { data: crypto }, { data: banks }, { data: commissions }, { data: ledger }] = await Promise.all([
    supabase.from('profiles').select('id,username,full_name,email,role,status,master_id,wallets(wallet_address,vcoin_balance,status)').order('created_at',{ascending:false}),
    supabase.from('topup_requests').select('id,request_id,requested_vcoin,status,profiles!topup_requests_user_id_fkey(username)').order('created_at',{ascending:false}).limit(50),
    supabase.from('crypto_conversion_requests').select('id,request_id,vcoin_amount,status,profiles!crypto_conversion_requests_user_id_fkey(username)').order('created_at',{ascending:false}).limit(50),
    supabase.from('bank_transfer_requests').select('id,request_id,vcoin_amount,status,profiles!bank_transfer_requests_user_id_fkey(username)').order('created_at',{ascending:false}).limit(50),
    supabase.from('commissions').select('company_commission,master_commission'),
    supabase.from('wallet_transactions').select('id,transaction_type,amount,balance_before,balance_after,created_at,profiles:user_id(username)').order('created_at',{ascending:false}).limit(100)
  ]);

  const users=(profiles||[]).map((x:any)=>({
    id:x.id, username:x.username, full_name:x.full_name, email:x.email, role:x.role, status:x.status, master_id:x.master_id,
    balance:Number(x.wallets?.[0]?.vcoin_balance||0), address:x.wallets?.[0]?.wallet_address||null, wallet_status:x.wallets?.[0]?.status||'active'
  }));
  const requests:any[]=[];
  (topups||[]).forEach((x:any)=>requests.push({id:x.id,request_id:x.request_id,kind:'TOPUP',username:x.profiles?.username||'user',amount:Number(x.requested_vcoin),status:x.status}));
  (crypto||[]).forEach((x:any)=>requests.push({id:x.id,request_id:x.request_id,kind:'CRYPTO',username:x.profiles?.username||'user',amount:Number(x.vcoin_amount),status:x.status}));
  (banks||[]).forEach((x:any)=>requests.push({id:x.id,request_id:x.request_id,kind:'BANK',username:x.profiles?.username||'user',amount:Number(x.vcoin_amount),status:x.status}));
  const totalCommission=(commissions||[]).reduce((a:number,x:any)=>a+Number(x.company_commission||0)+Number(x.master_commission||0),0);
  const adminWallet=users.find((u:any)=>u.id===profile.id)?.balance||0;

  // Supabase can return joined profiles as an array. Normalize it to
  // the single object shape expected by AdminDesktopPanel.
  const normalizedLedger = (ledger || []).map((item:any) => ({
    id: item.id,
    transaction_type: item.transaction_type || '',
    amount: Number(item.amount || 0),
    balance_before: Number(item.balance_before || 0),
    balance_after: Number(item.balance_after || 0),
    created_at: item.created_at,
    profiles: Array.isArray(item.profiles)
      ? (item.profiles[0] || null)
      : (item.profiles || null),
  }));

  return (
    <AdminDesktopPanel
      signedInAs={profile.username || 'admin'}
      users={users}
      requests={requests}
      ledger={normalizedLedger}
      totalCommission={totalCommission}
      adminWallet={adminWallet}
    />
  );
}