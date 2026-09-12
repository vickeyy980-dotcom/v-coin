import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req:Request){
  try{
    const s=createClient(); const {data:{user}}=await s.auth.getUser();
    if(!user)return NextResponse.json({error:'Not authenticated'},{status:401});
    const {data:me}=await s.from('profiles').select('role,status').eq('id',user.id).single();
    if(!me||me.status!=='active'||!['admin','super_admin'].includes(me.role))return NextResponse.json({error:'Admin access required'},{status:403});
    const b=await req.json(); const status=String(b.status||'');
    if(!['active','frozen'].includes(status))return NextResponse.json({error:'Invalid wallet status'},{status:400});
    const a=createAdminClient();
    const {data:w,error:findErr}=await a.from('wallets').select('id,status').eq('user_id',String(b.user_id)).single();
    if(findErr||!w)return NextResponse.json({error:'Wallet not found'},{status:404});
    const {error}=await a.from('wallets').update({status,updated_at:new Date().toISOString()}).eq('id',w.id);
    if(error)return NextResponse.json({error:error.message},{status:400});
    await a.from('audit_logs').insert({user_id:user.id,action:'WALLET_STATUS_CHANGED',module:'WALLET',reference_id:w.id,old_data:{status:w.status},new_data:{status,target_user:b.user_id}});
    return NextResponse.json({success:true,message:`Wallet ${status}`});
  }catch(e:any){return NextResponse.json({error:e.message||'Server error'},{status:500})}
}
