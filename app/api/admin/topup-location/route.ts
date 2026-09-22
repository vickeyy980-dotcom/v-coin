import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export async function POST(req:Request){
 const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user)return NextResponse.json({error:'Not authenticated'},{status:401});
 const {data:me}=await s.from('profiles').select('role').eq('id',user.id).single();if(!me||!['admin','super_admin'].includes(me.role))return NextResponse.json({error:'Admin access required'},{status:403});
 const b=await req.json();
 if(b.delete){const {error}=await s.from('topup_locations').update({is_active:false,updated_at:new Date().toISOString()}).eq('id',String(b.id));return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({message:'Location disabled'})}
 const city=String(b.city||'').trim(),area=String(b.area||'').trim(),area_code=String(b.area_code||'').trim(),payment_address=String(b.payment_address||'').trim();
 if(!city||!area||!area_code||!payment_address)return NextResponse.json({error:'City, Area, Area Code and Payment Address are required'},{status:400});
 const {error}=await s.from('topup_locations').upsert({city,area,area_code,payment_address,is_active:true,updated_at:new Date().toISOString()},{onConflict:'city,area,area_code'});
 return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({message:'Top-up location saved'});
}