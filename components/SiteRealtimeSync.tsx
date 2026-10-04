'use client';
import { useEffect,useRef } from 'react';
import { usePathname,useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const TABLES=['wallets','wallet_transactions','topup_requests','crypto_conversion_requests','bank_transfer_requests','commissions'] as const;

export function SiteRealtimeSync(){
 const router=useRouter(),pathname=usePathname();
 const audioRef=useRef<HTMLAudioElement|null>(null);
 const soundReadyRef=useRef(false);

 useEffect(()=>{
  const audio=new Audio('/sounds/notification.mp3');
  audio.preload='auto';
  audio.volume=1;
  audioRef.current=audio;

  // Browsers require a user interaction before notification audio can play.
  // Unlock the audio on the user's first click/touch/key press without making an audible sound.
  const unlock=()=>{
   const a=audioRef.current;
   if(!a||soundReadyRef.current)return;
   const oldVolume=a.volume;
   a.volume=0;
   a.play().then(()=>{
    a.pause();
    a.currentTime=0;
    a.volume=oldVolume;
    soundReadyRef.current=true;
   }).catch(()=>{a.volume=oldVolume;});
  };
  window.addEventListener('pointerdown',unlock,{passive:true});
  window.addEventListener('keydown',unlock);
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
  const refresh=()=>{if(timer)clearTimeout(timer);timer=setTimeout(()=>router.refresh(),120)};
  const playNotification=()=>{
   const a=audioRef.current;
   if(a){a.currentTime=0;a.play().catch(()=>{});}
   refresh();
  };

  const c=s.channel('vcoin-site-realtime');
  for(const table of TABLES)c.on('postgres_changes',{event:'*',schema:'public',table},refresh);
  c.on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications'},playNotification);
  c.on('postgres_changes',{event:'UPDATE',schema:'public',table:'notifications'},refresh);
  c.subscribe();
  return()=>{if(timer)clearTimeout(timer);s.removeChannel(c)};
 },[router,pathname]);
 return null;
}
