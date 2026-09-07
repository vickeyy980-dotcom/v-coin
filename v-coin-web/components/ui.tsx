import Link from 'next/link';
import { Icon } from './icons';

export function PrimaryButton({
  children,
  href,
  onClick,
  type = 'button',
  disabled = false,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const className =
    'w-full rounded-2xl bg-brass py-4 text-center font-display font-bold text-[15px] text-[#1A1406] transition disabled:opacity-35';
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  href,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  icon?: React.ComponentProps<typeof Icon>['name'];
}) {
  const inner = (
    <span className="flex items-center justify-center gap-2">
      {icon && <Icon name={icon} size={17} />}
      {children}
    </span>
  );
  const className =
    'w-full rounded-2xl border border-line-strong py-3.5 text-center font-semibold text-[14.5px] text-cream';
  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

export function IconChip({
  name,
  size = 38,
  radius = 12,
  color = 'text-brass',
  bg = 'bg-panel2',
}: {
  name: React.ComponentProps<typeof Icon>['name'];
  size?: number;
  radius?: number;
  color?: string;
  bg?: string;
}) {
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center ${bg} ${color}`}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <Icon name={name} size={Math.round(size * 0.42)} />
    </div>
  );
}

export function BalanceCard({
  label,
  amount,
  fiat,
  changeLabel,
}: {
  label: string;
  amount: string;
  fiat: string;
  changeLabel: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-panel2 p-6">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-[150px] w-[150px] rounded-full border-[14px] border-brass-soft"
        aria-hidden
      >
        <div className="absolute inset-[22px] rounded-full border-2 border-brass-soft" />
      </div>
      <div className="relative">
        <div className="mb-2 text-[12.5px] text-muted">{label}</div>
        <div className="font-display text-[32px] font-extrabold tracking-tight tabular-nums">{amount}</div>
        <div className="mt-1 text-[13px] text-muted tabular-nums">{fiat}</div>
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-green/10 px-2.5 py-1.5 text-[12.5px] font-semibold text-green">
          {changeLabel}
        </div>
      </div>
    </div>
  );
}

export function QuickAction({
  name,
  label,
  href,
}: {
  name: React.ComponentProps<typeof Icon>['name'];
  label: string;
  href: string;
}) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2">
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-line bg-panel2 text-brass">
        <Icon name={name} size={20} />
      </div>
      <span className="text-[11.5px] font-medium text-muted">{label}</span>
    </Link>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  actionHref,
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h3 className="font-display text-[15.5px] font-bold">{title}</h3>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="text-[12.5px] font-semibold text-brass">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function TxRow({
  direction,
  name,
  time,
  amount,
}: {
  direction: 'sent' | 'received';
  name: string;
  time: string;
  amount: string;
}) {
  const positive = direction === 'received';
  return (
    <div className="flex items-center gap-3 border-b border-line py-2.5 last:border-none">
      <IconChip name={positive ? 'receive' : 'send'} color={positive ? 'text-green' : 'text-brass'} />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold">{name}</div>
        <div className="mt-0.5 text-[12px] text-muted-2">{time}</div>
      </div>
      <div className={`flex-shrink-0 text-[14px] font-bold tabular-nums ${positive ? 'text-green' : 'text-cream'}`}>{amount}</div>
    </div>
  );
}

export function AssetRow({
  mono,
  name,
  holding,
  value,
  change,
  changeColor = 'text-muted-2',
}: {
  mono: string;
  name: string;
  holding: string;
  value: string;
  change: string;
  changeColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-3.5 last:border-none">
      <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-full bg-brass-soft font-display text-[13px] font-extrabold text-brass">
        {mono}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold">{name}</div>
        <div className="mt-0.5 text-[12px] text-muted-2 tabular-nums">{holding}</div>
      </div>
      <div className="text-right">
        <div className="text-[14.5px] font-bold tabular-nums">{value}</div>
        <div className={`mt-0.5 text-[11.5px] ${changeColor}`}>{change}</div>
      </div>
    </div>
  );
}

export function SettingRow({
  name,
  label,
  href,
  trailing,
  labelClass = 'text-cream',
}: {
  name: React.ComponentProps<typeof Icon>['name'];
  label: string;
  href?: string;
  trailing?: React.ReactNode;
  labelClass?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 border-b border-line bg-panel2 px-3.5 py-3.5 first:rounded-t-2xl last:rounded-b-2xl last:border-none">
      <Icon name={name} size={17} className="text-muted" />
      <span className={`flex-1 text-[14px] font-medium ${labelClass}`}>{label}</span>
      {trailing}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export function DateLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 mt-3.5 text-[12px] font-semibold text-muted-2 first:mt-0">{children}</div>;
}

export function TopBar({
  title,
  backHref,
  right,
}: {
  title: string;
  backHref?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      {backHref ? (
        <Link href={backHref} className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-panel2">
          <Icon name="back" size={16} />
        </Link>
      ) : (
        <div className="w-[34px]" />
      )}
      <div className="font-display text-[19px] font-bold">{title}</div>
      {right ?? <div className="w-[34px]" />}
    </div>
  );
}
