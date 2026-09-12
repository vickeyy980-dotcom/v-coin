'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PrimaryButton } from '@/components/ui';

type Role = 'super_admin' | 'admin' | 'master' | 'user';

type ProfileRole = {
  role: Role | string | null;
  status: string | null;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !authData.user) {
      setLoading(false);
      setError(signInError?.message || 'Unable to log in.');
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role,status')
      .eq('id', authData.user.id)
      .single<ProfileRole>();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setLoading(false);
      setError('Your V Coin profile was not found. Please contact admin.');
      return;
    }

    if (profile.status !== 'active') {
      await supabase.auth.signOut();
      setLoading(false);
      setError('Your account is not active. Please contact admin.');
      return;
    }

    const role = String(profile.role || '').toLowerCase();
    let destination = '/dashboard';

    if (role === 'admin' || role === 'super_admin') destination = '/admin';
    else if (role === 'master') destination = '/master';
    else if (role === 'user') destination = '/dashboard';
    else {
      await supabase.auth.signOut();
      setLoading(false);
      setError('Your account role is not configured correctly.');
      return;
    }

    router.replace(destination);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col px-6 pb-7 pt-10">
      <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-gradient-to-br from-brass to-brass-dim font-display text-[22px] font-extrabold text-[#1A1406]">V</div>
      <h1 className="font-display text-[24px] font-bold">Welcome back</h1>
      <p className="mb-7 mt-1.5 text-[14px] text-muted">Log in to send, receive and hold V Coin.</p>
      <form onSubmit={go} className="flex flex-col gap-3">
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Password" value={password} onChange={setPassword} type="password" />
        {error && <p className="text-[12.5px] text-red">{error}</p>}
        <PrimaryButton type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</PrimaryButton>
      </form>
      <div className="mt-auto pt-10 text-center text-[13px] text-muted">
        New to V Coin? <Link href="/signup" className="font-semibold text-brass">Create an account</Link>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type }: { label: string; value: string; onChange: (v: string) => void; type: string }) {
  return (
    <label className="block rounded-2xl border border-line bg-field px-4 py-3.5">
      <span className="mb-0.5 block text-[11.5px] text-muted-2">{label}</span>
      <input required type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-[15px] text-cream outline-none" />
    </label>
  );
}
