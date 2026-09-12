import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminDashboard } from '@/components/AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const { profile } = await requireUser();
  if (profile.role !== 'admin' && profile.role !== 'super_admin') redirect('/dashboard');

  const db = createAdminClient();

  const [
    profilesRes,
    walletsRes,
    ledgerRes,
    topupRes,
    cryptoRes,
    bankRes,
    chargeRulesRes,
    chargeHistoryRes,
    commissionRulesRes,
    commissionsRes,
    permissionsRes,
    userPermissionsRes,
    auditRes,
  ] = await Promise.all([
    db.from('profiles').select('id,username,full_name,email,phone,role,master_id,status,created_at').order('created_at', { ascending: false }),
    db.from('wallets').select('id,user_id,wallet_address,vcoin_balance,locked_balance,status,created_at'),
    db.from('wallet_transactions').select('id,transaction_id,wallet_id,transaction_type,direction,amount,balance_before,balance_after,reference_id,description,created_at').order('created_at', { ascending: false }).limit(500),
    db.from('topup_requests').select('id,request_id,user_id,master_id,requested_vcoin,topup_charge,status,created_at').order('created_at', { ascending: false }).limit(200),
    db.from('crypto_conversion_requests').select('id,request_id,user_id,master_id,vcoin_amount,conversion_charge,network_charge,status,created_at').order('created_at', { ascending: false }).limit(200),
    db.from('bank_transfer_requests').select('id,request_id,user_id,master_id,vcoin_amount,transfer_charge,status,created_at').order('created_at', { ascending: false }).limit(200),
    db.from('charge_rules').select('id,master_id,charge_type,charge_mode,charge_value,minimum_charge,maximum_charge,is_active,created_at').order('created_at', { ascending: false }),
    db.from('charge_history').select('id,user_id,master_id,transaction_type,reference_id,amount,created_at').order('created_at', { ascending: false }).limit(500),
    db.from('commission_rules').select('id,master_id,master_percentage,company_percentage,is_active,created_at'),
    db.from('commissions').select('id,master_id,user_id,transaction_type,transaction_reference,transaction_amount,total_charge,master_commission,company_commission,status,created_at').order('created_at', { ascending: false }).limit(500),
    db.from('permissions').select('code,label').order('code'),
    db.from('user_permissions').select('user_id,permission_code,granted'),
    db.from('audit_logs').select('id,user_id,action,module,reference_id,old_data,new_data,ip_address,created_at').order('created_at', { ascending: false }).limit(500),
  ]);

  const errors = [profilesRes.error, walletsRes.error, ledgerRes.error, topupRes.error, cryptoRes.error, bankRes.error, chargeRulesRes.error, chargeHistoryRes.error, commissionRulesRes.error, commissionsRes.error, permissionsRes.error, userPermissionsRes.error, auditRes.error].filter(Boolean);
  if (errors.length) console.error('Admin dashboard load errors:', errors.map((e) => e?.message));

  return (
    <AdminDashboard
      currentAdmin={{ id: profile.id, username: profile.username, full_name: profile.full_name, role: profile.role }}
      profiles={profilesRes.data || []}
      wallets={walletsRes.data || []}
      ledger={ledgerRes.data || []}
      topups={topupRes.data || []}
      cryptoRequests={cryptoRes.data || []}
      bankRequests={bankRes.data || []}
      chargeRules={chargeRulesRes.data || []}
      chargeHistory={chargeHistoryRes.data || []}
      commissionRules={commissionRulesRes.data || []}
      commissions={commissionsRes.data || []}
      permissions={permissionsRes.data || []}
      userPermissions={userPermissionsRes.data || []}
      audit={auditRes.data || []}
      loadErrors={errors.map((e) => e?.message || 'Unknown database error')}
    />
  );
}
