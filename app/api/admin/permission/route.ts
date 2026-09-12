import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req:Request){
  try{
    const s=createClient(); const {data:{user}}=await s.auth.getUser();
    if(!user)return NextResponse.json({error:'Not authenticated'},{status:401});
    const {data:me}=await s.from('profiles').select('role,status').eq('id',user.id).single();
    if(!me||me.status!=='active'||!['admin','super_admin'].includes(me.role))return NextResponse.json({error:'Admin access required'},{status:403});
    const b=await req.json(); const a=createAdminClient();
    const {data:master}=await a.from('profiles').select('id,role,username').eq('id',String(b.master_id)).single();
    if(!master||master.role!=='master')return NextResponse.json({error:'Master not found'},{status:404});
    const {data:perm}=await a.from('permissions').select('code').eq('code',String(b.permission_code)).single();
    if(!perm)return NextResponse.json({error:'Permission not found'},{status:404});
    const row={user_id:master.id,permission_code:perm.code,granted:Boolean(b.granted)};
    const {error}=await a.from('user_permissions').upsert(row,{onConflict:'user_id,permission_code'});
    if(error)return NextResponse.json({error:error.message},{status:400});
    await a.from('audit_logs').insert({user_id:user.id,action:'PERMISSION_UPDATED',module:'PERMISSIONS',reference_id:master.id,new_data:row});
    return NextResponse.json({success:true,message:`Permission ${row.granted?'enabled':'disabled'}`});
  }catch(e:any){return NextResponse.json({error:e.message||'Server error'},{status:500})}
}
