import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const allowedTypes=['WALLET_MAINTENANCE','INTERNAL_TRANSFER','VCOIN_TOPUP','CRYPTO_CONVERSION','BANK_TRANSFER'];
export async function POST(req:Request){
  try{
    const s=createClient(); const {data:{user}}=await s.auth.getUser();
    if(!user)return NextResponse.json({error:'Not authenticated'},{status:401});
    const {data:me}=await s.from('profiles').select('role,status').eq('id',user.id).single();
    if(!me||me.status!=='active'||!['admin','super_admin'].includes(me.role))return NextResponse.json({error:'Admin access required'},{status:403});
    const b=await req.json(); const a=createAdminClient();
    if(b.delete){
      const {data:old}=await a.from('charge_rules').select('*').eq('id',String(b.id)).single();
      const {error}=await a.from('charge_rules').delete().eq('id',String(b.id));
      if(error)return NextResponse.json({error:error.message},{status:400});
      await a.from('audit_logs').insert({user_id:user.id,action:'CHARGE_RULE_DELETED',module:'CHARGES',reference_id:String(b.id),old_data:old||null});
      return NextResponse.json({success:true,message:'Charge rule removed'});
    }
    const type=String(b.charge_type||''); const mode=String(b.charge_mode||''); const value=Number(b.charge_value);
    if(!allowedTypes.includes(type))return NextResponse.json({error:'Invalid charge type'},{status:400});
    if(!['FIXED','PERCENTAGE'].includes(mode))return NextResponse.json({error:'Invalid charge mode'},{status:400});
    if(!Number.isFinite(value)||value<0)return NextResponse.json({error:'Invalid charge value'},{status:400});
    const row={master_id:b.master_id||null,charge_type:type,charge_mode:mode,charge_value:value,minimum_charge:b.minimum_charge==null?null:Number(b.minimum_charge),maximum_charge:b.maximum_charge==null?null:Number(b.maximum_charge),is_active:true,created_by:user.id};
    // Keep one active rule for the same scope/type.
    let q=a.from('charge_rules').update({is_active:false}).eq('charge_type',type).eq('is_active',true);
    q=b.master_id?q.eq('master_id',String(b.master_id)):q.is('master_id',null); await q;
    const {data,error}=await a.from('charge_rules').insert(row).select('id').single();
    if(error)return NextResponse.json({error:error.message},{status:400});
    await a.from('audit_logs').insert({user_id:user.id,action:'CHARGE_RULE_SAVED',module:'CHARGES',reference_id:data.id,new_data:row});
    return NextResponse.json({success:true,message:'Charge rule saved'});
  }catch(e:any){return NextResponse.json({error:e.message||'Server error'},{status:500})}
}
