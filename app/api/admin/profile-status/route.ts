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
    if(!['active','inactive','suspended'].includes(status))return NextResponse.json({error:'Invalid status'},{status:400});
    if(String(b.user_id)===user.id&&status!=='active')return NextResponse.json({error:'You cannot deactivate your own admin account'},{status:400});
    const a=createAdminClient();
    const {data:before,error:readErr}=await a.from('profiles').select('id,username,status,role').eq('id',String(b.user_id)).single();
    if(readErr||!before)return NextResponse.json({error:'Profile not found'},{status:404});
    const {error}=await a.from('profiles').update({status,updated_at:new Date().toISOString()}).eq('id',String(b.user_id));
    if(error)return NextResponse.json({error:error.message},{status:400});
    await a.from('audit_logs').insert({user_id:user.id,action:'PROFILE_STATUS_CHANGED',module:'USERS',reference_id:String(b.user_id),old_data:{status:before.status},new_data:{status,username:before.username}});
    return NextResponse.json({success:true,message:`@${before.username} is now ${status}`});
  }catch(e:any){return NextResponse.json({error:e.message||'Server error'},{status:500})}
}
