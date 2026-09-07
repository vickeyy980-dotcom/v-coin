'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PrimaryButton, GhostButton } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/dashboard');
  }

  return (
    <div className="flex flex-1 flex-col px-6 pb-6 pt-10">
      <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-gradient-to-br from-brass to-brass-dim font-display text-[22px] font-extrabold text-[#1A1406]">
        V
      </div>
      <h1 className="font-display text-[23px] font-bold">Welcome back</h1>
      <p className="mb-7 mt-1.5 text-[14px] leading-relaxed text-muted">Log in to send, receive and hold V Coin.</p>

      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <Field label="Email" placeholder="you@example.com" value={email} onChange={setEmail} />
        <Field label="Password" placeholder="••••••••••" type="password" value={password} onChange={setPassword} />

        {error && <p className="text-[12.5px] text-red">{error}</p>}

        <div className="mb-1 text-right text-[12.5px] text-muted">Forgot password?</div>
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </PrimaryButton>
      </form>

      <div className="my-5 flex items-center gap-3 text-[12px] text-muted-2">
        <div className="h-px flex-1 bg-line" />
        or
        <div className="h-px flex-1 bg-line" />
      </div>

      <GhostButton href="/biometric" icon="face">
        Unlock with Face ID
      </GhostButton>

      <div className="mt-auto pt-10 text-center text-[13px] text-muted">
        New to V Coin? <Link href="/signup" className="font-semibold text-brass">Create an account</Link>
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block rounded-2xl border border-line bg-field px-4 py-3.5">
      <span className="mb-0.5 block text-[11.5px] text-muted-2">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[15px] font-medium text-cream outline-none placeholder:text-muted-2"
        required
      />
    </label>
  );
}
