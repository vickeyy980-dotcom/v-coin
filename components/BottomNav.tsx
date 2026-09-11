'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icons';

const TABS = [
  { href: '/dashboard', name: 'home', label: 'Home' },
  { href: '/assets', name: 'wallet', label: 'Assets' },
] as const;

const TABS_RIGHT = [
  { href: '/history', name: 'clock', label: 'Activity' },
  { href: '/profile', name: 'user', label: 'Profile' },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-20 flex-shrink-0 border-t border-line bg-panel/90 backdrop-blur">
      {TABS.map((tab) => (
        <Tab key={tab.href} active={pathname === tab.href} {...tab} />
      ))}

      <Link href="/scan" className="flex flex-1 items-start justify-center pt-[11px]">
        <span className="-mt-[26px] flex h-[50px] w-[50px] items-center justify-center rounded-full bg-brass shadow-[0_8px_18px_-6px_rgba(201,161,90,0.6)]">
          <Icon name="scan" size={20} className="text-[#1A1406]" />
        </span>
      </Link>

      {TABS_RIGHT.map((tab) => (
        <Tab key={tab.href} active={pathname === tab.href} {...tab} />
      ))}
    </nav>
  );
}

function Tab({ href, name, label, active }: { href: string; name: Parameters<typeof Icon>[0]['name']; label: string; active: boolean }) {
  const color = active ? 'text-brass' : 'text-muted-2';
  return (
    <Link href={href} className={`flex flex-1 flex-col items-center gap-1.5 pt-[11px] ${color}`}>
      <Icon name={name} size={20} />
      <span className="text-[10.5px] font-semibold">{label}</span>
    </Link>
  );
}
