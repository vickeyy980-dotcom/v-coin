'use client';

import { useState } from 'react';

type User = {
  id: string;
  handle: string | null;
  full_name: string | null;
  role: 'user' | 'admin';
  status: 'active' | 'blocked';
  balance: number;
  currency: string | null;
  address: string | null;
};

type AdminPanelProps = {
  users: User[];
};

export default function AdminPanel({ users }: AdminPanelProps) {
  const [message, setMessage] = useState('');
  const [handle, setHandle] = useState('');
  const [amount, setAmount] = useState('');

  async function mintVC(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    const numericAmount = Number(amount);

    if (!handle.trim()) {
      setMessage('Enter username');
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      setMessage('Enter a valid amount');
      return;
    }

    try {
      const res = await fetch('/api/admin/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          handle: handle.trim().replace(/^@/, ''),
          amount: numericAmount,
        }),
      });

      const contentType = res.headers.get('content-type');

if (!contentType?.includes('application/json')) {
  const text = await res.text();
  throw new Error(
    `Server returned ${res.status}. Mint API route is unavailable.`
  );
}

const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Mint failed');
      }

      setMessage(
        `Successfully added ${numericAmount} VC to @${handle.replace(/^@/, '')}`
      );

      setAmount('');
    } catch (err: any) {
      setMessage(err.message || 'Mint failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#171927] p-5">
        <h2 className="mb-4 text-xl font-semibold text-white">
          Mint VC
        </h2>

        <form onSubmit={mintVC} className="space-y-4">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@username"
            className="w-full rounded-xl border border-white/10 bg-[#10121c] px-4 py-3 text-white"
          />

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount"
            className="w-full rounded-xl border border-white/10 bg-[#10121c] px-4 py-3 text-white"
          />

          <button
            type="submit"
            className="w-full rounded-xl bg-amber-400 px-4 py-3 font-semibold text-black"
          >
            Add VC
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-amber-300">
            {message}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#171927] p-5">
        <h2 className="mb-4 text-xl font-semibold text-white">
          Users
        </h2>

        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-xl border border-white/10 bg-[#10121c] p-4"
            >
              <div className="font-medium text-white">
                {user.full_name || 'Unnamed user'}
              </div>

              <div className="text-sm text-gray-400">
                @{user.handle || 'no-handle'}
              </div>

              <div className="mt-2 text-sm text-gray-300">
                Balance: {user.balance} {user.currency || 'VC'}
              </div>

              <div className="mt-1 text-xs text-gray-500">
                {user.role} · {user.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
