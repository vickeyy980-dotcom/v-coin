'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function BalanceCardLive({userId,initialBalance}:{userId:string;initialBalance:number}){
 const [balance,setBalance]=useState(initialBalance); const [visible,setVisible]=useState(false);
 useEffect(()=>{const s=createClient();const channel=s.channel(`wallet-balance-${userId}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'wallets',filter:`user_id=eq.${userId}`},(payload:any)=>setBalance(Number(payload.new?.vcoin_balance||0))).subscribe();return()=>{s.removeChannel(channel)}},[userId]);
 return <div className="relative overflow-hidden rounded-card border border-line bg-panel2 p-6">
  <div className="pointer-events-none absolute -right-10 -top-10 h-[150px] w-[150px] rounded-full border-[14px] border-brass-soft"><div className="absolute inset-[22px] rounded-full border-2 border-brass-soft"/></div>
  <div className="relative"><div className="mb-2 text-[12.5px] text-muted">Total balance</div><div className="flex items-center gap-3"><div className="font-display text-[32px] font-extrabold tracking-tight tabular-nums">{visible?`${balance.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})} VC`:'XXXXXX VC'}</div><button type="button" onClick={()=>setVisible(v=>!v)} aria-label={visible?'Hide balance':'Show balance'} className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-panel text-[18px] text-muted">{visible?'◉':'◌'}</button></div></div>
 </div>
}
