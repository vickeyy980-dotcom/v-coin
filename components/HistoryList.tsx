'use client';

import { useMemo, useState } from 'react';
import { DateLabel, TxRow } from '@/components/ui';

type Row = {
  id: string;
  amount: number;
  created_at: string;
  direction: 'sent' | 'received';
};

const FILTERS = ['All', 'Sent', 'Received'] as const;

export function HistoryList({ rows, currency }: { rows: Row[]; currency: string }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  const filtered = useMemo(() => {
    if (filter === 'All') return rows;
    const want = filter === 'Sent' ? 'sent' : 'received';
    return rows.filter((r) => r.direction === want);
  }, [rows, filter]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Row[]>();
    for (const row of filtered) {
      const label = new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const key = label === today ? 'Today' : label;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return groups;
  }, [filtered]);

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-[12.5px] ${
              filter === f ? 'border-brass bg-brass font-semibold text-[#1A1406]' : 'border-line bg-panel2 text-muted'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted-2">No transactions in this filter.</p>
      ) : (
        Array.from(grouped.entries()).map(([label, items]) => (
          <div key={label}>
            <DateLabel>{label}</DateLabel>
            {items.map((row) => (
              <TxRow
                key={row.id}
                direction={row.direction}
                name={row.direction === 'received' ? 'Received' : 'Sent'}
                time={new Date(row.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                amount={`${row.direction === 'received' ? '+' : '-'}${row.amount.toFixed(2)} ${currency}`}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
