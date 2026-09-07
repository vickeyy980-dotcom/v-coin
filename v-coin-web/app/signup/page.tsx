'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PrimaryButton } from '@/components/ui';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [handle, setHandle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(cleanHandle)) {
      setError('Handle must be 3–24 characters using letters, numbers, or underscore.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), handle: cleanHandle } },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setMessage('Account created. Check your email to confirm it, then log in.');
    }
  }

  return (
    <div className="flex flex-1 flex-col px-6 pb-6 pt-10">
      <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-gradient-to-br from-brass to-brass-dim font-display text-[22px] font-extrabold text-[#1A1406]">V</div>
      <h1 className="font-display text-[23px] font-bold">Create V Coin account</h1>
      <p className="mb-7 mt-1.5 text-[14px] leading-relaxed text-muted">Your wallet is created automatically after signup.</p>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="Full name" value={fullName} onChange={setFullName} placeholder="Your name" />
        <Field label="Handle" value={handle} onChange={setHandle} placeholder="vicky" />
        <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
        <Field label="Password" value={password} onChange={setPassword} placeholder="At least 8 characters" type="password" />
        {error && <p className="text-[12.5px] text-red">{error}</p>}
        {message && <p className="text-[12.5px] text-green">{message}</p>}
        <PrimaryButton type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</PrimaryButton>
      </form>

      <div className="mt-auto pt-10 text-center text-[13px] text-muted">
        Already have an account? <Link href="/login" className="font-semibold text-brass">Log in</Link>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <label className="block rounded-2xl border border-line bg-field px-4 py-3.5">
      <span className="mb-0.5 block text-[11.5px] text-muted-2">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required className="w-full bg-transparent text-[15px] font-medium text-cream outline-none placeholder:text-muted-2" />
    </label>
  );
}
