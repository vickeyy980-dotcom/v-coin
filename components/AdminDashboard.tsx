'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Profile = { id:string; username:string; full_name:string|null; email:string|null; phone:string|null; role:'super_admin'|'admin'|'master'|'user'|string; master_id:string|null; status:'active'|'inactive'|'suspended'|string; created_at:string };
type Wallet = { id:string; user_id:string; wallet_address:string; vcoin_balance:number|string; locked_balance:number|string; status:'active'|'frozen'|string; created_at:string };
type Ledger = { id:string; transaction_id:string; wallet_id:string; transaction_type:string; direction:'CREDIT'|'DEBIT'|string; amount:number|string; balance_before:number|string; balance_after:number|string; reference_id:string|null; description:string|null; created_at:string };
type Req = { id:string; request_id:string; user_id:string; master_id:string|null; status:string; created_at:string; requested_vcoin?:number|string; vcoin_amount?:number|string; topup_charge?:number|string; conversion_charge?:number|string; network_charge?:number|string; transfer_charge?:number|string };
type ChargeRule = { id:string; master_id:string|null; charge_type:string; charge_mode:string; charge_value:number|string; minimum_charge:number|string|null; maximum_charge:number|string|null; is_active:boolean; created_at:string };
type ChargeHistory = { id:string; user_id:string|null; master_id:string|null; transaction_type:string; reference_id:string|null; amount:number|string; created_at:string };
type CommissionRule = { id:string; master_id:string; master_percentage:number|string; company_percentage:number|string; is_active:boolean; created_at:string };
type Commission = { id:string; master_id:string|null; user_id:string|null; transaction_type:string; transaction_reference:string; transaction_amount:number|string; total_charge:number|string; master_commission:number|string; company_commission:number|string; status:string; created_at:string };
type Permission = { code:string; label:string };
type UserPermission = { user_id:string; permission_code:string; granted:boolean };
type Audit = { id:string; user_id:string|null; action:string; module:string; reference_id:string|null; old_data:any; new_data:any; ip_address:string|null; created_at:string };

type Props = {
  currentAdmin:{id:string;username:string;full_name:string|null;role:string};
  profiles:Profile[]; wallets:Wallet[]; ledger:Ledger[]; topups:Req[]; cryptoRequests:Req[]; bankRequests:Req[];
  chargeRules:ChargeRule[]; chargeHistory:ChargeHistory[]; commissionRules:CommissionRule[]; commissions:Commission[];
  permissions:Permission[]; userPermissions:UserPermission[]; audit:Audit[]; loadErrors:string[];
};

const SECTIONS = [
  ['overview','Overview'],['masters','Masters'],['users','Users'],['ledger','Wallet ledger'],['requests','Requests'],
  ['charges','Charges'],['commissions','Commissions'],['permissions','Permissions'],['audit','Audit log'],
] as const;

function n(v:any){ return Number(v || 0); }
function fmtVC(v:any){ return `${n(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})} VC`; }
function fmtDate(v:string){ const d=new Date(v); return Number.isNaN(d.getTime())?'—':`${d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})} · ${d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}`; }
function statusClass(s:string){ const x=s.toLowerCase(); if(['active','completed','approved','payment_confirmed'].includes(x))return 'green'; if(['pending','payment_pending','payment_submitted','suspended'].includes(x))return 'amber'; if(['rejected','cancelled','inactive','frozen'].includes(x))return 'red'; return 'muted'; }

