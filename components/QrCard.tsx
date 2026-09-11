'use client';
import { useEffect,useState } from 'react';
import QRCode from 'qrcode';
import { CopyButton, CopyPill } from '@/components/CopyButton';
export function QrCard({address,username}:{address:string;username:string}){const [src,setSrc]=useState('');useEffect(()=>{QRCode.toDataURL(JSON.stringify({type:'VCOIN',recipient:address,username}),{width:320,margin:2,color:{dark:'#14161F',light:'#EEEAE0'}}).then(setSrc)},[address,username]);return <div>{src&&<div className="mt-3 flex flex-col items-center rounded-2xl bg-cream p-6"><img src={src} alt="Wallet QR" className="h-[190px] w-[190px]"/><div className="mt-4 font-display text-[15px] font-bold text-[#14161F]">@{username}</div></div>}<div className="my-4"><CopyPill value={address}/></div><CopyButton value={address} label="Copy address"/></div>}
