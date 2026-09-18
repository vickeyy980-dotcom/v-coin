'use client';
import { useEffect,useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const ones=['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
function under100(n:number){return n<20?ones[n]:tens[Math.floor(n/10)]+(n%10?' '+ones[n%10]:'')}
function under1000(n:number){return n<100?under100(n):ones[Math.floor(n/100)]+' hundred'+(n%100?' '+under100(n%100):'')}
function numberWords(value:number){let n=Math.floor(Math.abs(value));if(n===0)return 'Zero VC';const parts:string[]=[];const crore=Math.floor(n/10000000);n%=10000000;const lakh=Math.floor(n/100000);n%=100000;const thousand=Math.floor(n/1000);n%=1000;const hundred=n;if(crore)parts.push(under1000(crore)+' crore');if(lakh)parts.push(under100(lakh)+' lakh');if(thousand)parts.push(under100(thousand)+' thousand');if(hundred)parts.push(under1000(hundred));return parts.join(' ').replace(/^./,c=>c.toUpperCase())+' VC'}

export function BalanceCardLive({userId,initialBalance}:{userId:string;initialBalance:number}){
 const [balance,setBalance]=useState(initialBalance),[visible,setVisible]=useState(false);
 useEffect(()=>{const s=createClient();const channel=s.channel(`wallet-balance-${userId}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'wallets',filter:`user_id=eq.${userId}`},(payload:any)=>setBalance(Number(payload.new?.vcoin_balance||0))).subscribe();return()=>{s.removeChannel(channel)}},[userId]);
 return <div className="relative overflow-hidden rounded-card border border-line bg-panel2 p-6"><div className="pointer-events-none absolute -right-10 -top-10 h-[150px] w-[150px] rounded-full border-[14px] border-brass-soft"><div className="absolute inset-[22px] rounded-full border-2 border-brass-soft"/></div><div className="relative"><div className="mb-2 text-[12.5px] text-muted">Total balance</div><div className="flex items-center gap-3"><div className="font-display text-[32px] font-extrabold tracking-tight tabular-nums">{visible?`${balance.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})} VC`:'XXXXXX VC'}</div><button type="button" onClick={()=>setVisible(v=>!v)} aria-label={visible?'Hide balance':'Show balance'} className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-panel text-[18px] text-muted">{visible?'◉':'◌'}</button></div>{visible&&<div className="mt-2 max-w-[310px] text-[12.5px] leading-5 text-muted">{numberWords(balance)}</div>}</div></div>
}
