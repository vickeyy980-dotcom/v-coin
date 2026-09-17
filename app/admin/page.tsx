import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { AdminDesktopPanel } from '@/components/AdminDesktopPanel';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  const { supabase, profile } = await requireUser();
  if (!['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard');

  const [profilesR, topupsR, cryptoR, banksR, commissionsR, ledgerR, chargesR, commissionRulesR, permissionsR, userPermsR, auditR] = await Promise.all([
    supabase.from('profiles').select('id,username,full_name,email,role,status,master_id,wallets(wallet_address,vcoin_balance,status)').order('created_at',{ascending:false}),
    supabase.from('topup_requests').select('id,request_id,requested_vcoin,topup_charge,total_payment,status,created_at,profiles!topup_requests_user_id_fkey(username)').order('created_at',{ascending:false}).limit(100),
    supabase.from('crypto_conversion_requests').select('id,request_id,vcoin_amount,conversion_charge,network_charge,final_crypto_amount,status,created_at,profiles!crypto_conversion_requests_user_id_fkey(username)').order('created_at',{ascending:false}).limit(100),
    supabase.from('bank_transfer_requests').select('id,request_id,vcoin_amount,transfer_charge,final_bank_amount,status,created_at,profiles!bank_transfer_requests_user_id_fkey(username)').order('created_at',{ascending:false}).limit(100),
    supabase.from('commissions').select('id,master_id,user_id,transaction_type,transaction_reference,total_charge,master_commission,company_commission,created_at').order('created_at',{ascending:false}).limit(200),
    supabase.from('wallet_transactions').select('id,transaction_id,transaction_type,direction,amount,balance_before,balance_after,description,created_at,wallets!wallet_transactions_wallet_id_fkey(profiles!wallets_user_id_fkey(username))').order('created_at',{ascending:false}).limit(250),
    supabase.from('charge_rules').select('id,master_id,charge_type,charge_mode,charge_value,minimum_charge,maximum_charge,is_active,created_at').eq('is_active',true).order('created_at',{ascending:false}),
    supabase.from('commission_rules').select('id,master_id,master_percentage,company_percentage,is_active').eq('is_active',true),
    supabase.from('permissions').select('code,label').order('code'),
    supabase.from('user_permissions').select('user_id,permission_code,granted'),
    supabase.from('audit_logs').select('id,user_id,action,module,reference_id,new_data,created_at').order('created_at',{ascending:false}).limit(200),
  ]);

  // Supabase can return a one-to-one relation as either an object or a one-item array.
  // Normalize it here so a frozen wallet never gets incorrectly displayed as active.
  const getWallet=(value:any)=>Array.isArray(value)?value[0]??null:value??null;
  const users=(profilesR.data||[]).map((x:any)=>{
    const wallet=getWallet(x.wallets);
    return {
      id:x.id, username:x.username, full_name:x.full_name, email:x.email, role:x.role, status:x.status, master_id:x.master_id,
      balance:Number(wallet?.vcoin_balance||0), address:wallet?.wallet_address||null, wallet_status:wallet?.status||'active'
    };
  });
  const profileName=new Map(users.map((u:any)=>[u.id,u.username]));
  const joinUsername=(v:any)=>Array.isArray(v)?v[0]?.username:v?.username;
  const requests:any[]=[];
  (topupsR.data||[]).forEach((x:any)=>requests.push({id:x.id,request_id:x.request_id,kind:'TOPUP',username:joinUsername(x.profiles)||'user',amount:Number(x.requested_vcoin),charge:Number(x.topup_charge||0),final_amount:Number(x.total_payment||x.requested_vcoin),status:x.status,created_at:x.created_at}));
  (cryptoR.data||[]).forEach((x:any)=>requests.push({id:x.id,request_id:x.request_id,kind:'CRYPTO',username:joinUsername(x.profiles)||'user',amount:Number(x.vcoin_amount),charge:Number(x.conversion_charge||0)+Number(x.network_charge||0),final_amount:Number(x.final_crypto_amount||0),status:x.status,created_at:x.created_at}));
  (banksR.data||[]).forEach((x:any)=>requests.push({id:x.id,request_id:x.request_id,kind:'BANK',username:joinUsername(x.profiles)||'user',amount:Number(x.vcoin_amount),charge:Number(x.transfer_charge||0),final_amount:Number(x.final_bank_amount||0),status:x.status,created_at:x.created_at}));
  requests.sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime());

  const ledger=(ledgerR.data||[]).map((x:any)=>({
    id:x.id, transaction_id:x.transaction_id, transaction_type:x.transaction_type, direction:x.direction, amount:Number(x.amount||0),
    balance_before:Number(x.balance_before||0), balance_after:Number(x.balance_after||0), description:x.description||'', created_at:x.created_at,
    username: joinUsername(Array.isArray(x.wallets)?x.wallets[0]?.profiles:x.wallets?.profiles)||'user'
  }));
  const commissions=(commissionsR.data||[]).map((x:any)=>({...x,master_username:profileName.get(x.master_id)||'Direct',user_username:profileName.get(x.user_id)||'user',total_charge:Number(x.total_charge||0),master_commission:Number(x.master_commission||0),company_commission:Number(x.company_commission||0)}));
  const audit=(auditR.data||[]).map((x:any)=>({...x,username:profileName.get(x.user_id)||'system'}));
  const totalCommission=commissions.reduce((a:number,x:any)=>a+x.master_commission+x.company_commission,0);
  const adminWallet=users.find((u:any)=>u.id===profile.id)?.balance||0;

  return <AdminDesktopPanel signedInAs={profile.username||'admin'} users={users} requests={requests} ledger={ledger} totalCommission={totalCommission} adminWallet={adminWallet} chargeRules={chargesR.data||[]} commissionRules={commissionRulesR.data||[]} commissions={commissions} permissions={permissionsR.data||[]} userPermissions={userPermsR.data||[]} audit={audit}/>;
}