'use client';
import { useEffect,useRef } from 'react';
import { usePathname,useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const TABLES=['wallets','wallet_transactions','topup_requests','crypto_conversion_requests','bank_transfer_requests','commissions'] as const;

export function SiteRealtimeSync(){
 const router=useRouter(),pathname=usePathname();
 const audioRef=useRef<HTMLAudioElement|null>(null);
 const userIdRef=useRef<string|null>(null);

 useEffect(()=>{
  const audio=new Audio('/sounds/notification.mp3');
  audio.preload='auto';
  audio.volume=1;
  audioRef.current=audio;

  // Unlock audio after the first real user interaction.
  const unlock=()=>{
   const a=audioRef.current;
   if(!a)return;
   const oldVolume=a.volume;
   a.volume=0;
   a.play().then(()=>{
    a.pause();
    a.currentTime=0;
    a.volume=oldVolume;
   }).catch(()=>{a.volume=oldVolume;});
  };
  window.addEventListener('pointerdown',unlock,{once:true,passive:true});
  window.addEventListener('keydown',unlock,{once:true});
  return()=>{
   window.removeEventListener('pointerdown',unlock);
   window.removeEventListener('keydown',unlock);
   audio.pause();
   audioRef.current=null;
  };
 },[]);

 useEffect(()=>{
  const s=createClient();
  let timer:ReturnType<typeof setTimeout>|null=null;
  let alive=true;
  let channel:any=null;
  const refresh=()=>{if(timer)clearTimeout(timer);timer=setTimeout(()=>router.refresh(),150)};

  const start=async()=>{
   const {data:{user}}=await s.auth.getUser();
   if(!alive)return;
   userIdRef.current=user?.id||null;

   channel=s.channel(`vcoin-site-realtime-${user?.id||'guest'}`);
   for(const table of TABLES)channel.on('postgres_changes',{event:'*',schema:'public',table},refresh);

   // Listen only for this signed-in user's notification. This makes the badge
   // refresh and sound happen from the same INSERT event.
   if(user?.id){
    channel.on('postgres_changes',{
     event:'INSERT',schema:'public',table:'notifications',filter:`user_id=eq.${user.id}`
    },()=>{
     const a=audioRef.current;
     if(a){
      a.currentTime=0;
      a.volume=1;
      a.play().catch(()=>{});
     }
     refresh();
    });
    channel.on('postgres_changes',{
     event:'UPDATE',schema:'public',table:'notifications',filter:`user_id=eq.${user.id}`
    },refresh);
   }
   channel.subscribe();
  };
  start();

  return()=>{
   alive=false;
   if(timer)clearTimeout(timer);
   if(channel)s.removeChannel(channel);
  };
 },[router,pathname]);
 return null;
}
