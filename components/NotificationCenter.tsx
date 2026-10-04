'use client';

import { useEffect,useMemo,useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type NotificationRow={id:string;title:string;message:string;type:string|null;is_read:boolean;reference_id:string|null;created_at:string};

function icon(type:string|null){
 const t=(type||'').toUpperCase();
 if(t==='TRANSFER')return 'V';
 if(t==='TOPUP')return '+';
 if(t==='CASH_OUT')return '↗';
 if(t==='CRYPTO')return '₿';
 if(t==='BANK')return '▣';
 return '•';
}

export default function NotificationCenter({userId,initialRows}:{userId:string;initialRows:NotificationRow[]}){
 const [rows,setRows]=useState(initialRows);
 const unread=useMemo(()=>rows.filter(x=>!x.is_read).length,[rows]);
 useEffect(()=>{
  const s=createClient();
  const c=s.channel(`notifications-${userId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`user_id=eq.${userId}`},(p:any)=>{
   const n=p.new as NotificationRow;
   setRows(old=>[n,...old.filter(x=>x.id!==n.id)]);
  }).on('postgres_changes',{event:'UPDATE',schema:'public',table:'notifications',filter:`user_id=eq.${userId}`},(p:any)=>{
   const n=p.new as NotificationRow;setRows(old=>old.map(x=>x.id===n.id?n:x));
  }).subscribe();
  return()=>{s.removeChannel(c)};
 },[userId]);
 async function markRead(id:string){
  const s=createClient();
  const {error}=await s.from('notifications').update({is_read:true}).eq('id',id).eq('user_id',userId);
  if(!error)setRows(old=>old.map(x=>x.id===id?{...x,is_read:true}:x));
 }
 async function markAll(){
  const s=createClient();
  const {error}=await s.from('notifications').update({is_read:true}).eq('user_id',userId).eq('is_read',false);
  if(!error)setRows(old=>old.map(x=>({...x,is_read:true})));
 }
 return <div className="space-y-4">
  <div className="flex items-center justify-between"><div className="text-[13px] text-muted">{unread?`${unread} unread`:'You are all caught up'}</div>{unread>0&&<button onClick={markAll} className="text-[13px] font-semibold text-brass">Mark all read</button>}</div>
  {rows.length===0?<div className="rounded-card border border-line bg-panel2 p-6 text-center text-sm text-muted">No notifications yet.</div>:<div className="space-y-3">{rows.map(n=><button key={n.id} onClick={()=>!n.is_read&&markRead(n.id)} className={`w-full rounded-card border p-4 text-left ${n.is_read?'border-line bg-panel2':'border-brass/50 bg-panel'}`}>
   <div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-panel2 font-display font-bold text-brass">{icon(n.type)}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="font-display text-[15px] font-bold">{n.title}</div>{!n.is_read&&<span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red"/>}</div><div className="mt-1 text-[13px] leading-5 text-muted">{n.message}</div><div className="mt-2 text-[11px] text-muted">{new Date(n.created_at).toLocaleString('en-IN')}</div></div></div>
  </button>)}</div>}
 </div>
}
