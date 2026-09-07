'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SettingRow } from '@/components/ui';

export function ProfileSettings() {
  const router = useRouter();
  const [biometricOn, setBiometricOn] = useState(true);
  const [notifsOn, setNotifsOn] = useState(true);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-2 text-[11.5px] text-muted-2">Security</div>
        <div className="overflow-hidden rounded-2xl">
          <SettingRow name="face" label="Biometric unlock" trailing={<Toggle on={biometricOn} onChange={setBiometricOn} />} />
          <SettingRow name="key" label="Change passcode" />
        </div>
      </div>

      <div>
        <div className="mb-2 text-[11.5px] text-muted-2">Preferences</div>
        <div className="overflow-hidden rounded-2xl">
          <SettingRow name="globe" label="Currency · USD" />
          <SettingRow name="bell" label="Notifications" trailing={<Toggle on={notifsOn} onChange={setNotifsOn} />} />
        </div>
      </div>

      <div>
        <div className="mb-2 text-[11.5px] text-muted-2">Support</div>
        <div className="overflow-hidden rounded-2xl">
          <SettingRow name="help" label="Help center" />
          <SettingRow name="mail" label="Contact us" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl">
        <button onClick={signOut} className="w-full text-left">
          <SettingRow name="logout" label="Log out" labelClass="text-red" />
        </button>
      </div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative h-[22px] w-[38px] flex-shrink-0 rounded-full transition ${on ? 'bg-brass' : 'bg-field'}`}
    >
      <span
        className={`absolute top-[2px] h-[18px] w-[18px] rounded-full transition-all ${on ? 'left-[18px] bg-[#1A1406]' : 'left-[2px] bg-cream'}`}
      />
    </button>
  );
}
