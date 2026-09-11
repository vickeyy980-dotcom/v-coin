'use client';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { PrimaryButton } from '@/components/ui';

const KEYS=['1','2','3','4','5','6','7','8','9','.','0','⌫'];

export function SendForm(){
  const params=useSearchParams();
  const initial=useMemo(()=>{
    const raw=params.get('to')||'';
    try{const parsed=JSON.parse(raw);return parsed?.recipient||parsed?.address||raw}catch{return raw}
  },[params]);
  const [to,setTo]=useState(initial),[amount,setAmount]=useState('0'),[method,setMethod]=useState<'USERNAME'|'WALLET_ADDRESS'|'QR_CODE'>(initial.startsWith('VC-')?'WALLET_ADDRESS':'USERNAME'),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);
  function press(k:string){setAmount(p=>{if(k==='⌫')return p.length>1?p.slice(0,-1):'0';if(k==='.')return p.includes('.')?p:p+'.';return p==='0'?k:p+k})}
  async function go(){if(!to.trim()||Number(amount)<=0){setMsg('Enter recipient and amount.');return}setBusy(true);setMsg('');const res=await fetch('/api/transfer',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({recipient:to.trim().replace(/^@/,''),amount:Number(amount),method,idempotencyKey:crypto.randomUUID()})});const data=await res.json().catch(()=>({error:'Server returned an invalid response'}));setBusy(false);setMsg(res.ok?`Sent successfully · ${data.transaction_id||''}`:data.error||'Transfer failed')}
  return <div className="flex flex-1 flex-col">
    <label className="mt-2 block rounded-2xl border border-line bg-field px-4 py-3.5"><span className="mb-0.5 block text-[11.5px] text-muted-2">To</span><input value={to} onChange={e=>setTo(e.target.value)} placeholder="@username or wallet address" className="w-full bg-transparent text-[15px] font-medium text-cream outline-none placeholder:text-muted-2"/></label>
    <div className="mt-3 flex gap-2"><button onClick={()=>setMethod('USERNAME')} className={`rounded-full px-3 py-1.5 text-[12px] ${method==='USERNAME'?'bg-brass text-[#1A1406]':'bg-panel2 text-muted'}`}>Username</button><button onClick={()=>setMethod('WALLET_ADDRESS')} className={`rounded-full px-3 py-1.5 text-[12px] ${method==='WALLET_ADDRESS'?'bg-brass text-[#1A1406]':'bg-panel2 text-muted'}`}>Wallet</button></div>
    <div className="flex-1"/><div className="text-center"><div className="font-display text-[44px] font-extrabold tracking-tight tabular-nums">{amount} <span className="text-[24px] font-semibold text-muted">VC</span></div>{msg&&<p className={`mt-2 text-[12.5px] ${msg.startsWith('Sent')?'text-green':'text-red'}`}>{msg}</p>}</div><div className="flex-1"/>
    <div className="grid grid-cols-3 gap-1.5 px-1.5">{KEYS.map(k=><button type="button" key={k} onClick={()=>press(k)} className="rounded-2xl py-3.5 font-display text-[19px] font-semibold text-cream active:bg-panel2">{k}</button>)}</div>
    <div className="mt-3"><PrimaryButton onClick={go} disabled={busy||Number(amount)<=0}>{busy?'Sending…':'Review transfer'}</PrimaryButton></div>
  </div>
}
