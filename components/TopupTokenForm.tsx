'use client';
import { useState } from 'react';

type TokenResult={request_id:string;token_no:string;address:string;city:string;area:string;area_code:string;amount:number;charge:number;total_payment:number;status:string};

export function TopupTokenForm(){
  const [form,setForm]=useState({city:'',area:'',areaCode:'',amount:''});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [token,setToken]=useState<TokenResult|null>(null);

  async function generate(){
    setError('');
    if(!form.city.trim()||!form.area.trim()||!form.areaCode.trim()||!Number(form.amount)){
      setError('Enter City, Area, Area Code and Amount.'); return;
    }
    setBusy(true);
    try{
      const res=await fetch('/api/topup/request',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...form,amount:Number(form.amount),idempotencyKey:crypto.randomUUID()})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||'Unable to generate token');
      setToken(data);
    }catch(e:any){setError(e?.message||'Unable to generate token')}finally{setBusy(false)}
  }

  const input='w-full rounded-2xl border border-line bg-panel px-4 py-4 text-[14px] text-cream outline-none placeholder:text-muted focus:border-brass';
  return <>
    <div className="grid gap-3">
      <input className={input} placeholder="City" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/>
      <input className={input} placeholder="Area" value={form.area} onChange={e=>setForm({...form,area:e.target.value})}/>
      <input className={input} placeholder="Area Code" value={form.areaCode} onChange={e=>setForm({...form,areaCode:e.target.value})}/>
      <input className={input} type="number" min="0.01" step="0.01" placeholder="V Coin amount" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
      {error&&<div className="text-[12px] text-red-400">{error}</div>}
      <button type="button" disabled={busy} onClick={generate} className="mt-2 rounded-2xl bg-brass px-4 py-4 font-semibold text-ink disabled:opacity-50">{busy?'Generating…':'Generate token'}</button>
    </div>
    {token&&<div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 px-5 backdrop-blur-sm">
      <div className="w-full max-w-[420px] rounded-[26px] border border-line bg-panel2 p-6 shadow-2xl">
        <div className="text-[12px] text-muted">V Coin top-up</div>
        <h2 className="mt-1 font-display text-[22px] font-bold">Token generated</h2>
        <div className="mt-5 rounded-2xl border border-brass/40 bg-panel p-4 text-center">
          <div className="text-[11px] uppercase tracking-[.18em] text-muted">Token No.</div>
          <div className="mt-1 font-display text-[28px] font-bold tracking-[.12em] text-brass">{token.token_no}</div>
        </div>
        <div className="mt-5 grid gap-3 text-[13px]">
          <Row k="City / Area" v={token.city+' / '+token.area}/><Row k="Area Code" v={token.area_code}/>
          <Row k="Payment address" v={token.address}/><Row k="V Coin amount" v={Number(token.amount).toLocaleString('en-IN')+' VC'}/>
          <Row k="Top-up charge" v={Number(token.charge||0).toLocaleString('en-IN')+' VC'}/><Row k="Total payment" v={Number(token.total_payment).toLocaleString('en-IN')+' VC'}/>
        </div>
        <p className="mt-5 text-[12px] leading-5 text-muted">Give this 10-digit token to the admin after payment. Your request remains pending until payment is verified.</p>
        <button onClick={()=>setToken(null)} className="mt-5 w-full rounded-2xl bg-brass px-4 py-4 font-semibold text-ink">Done</button>
      </div>
    </div>}
  </>;
}
function Row({k,v}:{k:string;v:string}){return <div className="flex items-start justify-between gap-5 border-b border-line pb-3"><span className="text-muted">{k}</span><b className="max-w-[65%] text-right">{v}</b></div>}
