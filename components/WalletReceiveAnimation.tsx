'use client';
import { useCallback,useEffect,useRef,useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PaymentReceivedPopup,{type ReceivedPayment} from './PaymentReceivedPopup';

export default function WalletReceiveAnimation({walletId}:{walletId:string}){
 const [payment,setPayment]=useState<ReceivedPayment|null>(null);
 const shown=useRef(new Set<string>());
 const close=useCallback(()=>setPayment(null),[]);
 useEffect(()=>{
  if(!walletId)return;
  const s=createClient();
  const c=s.channel(`receive-animation-${walletId}`).on('postgres_changes',{
   event:'INSERT',schema:'public',table:'wallet_transactions',filter:`wallet_id=eq.${walletId}`
  },async e=>{
   const row=e.new as any;
   if(String(row.direction).toUpperCase()!=='CREDIT')return;
   const kind=String(row.transaction_type||'').toUpperCase();
   const ref=String(row.reference_id||row.transaction_id||'');
   const desc=String(row.description||'');
   if(!(kind.includes('TRANSFER')||ref.startsWith('VCT-')||/from\s+@/i.test(desc)))return;
   const id=String(row.reference_id||row.transaction_id||row.id);
   const amount=Number(row.amount||0);
   if(!id||!Number.isFinite(amount)||amount<=0||shown.current.has(id))return;
   shown.current.add(id);
   let senderName:string|undefined;
   const match=desc.match(/from\s+@([^\s]+)/i);
   if(match?.[1]) senderName=`@${match[1]}`;
   if(!senderName&&id.startsWith('VCT-')){
    const {data:t}=await s.from('vcoin_transfers').select('sender_user_id').eq('transaction_id',id).maybeSingle();
    if(t?.sender_user_id){const {data:p}=await s.from('profiles').select('username').eq('id',t.sender_user_id).maybeSingle();if(p?.username)senderName=`@${p.username}`}
   }
   setPayment({id,amount,senderName,receivedAt:row.created_at||null});
  }).subscribe();
  return()=>{void s.removeChannel(c)};
 },[walletId]);
 return <PaymentReceivedPopup payment={payment} onClose={close}/>;
}
