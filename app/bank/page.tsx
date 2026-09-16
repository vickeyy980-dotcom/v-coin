import { requireUser } from '@/lib/auth';
import { BankPanel } from '@/components/BankPanel';
import { BottomNav } from '@/components/BottomNav';
import { TopBar } from '@/components/ui';
export default async function BankPage(){const {supabase,profile}=await requireUser();const {data:a}=await supabase.from('bank_accounts').select('id,account_holder_name,bank_name,ifsc_code,verification_status').eq('user_id',profile.id);return <div className="flex flex-1 flex-col overflow-hidden"><div className="flex-1 overflow-y-auto px-5 pb-6 pt-2"><TopBar title="Bank transfer" backHref="/assets"/><BankPanel accounts={a||[]}/></div><BottomNav/></div>}