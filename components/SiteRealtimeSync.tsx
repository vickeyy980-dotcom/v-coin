'use client';
import { useEffect } from 'react';
import { usePathname,useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const TABLES=['wallets','wallet_transactions','topup_requests','crypto_conversion_requests','bank_transfer_requests','notifications','commissions'] as const;
export function SiteRealtimeSync(){
 const router=useRouter(),pathname=usePathname();
 useEffect(()=>{const s=createClient();let timer:ReturnType<typeof setTimeout>|null=null;
 const refresh=()=>{if(timer)clearTimeout(timer);timer=setTimeout(()=>router.refresh(),120)};
 const c=s.channel('vcoin-site-realtime');
 for(const table of TABLES)c.on('postgres_changes',{event:'*',schema:'public',table},refresh);
 c.subscribe();
 return()=>{if(timer)clearTimeout(timer);s.removeChannel(c)}
 },[router,pathname]);
 return null;
}
