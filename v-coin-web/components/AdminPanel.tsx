'use client';

import { useEffect, useState } from 'react';

type Profile = {
  id: string;
  handle: string | null;
  full_name: string | null;
  role: string | null;
  status: string | null;
};

export default function AdminPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [handle, setHandle] = useState('');
  const [amount, setAmount] = useState('');

  async function loadUsers() {
    try {
      setLoading(true);

      const res = await fetch('/api/admin/users', {
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Unable to load users');
      }

      setProfiles(data.profiles || []);
    } catch (err: any) {
      setMessage(err.message || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Mint failed');
      }

      setMessage(`Successfully added ${numericAmount} VC to @${handle.replace(/^@/, '')}`);
      setAmount('');
      await loadUsers();
    } catch (err: any) {
      setMessage(err.message || 'Mint failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#171927] p-5">
        <h2 className="mb-4 text-xl font-semibold text-white">Mint VC</h2>

        <form onSubmit={mintVC} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Username
            </label>

            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@username"
              className="w-full rounded-xl border border-white/10 bg-[#10121c] px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Amount
            </label>

            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="1000"
              className="w-full rounded-xl border border-white/10 bg-[#10121c] px-4 py-3 text-white outline-none"
            />
          </div>

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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Users</h2>

          <button
            onClick={loadUsers}
            className="text-sm text-amber-300"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading users...</p>
        ) : profiles.length === 0 ? (
          <p className="text-gray-400">No users found.</p>
        ) : (
          <div className="space-y-3">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="rounded-xl border border-white/10 bg-[#10121c] p-4"
              >
                <div className="font-medium text-white">
                  {profile.full_name || 'Unnamed user'}
                </div>

                <div className="mt-1 text-sm text-gray-400">
                  @{profile.handle || 'no-handle'}
                </div>

                <div className="mt-2 flex gap-2 text-xs">
                  <span className="rounded-full bg-white/10 px-2 py-1 text-gray-300">
                    {profile.role || 'user'}
                  </span>

                  <span className="rounded-full bg-white/10 px-2 py-1 text-gray-300">
                    {profile.status || 'unknown'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}