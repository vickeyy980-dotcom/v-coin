'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/icons';

// NOTE: Browsers can't trigger a literal "Face ID" prompt the way a native
// app can. The real equivalent here is the WebAuthn API
// (navigator.credentials.get(...)) against a passkey registered for this
// user, which will show whatever platform authenticator the device has
// (Face ID, Windows Hello, a fingerprint reader, etc.) — but the branding
// and UX are controlled by the OS, not by this page. This screen is a
// placeholder for that flow; clicking the ring simulates success.
export default function BiometricPage() {
  const router = useRouter();

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
      <Link href="/login" className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center">
        <Icon name="back" size={18} />
      </Link>

      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="relative mb-6 flex h-[132px] w-[132px] items-center justify-center rounded-[36px] border-2 border-line-strong"
      >
        <span className="absolute inset-0 animate-ping rounded-[36px] border-2 border-brass opacity-40" />
        <Icon name="face" size={44} className="text-brass" />
      </button>

      <h2 className="font-display text-[18px] font-bold">Confirm it&apos;s you</h2>
      <p className="mb-6 mt-1.5 text-[13.5px] text-muted">Use Face ID to unlock V Coin</p>
      <Link href="/login" className="text-[13px] font-semibold text-brass">
        Use passcode instead
      </Link>
    </div>
  );
}