export function AdminDashboard(props:Props){
  const [section,setSection]=useState<typeof SECTIONS[number][0]>('overview');
  const [requestTab,setRequestTab]=useState<'TOPUP'|'CRYPTO'|'BANK'>('TOPUP');
  const [ledgerFilter,setLedgerFilter]=useState('all');
  const [busy,setBusy]=useState(false);
  const [toast,setToast]=useState('');
  const [newName,setNewName]=useState(''); const [newUsername,setNewUsername]=useState(''); const [newEmail,setNewEmail]=useState(''); const [newPassword,setNewPassword]=useState(''); const [newMaster,setNewMaster]=useState('');
  const [adjustUser,setAdjustUser]=useState(''); const [adjustAmount,setAdjustAmount]=useState('');
  const [chargeScope,setChargeScope]=useState('default'); const [chargeType,setChargeType]=useState('INTERNAL_TRANSFER'); const [chargeMode,setChargeMode]=useState('FIXED'); const [chargeValue,setChargeValue]=useState('0'); const [chargeMin,setChargeMin]=useState(''); const [chargeMax,setChargeMax]=useState('');

  const walletByUser=useMemo(()=>new Map(props.wallets.map(w=>[w.user_id,w])),[props.wallets]);
  const walletById=useMemo(()=>new Map(props.wallets.map(w=>[w.id,w])),[props.wallets]);
  const profileById=useMemo(()=>new Map(props.profiles.map(p=>[p.id,p])),[props.profiles]);
  const masters=useMemo(()=>props.profiles.filter(p=>p.role==='master'),[props.profiles]);
  const users=useMemo(()=>props.profiles.filter(p=>p.role==='user'),[props.profiles]);
  const activeUsers=users.filter(u=>u.status==='active').length;
  const totalWalletBalance=props.wallets.reduce((s,w)=>s+n(w.vcoin_balance),0);
  const totalCommission=props.commissions.reduce((s,c)=>s+n(c.total_charge),0);
  const cryptoTotal=props.cryptoRequests.filter(x=>x.status==='completed').reduce((s,x)=>s+n(x.vcoin_amount),0);
  const bankTotal=props.bankRequests.filter(x=>x.status==='completed').reduce((s,x)=>s+n(x.vcoin_amount),0);
  const ledgerVolume=props.ledger.reduce((s,l)=>s+n(l.amount),0);

  function notify(msg:string){ setToast(msg); window.setTimeout(()=>setToast(''),2600); }
  async function api(url:string,body:any){
    setBusy(true);
    try{
      const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
      const d=await r.json().catch(()=>({error:`HTTP ${r.status}`}));
      if(!r.ok) throw new Error(d.error||'Request failed');
      notify(d.message||'Saved successfully');
      window.setTimeout(()=>window.location.reload(),500);
      return d;
    }catch(e:any){ notify(e.message||'Request failed'); throw e; }
    finally{ setBusy(false); }
  }

  async function createAccount(role:'master'|'user'){
    if(!newUsername.trim()||!newEmail.trim()||!newPassword.trim()){notify('Username, email and temporary password are required');return;}
    await api('/api/admin/create-user',{username:newUsername.trim(),full_name:newName.trim()||newUsername.trim(),email:newEmail.trim(),password:newPassword,role,master_id:role==='user'?(newMaster||null):null});
  }
  async function adjust(direction:'credit'|'debit'){
    if(!adjustUser||n(adjustAmount)<=0){notify('Select a user and enter a valid amount');return;}
    const p=profileById.get(adjustUser); if(!p)return;
    await api(`/api/admin/${direction}`,{username:p.username,amount:n(adjustAmount),idempotencyKey:crypto.randomUUID()});
  }
  function exportData(){
    const blob=new Blob([JSON.stringify({exported_at:new Date().toISOString(),profiles:props.profiles,wallets:props.wallets,ledger:props.ledger,topups:props.topups,cryptoRequests:props.cryptoRequests,bankRequests:props.bankRequests,chargeRules:props.chargeRules,commissions:props.commissions,audit:props.audit},null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='vcoin-admin-export.json';a.click();URL.revokeObjectURL(a.href);
  }

  const pendingRequests=[
    ...props.topups.map(x=>({...x,kind:'TOPUP' as const,amount:n(x.requested_vcoin),charge:n(x.topup_charge)})),
    ...props.cryptoRequests.map(x=>({...x,kind:'CRYPTO' as const,amount:n(x.vcoin_amount),charge:n(x.conversion_charge)+n(x.network_charge)})),
    ...props.bankRequests.map(x=>({...x,kind:'BANK' as const,amount:n(x.vcoin_amount),charge:n(x.transfer_charge)})),
  ].filter(x=>x.kind===requestTab).sort((a,b)=>+new Date(b.created_at)-+new Date(a.created_at));

  const filteredLedger=ledgerFilter==='all'?props.ledger:props.ledger.filter(l=>l.transaction_type===ledgerFilter);
  const ledgerTypes=Array.from(new Set(props.ledger.map(l=>l.transaction_type))).sort();

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <div className="admin-brand"><div className="admin-brand-mark">V</div><div><div className="admin-brand-name">V Coin</div><div className="admin-brand-sub">Admin panel</div></div></div>
      <nav>{SECTIONS.map(([id,label])=><button key={id} className={`admin-nav-item ${section===id?'active':''}`} onClick={()=>setSection(id)}><span className="admin-nav-dot"/>{label}</button>)}</nav>
      <div className="admin-sidebar-foot">
        <button className="admin-link-btn" onClick={exportData}>Export data (.json)</button>
        <Link href="/dashboard" className="admin-link-btn admin-link-anchor">Open user wallet</Link>
        <button className="admin-link-btn" onClick={()=>window.location.reload()}>Refresh data</button>
      </div>
    </aside>

    <main className="admin-main">
      {props.loadErrors.length>0&&<div className="admin-alert">Some admin data could not be loaded: {props.loadErrors.join(' · ')}</div>}
      {section==='overview'&&<>
        <Header title="Overview" sub="Live snapshot of the platform" right={<div className="admin-who">Signed in as <b>@{props.currentAdmin.username}</b></div>}/>
        <div className="admin-grid-kpi">
          <Kpi label="Wallet balance" value={fmtVC(totalWalletBalance)}/><Kpi label="Total commission" value={fmtVC(totalCommission)}/><Kpi label="Crypto completed" value={fmtVC(cryptoTotal)}/><Kpi label="Bank completed" value={fmtVC(bankTotal)}/><Kpi label="Active users" value={String(activeUsers)}/><Kpi label="Total ledger volume" value={fmtVC(ledgerVolume)}/>
        </div>
        <Card title="Recent ledger activity"><Table><thead><tr><Th>Date</Th><Th>User</Th><Th>Type</Th><Th>Direction</Th><Th>Amount</Th><Th>Balance after</Th></tr></thead><tbody>{props.ledger.slice(0,10).map(l=>{const w=walletById.get(l.wallet_id);const p=w?profileById.get(w.user_id):undefined;return <tr key={l.id}><Td muted>{fmtDate(l.created_at)}</Td><Td>@{p?.username||'—'}</Td><Td><Badge s={l.transaction_type}/></Td><Td><Badge s={l.direction}/></Td><Td>{fmtVC(l.amount)}</Td><Td>{fmtVC(l.balance_after)}</Td></tr>})}{props.ledger.length===0&&<Empty cols={6} text="No ledger activity yet."/>}</tbody></Table></Card>
      </>}

      {section==='masters'&&<>
        <Header title="Masters" sub="Create and manage master accounts"/>
        <Card title="New master"><div className="admin-form-row"><Field label="Name"><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Master name"/></Field><Field label="Username"><input value={newUsername} onChange={e=>setNewUsername(e.target.value)} placeholder="master_username"/></Field><Field label="Email"><input value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="master@example.com"/></Field><Field label="Temporary password"><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Min 6 characters"/></Field><button className="admin-btn" disabled={busy} onClick={()=>createAccount('master')}>+ Create master</button></div></Card>
        <Card title={`All masters (${masters.length})`}><Table><thead><tr><Th>Name</Th><Th>Username</Th><Th>Status</Th><Th>Users</Th><Th>Total balance</Th><Th>Created</Th><Th/></tr></thead><tbody>{masters.map(m=>{const assigned=users.filter(u=>u.master_id===m.id);const bal=assigned.reduce((s,u)=>s+n(walletByUser.get(u.id)?.vcoin_balance),0);return <tr key={m.id}><Td>{m.full_name||m.username}<small>{m.email||''}</small></Td><Td>@{m.username}</Td><Td><Badge s={m.status}/></Td><Td>{assigned.length}</Td><Td>{fmtVC(bal)}</Td><Td muted>{fmtDate(m.created_at)}</Td><Td><button className="admin-btn small secondary" disabled={busy} onClick={()=>api('/api/admin/profile-status',{user_id:m.id,status:m.status==='active'?'suspended':'active'})}>{m.status==='active'?'Suspend':'Activate'}</button></Td></tr>})}{masters.length===0&&<Empty cols={7} text="No masters yet."/>}</tbody></Table></Card>
      </>}

      {section==='users'&&<>
        <Header title="Users" sub="Create users, assign masters, manage status and wallets"/>
        <Card title="New user"><div className="admin-form-row"><Field label="Full name"><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Full name"/></Field><Field label="Username"><input value={newUsername} onChange={e=>setNewUsername(e.target.value)} placeholder="username"/></Field><Field label="Email"><input value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="user@example.com"/></Field><Field label="Temporary password"><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Min 6 characters"/></Field><Field label="Master"><select value={newMaster} onChange={e=>setNewMaster(e.target.value)}><option value="">Direct (no master)</option>{masters.map(m=><option key={m.id} value={m.id}>{m.full_name||m.username}</option>)}</select></Field><button className="admin-btn" disabled={busy} onClick={()=>createAccount('user')}>+ Create user</button></div></Card>
        <Card title={`All users (${users.length})`}><Table><thead><tr><Th>User</Th><Th>Master</Th><Th>Status</Th><Th>Wallet</Th><Th>Balance</Th><Th>Locked</Th><Th>Actions</Th></tr></thead><tbody>{users.map(u=>{const w=walletByUser.get(u.id);const m=u.master_id?profileById.get(u.master_id):null;return <tr key={u.id}><Td>{u.full_name||u.username}<small>@{u.username} · {u.email||''}</small></Td><Td muted>{m?.full_name||m?.username||'Direct'}</Td><Td><Badge s={u.status}/></Td><Td><Badge s={w?.status||'missing'}/><small>{w?.wallet_address||'No wallet'}</small></Td><Td>{fmtVC(w?.vcoin_balance)}</Td><Td>{fmtVC(w?.locked_balance)}</Td><Td><div className="admin-actions"><button className="admin-btn small secondary" disabled={busy} onClick={()=>api('/api/admin/profile-status',{user_id:u.id,status:u.status==='active'?'suspended':'active'})}>{u.status==='active'?'Suspend':'Activate'}</button>{w&&<button className="admin-btn small secondary" disabled={busy} onClick={()=>api('/api/admin/wallet-status',{user_id:u.id,status:w.status==='active'?'frozen':'active'})}>{w.status==='active'?'Freeze':'Unfreeze'}</button>}</div></Td></tr>})}{users.length===0&&<Empty cols={7} text="No users yet."/>}</tbody></Table></Card>
        <Card title="Admin VC credit / debit"><div className="admin-form-row"><Field label="User"><select value={adjustUser} onChange={e=>setAdjustUser(e.target.value)}><option value="">Select user</option>{users.map(u=><option key={u.id} value={u.id}>@{u.username} — {u.full_name||u.username}</option>)}</select></Field><Field label="Amount"><input type="number" min="0.01" step="0.01" value={adjustAmount} onChange={e=>setAdjustAmount(e.target.value)} placeholder="100.00"/></Field><button className="admin-btn" disabled={busy} onClick={()=>adjust('credit')}>Credit VC</button><button className="admin-btn danger" disabled={busy} onClick={()=>adjust('debit')}>Debit VC</button></div><p className="admin-note">Every credit/debit uses the secure database RPC and creates a wallet ledger + audit record.</p></Card>
      </>}

      {section==='ledger'&&<>
        <Header title="Wallet ledger" sub="Database record of wallet movements" right={<select className="admin-filter" value={ledgerFilter} onChange={e=>setLedgerFilter(e.target.value)}><option value="all">All types</option>{ledgerTypes.map(t=><option key={t}>{t}</option>)}</select>}/>
        <Card><Table><thead><tr><Th>Date</Th><Th>Transaction ID</Th><Th>User</Th><Th>Type</Th><Th>Direction</Th><Th>Amount</Th><Th>Before</Th><Th>After</Th><Th>Description</Th></tr></thead><tbody>{filteredLedger.map(l=>{const w=walletById.get(l.wallet_id);const p=w?profileById.get(w.user_id):undefined;return <tr key={l.id}><Td muted>{fmtDate(l.created_at)}</Td><Td><code>{l.transaction_id}</code></Td><Td>@{p?.username||'—'}</Td><Td><Badge s={l.transaction_type}/></Td><Td><Badge s={l.direction}/></Td><Td>{fmtVC(l.amount)}</Td><Td muted>{fmtVC(l.balance_before)}</Td><Td>{fmtVC(l.balance_after)}</Td><Td muted>{l.description||'—'}</Td></tr>})}{filteredLedger.length===0&&<Empty cols={9} text="No entries for this filter."/>}</tbody></Table></Card>
      </>}

      {section==='requests'&&<>
        <Header title="Requests" sub="Approve or reject live V Coin, crypto and bank requests"/>
        <div className="admin-tabs">{(['TOPUP','CRYPTO','BANK'] as const).map(t=><button key={t} className={`admin-tab-btn ${requestTab===t?'active':''}`} onClick={()=>setRequestTab(t)}>{t==='TOPUP'?'Top-up':t==='CRYPTO'?'Crypto':'Bank transfer'}</button>)}</div>
        <Card title={`${requestTab} requests (${pendingRequests.length})`}><Table><thead><tr><Th>Request</Th><Th>Date</Th><Th>User</Th><Th>Master</Th><Th>Amount</Th><Th>Charge</Th><Th>Status</Th><Th>Actions</Th></tr></thead><tbody>{pendingRequests.map(r=>{const u=profileById.get(r.user_id);const m=r.master_id?profileById.get(r.master_id):null;const actionAllowed=!['completed','rejected','cancelled'].includes(r.status);return <tr key={r.kind+r.id}><Td><code>{r.request_id}</code></Td><Td muted>{fmtDate(r.created_at)}</Td><Td>@{u?.username||'—'}</Td><Td muted>{m?.full_name||m?.username||'Direct'}</Td><Td>{fmtVC(r.amount)}</Td><Td>{fmtVC(r.charge)}</Td><Td><Badge s={r.status}/></Td><Td>{actionAllowed&&<div className="admin-actions"><button className="admin-btn small" disabled={busy} onClick={()=>api('/api/admin/request-action',{kind:r.kind,request_id:r.id,action:'COMPLETE',note:''})}>Complete</button><button className="admin-btn small danger" disabled={busy} onClick={()=>api('/api/admin/request-action',{kind:r.kind,request_id:r.id,action:'REJECTED',note:''})}>Reject</button></div>}</Td></tr>})}{pendingRequests.length===0&&<Empty cols={8} text={`No ${requestTab.toLowerCase()} requests yet.`}/>}</tbody></Table></Card>
      </>}

      {section==='charges'&&<>
        <Header title="Charges" sub="Default and per-master fee rules"/>
        <Card title="Add a charge rule"><div className="admin-form-row"><Field label="Scope"><select value={chargeScope} onChange={e=>setChargeScope(e.target.value)}><option value="default">Default</option>{masters.map(m=><option key={m.id} value={m.id}>{m.full_name||m.username}</option>)}</select></Field><Field label="Charge type"><select value={chargeType} onChange={e=>setChargeType(e.target.value)}>{['WALLET_MAINTENANCE','INTERNAL_TRANSFER','VCOIN_TOPUP','CRYPTO_CONVERSION','BANK_TRANSFER'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Mode"><select value={chargeMode} onChange={e=>setChargeMode(e.target.value)}><option>FIXED</option><option>PERCENTAGE</option></select></Field><Field label="Value"><input type="number" step="0.01" value={chargeValue} onChange={e=>setChargeValue(e.target.value)}/></Field><Field label="Min"><input type="number" step="0.01" value={chargeMin} onChange={e=>setChargeMin(e.target.value)} placeholder="Optional"/></Field><Field label="Max"><input type="number" step="0.01" value={chargeMax} onChange={e=>setChargeMax(e.target.value)} placeholder="Optional"/></Field><button className="admin-btn" disabled={busy} onClick={()=>api('/api/admin/charge-rule',{master_id:chargeScope==='default'?null:chargeScope,charge_type:chargeType,charge_mode:chargeMode,charge_value:n(chargeValue),minimum_charge:chargeMin===''?null:n(chargeMin),maximum_charge:chargeMax===''?null:n(chargeMax)})}>Save rule</button></div></Card>
        <Card title="Active rules"><Table><thead><tr><Th>Scope</Th><Th>Type</Th><Th>Mode</Th><Th>Value</Th><Th>Min</Th><Th>Max</Th><Th>Status</Th><Th/></tr></thead><tbody>{props.chargeRules.map(r=>{const m=r.master_id?profileById.get(r.master_id):null;return <tr key={r.id}><Td>{m?.full_name||m?.username||'Default'}</Td><Td><Badge s={r.charge_type}/></Td><Td muted>{r.charge_mode}</Td><Td>{n(r.charge_value)}{r.charge_mode==='PERCENTAGE'?'%':' VC'}</Td><Td muted>{r.minimum_charge==null?'—':fmtVC(r.minimum_charge)}</Td><Td muted>{r.maximum_charge==null?'—':fmtVC(r.maximum_charge)}</Td><Td><Badge s={r.is_active?'active':'inactive'}/></Td><Td><button className="admin-btn small danger" disabled={busy} onClick={()=>api('/api/admin/charge-rule',{id:r.id,delete:true})}>Remove</button></Td></tr>})}{props.chargeRules.length===0&&<Empty cols={8} text="No charge rules configured."/>}</tbody></Table></Card>
        <Card title="Recent charge history"><Table><thead><tr><Th>Date</Th><Th>User</Th><Th>Master</Th><Th>Type</Th><Th>Reference</Th><Th>Amount</Th></tr></thead><tbody>{props.chargeHistory.slice(0,100).map(c=><tr key={c.id}><Td muted>{fmtDate(c.created_at)}</Td><Td>@{c.user_id?profileById.get(c.user_id)?.username||'—':'—'}</Td><Td muted>{c.master_id?profileById.get(c.master_id)?.username||'—':'Direct'}</Td><Td><Badge s={c.transaction_type}/></Td><Td><code>{c.reference_id||'—'}</code></Td><Td>{fmtVC(c.amount)}</Td></tr>)}{props.chargeHistory.length===0&&<Empty cols={6} text="No charge history yet."/>}</tbody></Table></Card>
      </>}

      {section==='commissions'&&<>
        <Header title="Commissions" sub="Per-master split between master and company"/>
        <Card title="Master splits"><Table><thead><tr><Th>Master</Th><Th>Master %</Th><Th>Company %</Th><Th>Status</Th><Th/></tr></thead><tbody>{masters.map(m=>{const rule=props.commissionRules.find(x=>x.master_id===m.id);const current=n(rule?.master_percentage);return <CommissionRow key={m.id} master={m} value={current} active={rule?.is_active!==false} save={(pct)=>api('/api/admin/commission-rule',{master_id:m.id,master_percentage:pct})} busy={busy}/>})}{masters.length===0&&<Empty cols={5} text="No masters yet."/>}</tbody></Table><p className="admin-note">Company percentage is calculated automatically as 100 − Master percentage.</p></Card>
        <Card title={`Commission history (${props.commissions.length})`}><Table><thead><tr><Th>Date</Th><Th>Master</Th><Th>User</Th><Th>Type</Th><Th>Transaction</Th><Th>Total charge</Th><Th>Master share</Th><Th>Company share</Th></tr></thead><tbody>{props.commissions.map(c=><tr key={c.id}><Td muted>{fmtDate(c.created_at)}</Td><Td>{c.master_id?profileById.get(c.master_id)?.username||'—':'Direct'}</Td><Td>{c.user_id?profileById.get(c.user_id)?.username||'—':'—'}</Td><Td><Badge s={c.transaction_type}/></Td><Td>{fmtVC(c.transaction_amount)}</Td><Td>{fmtVC(c.total_charge)}</Td><Td>{fmtVC(c.master_commission)}</Td><Td>{fmtVC(c.company_commission)}</Td></tr>)}{props.commissions.length===0&&<Empty cols={8} text="No commission records yet."/>}</tbody></Table></Card>
      </>}

      {section==='permissions'&&<>
        <Header title="Permissions" sub="Per-master feature access"/>
        {masters.length===0?<Card>No masters yet — create one first.</Card>:masters.map(m=><Card key={m.id} title={m.full_name||m.username}><div className="admin-perm-grid">{props.permissions.map(p=>{const row=props.userPermissions.find(x=>x.user_id===m.id&&x.permission_code===p.code);const checked=row?.granted===true;return <label className="admin-perm-row" key={p.code}><span className="admin-switch"><input type="checkbox" checked={checked} disabled={busy} onChange={()=>api('/api/admin/permission',{master_id:m.id,permission_code:p.code,granted:!checked})}/><span className="admin-slider"/></span><span>{p.label}<small>{p.code}</small></span></label>})}</div></Card>)}
      </>}

      {section==='audit'&&<>
        <Header title="Audit log" sub="Important administrator actions recorded by the backend"/>
        <Card><Table><thead><tr><Th>Time</Th><Th>Admin</Th><Th>Action</Th><Th>Module</Th><Th>Reference</Th><Th>Details</Th></tr></thead><tbody>{props.audit.map(a=><tr key={a.id}><Td muted>{fmtDate(a.created_at)}</Td><Td>@{a.user_id?profileById.get(a.user_id)?.username||'system':'system'}</Td><Td><b>{a.action}</b></Td><Td><Badge s={a.module}/></Td><Td><code>{a.reference_id||'—'}</code></Td><Td muted><pre className="admin-json">{a.new_data?JSON.stringify(a.new_data):'—'}</pre></Td></tr>)}{props.audit.length===0&&<Empty cols={6} text="No audit entries yet."/>}</tbody></Table></Card>
      </>}
    </main>
    {toast&&<div className="admin-toast show">{toast}</div>}
  </div>;
}

function Header({title,sub,right}:{title:string;sub:string;right?:React.ReactNode}){return <div className="admin-page-head"><div><h1 className="admin-page-title">{title}</h1><p className="admin-page-sub">{sub}</p></div>{right}</div>}
function Card({title,children}:{title?:string;children:React.ReactNode}){return <section className="admin-card">{title&&<h2 className="admin-card-title">{title}</h2>}{children}</section>}
function Kpi({label,value}:{label:string;value:string}){return <div className="admin-kpi-card"><div className="admin-kpi-label">{label}</div><div className={`admin-kpi-value ${value.length>14?'small':''}`}>{value}</div></div>}
function Table({children}:{children:React.ReactNode}){return <div className="admin-table-wrap"><table className="admin-table">{children}</table></div>}
function Th({children}:{children?:React.ReactNode}){return <th>{children}</th>}
function Td({children,muted=false}:{children?:React.ReactNode;muted?:boolean}){return <td className={muted?'admin-muted':''}>{children}</td>}
function Empty({cols,text}:{cols:number;text:string}){return <tr><td colSpan={cols} className="admin-empty">{text}</td></tr>}
function Badge({s}:{s:string}){return <span className={`admin-badge ${statusClass(s)}`}>{s}</span>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="admin-flabel"><span>{label}</span>{children}</label>}
function CommissionRow({master,value,active,save,busy}:{master:Profile;value:number;active:boolean;save:(v:number)=>void;busy:boolean}){const [pct,setPct]=useState(String(value));return <tr><Td>{master.full_name||master.username}<small>@{master.username}</small></Td><Td><input className="admin-inline-input" type="number" min="0" max="100" step="0.01" value={pct} onChange={e=>setPct(e.target.value)}/></Td><Td muted>{(100-n(pct)).toFixed(2)}%</Td><Td><Badge s={active?'active':'inactive'}/></Td><Td><button className="admin-btn small secondary" disabled={busy} onClick={()=>save(Math.max(0,Math.min(100,n(pct))))}>Save</button></Td></tr>}
