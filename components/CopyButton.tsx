'use client';

import { useState } from 'react';
import { Icon } from './icons';

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line-strong py-3.5 text-[14.5px] font-semibold text-cream"
    >
      <Icon name="copy" size={16} />
      {copied ? 'Copied!' : label}
    </button>
  );
}

export function CopyPill({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button onClick={copy} className="flex w-full items-center gap-2 rounded-full bg-field px-3.5 py-2">
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-[12.5px] text-muted">{value}</span>
      <Icon name="copy" size={15} className="text-muted flex-shrink-0" />
      {copied && <span className="flex-shrink-0 text-[11px] text-brass">Copied</span>}
    </button>
  );
}
