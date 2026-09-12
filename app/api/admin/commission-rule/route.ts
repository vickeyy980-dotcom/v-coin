import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req:Request){
  try{
    const s=createClient(); const {data:{user}}=await s.auth.getUser();
    if(!user)return NextResponse.json({error:'Not authenticated'},{status:401});
    const {data:me}=await s.from('profiles').select('role,status').eq('id',user.id).single();
    if(!me||me.status!=='active'||!['admin','super_admin'].includes(me.role))return NextResponse.json({error:'Admin access required'},{status:403});
    const b=await req.json(); const pct=Number(b.master_percentage);
    if(!Number.isFinite(pct)||pct<0||pct>100)return NextResponse.json({error:'Master percentage must be 0–100'},{status:400});
    const a=createAdminClient();
    const {data:master}=await a.from('profiles').select('id,role,username').eq('id',String(b.master_id)).single();
    if(!master||master.role!=='master')return NextResponse.json({error:'Master not found'},{status:404});
    const row={master_id:master.id,master_percentage:pct,company_percentage:100-pct,is_active:true};
    const {data,error}=await a.from('commission_rules').upsert(row,{onConflict:'master_id'}).select('id').single();
    if(error)return NextResponse.json({error:error.message},{status:400});
    await a.from('audit_logs').insert({user_id:user.id,action:'COMMISSION_RULE_SAVED',module:'COMMISSIONS',reference_id:data.id,new_data:row});
    return NextResponse.json({success:true,message:'Commission split saved'});
  }catch(e:any){return NextResponse.json({error:e.message||'Server error'},{status:500})}
}
