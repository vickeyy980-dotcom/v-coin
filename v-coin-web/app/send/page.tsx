'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar, PrimaryButton } from '@/components/ui';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
const CONTACTS = [
  { initial: 'P', name: 'Priya', handle: 'priya' },
  { initial: 'R', name: 'Rahul', handle: 'rahul' },
  { initial: 'A', name: 'Anya', handle: 'anya' },
  { initial: 'K', name: 'Kabir', handle: 'kabir' },
];

export default function SendPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('0');
  const [receiverHandle, setReceiverHandle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const recipient = new URLSearchParams(window.location.search).get('to');
    if (recipient) setReceiverHandle(recipient);
  }, []);

  function press(key: string) {
    setAmount((prev) => {
      if (key === '⌫') return prev.length > 1 ? prev.slice(0, -1) : '0';
      if (key === '.') return prev.includes('.') ? prev : prev + '.';
      return prev === '0' ? key : prev + key;
    });
  }

  async function review() {
    setError(null);
    if (!receiverHandle.trim()) {
      setError('Enter a recipient handle.');
      return;
    }
    setSubmitting(true);
    const res = await fetch('/api/send-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverHandle: receiverHandle.trim(), amount: parseFloat(amount) }),
    });
    const body = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(body.error ?? 'Something went wrong.');
      return;
    }
    router.push('/dashboard');
  }

  const numericAmount = parseFloat(amount) || 0;

  return (
    <div className="flex flex-1 flex-col px-5 pb-5 pt-2">
      <TopBar title="Send" backHref="/dashboard" />

      <label className="mt-1 block rounded-2xl border border-line bg-field px-4 py-3.5">
        <span className="mb-0.5 block text-[11.5px] text-muted-2">To</span>
        <input
          value={receiverHandle}
          onChange={(e) => setReceiverHandle(e.target.value)}
          placeholder="@handle or wallet address"
          className="w-full bg-transparent text-[15px] font-medium text-cream outline-none placeholder:text-muted-2"
        />
      </label>

      <div className="my-3.5 flex gap-3.5 overflow-x-auto">
        {CONTACTS.map((c) => (
          <button key={c.handle} onClick={() => setReceiverHandle(c.handle)} className="flex flex-shrink-0 flex-col items-center gap-1.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-panel2 font-display text-[14px] font-bold text-brass">
              {c.initial}
            </div>
            <span className="text-[10.5px] text-muted">{c.name}</span>
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <div className="text-center">
        <div className="font-display text-[44px] font-extrabold tracking-tight tabular-nums">
          {amount} <span className="text-[24px] font-semibold text-muted">VC</span>
        </div>
        <div className="mt-1.5 text-[13px] text-muted">≈ ${numericAmount.toFixed(2)}</div>
        {error && <p className="mt-2 text-[12.5px] text-red">{error}</p>}
      </div>

      <div className="flex-1" />

      <div className="grid grid-cols-3 gap-1.5 px-1.5">
        {KEYS.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className="rounded-2xl py-3.5 font-display text-[19px] font-semibold text-cream active:bg-panel2"
          >
            {k}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <PrimaryButton onClick={review} disabled={amount === '0' || submitting}>
          {submitting ? 'Sending…' : 'Review transfer'}
        </PrimaryButton>
      </div>
    </div>
  );
}
