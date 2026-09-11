type IconName =
  | 'home' | 'wallet' | 'scan' | 'clock' | 'user' | 'bell' | 'send' | 'receive'
  | 'plus' | 'back' | 'copy' | 'share' | 'face' | 'key' | 'globe' | 'help'
  | 'mail' | 'logout' | 'shield' | 'flash';

const PATHS: Record<IconName, string> = {
  home: '<path d="M3 10.5 12 3l9 7.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 9.5V20a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1V9.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="3" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M3 10h18" stroke="currentColor" stroke-width="1.8"/><circle cx="16.5" cy="14.2" r="1.2" fill="currentColor"/>',
  scan: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.8" fill="none"/>',
  clock: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  user: '<circle cx="12" cy="8.5" r="3.5" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M4.5 20c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  bell: '<path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13.5 6 9.5Z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/><path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
  send: '<path d="M6 18 18 6M18 6H9M18 6v9" stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  receive: '<path d="M18 6 6 18M6 18h9M6 18V9" stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round"/>',
  back: '<path d="M15 19 8 12l7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  copy: '<rect x="8.5" y="8.5" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M5.5 15.5h-1a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="1.6" fill="none"/>',
  share: '<path d="M12 15V4M12 4 8 8M12 4l4 4" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
  face: '<circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="10.5" r="1" fill="currentColor"/><circle cx="15" cy="10.5" r="1" fill="currentColor"/><path d="M9.3 14.2c.7.7 1.6 1 2.7 1s2-.3 2.7-1" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  key: '<circle cx="8" cy="15.5" r="3.2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M10.3 13.2 18 5.5M15.5 8l2 2M18 5.5l2 2" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  globe: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M3.5 12h17M12 3.5c2.4 2.3 3.7 5.3 3.7 8.5s-1.3 6.2-3.7 8.5c-2.4-2.3-3.7-5.3-3.7-8.5S9.6 5.8 12 3.5Z" stroke="currentColor" stroke-width="1.6" fill="none"/>',
  help: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M9.5 9.3a2.5 2.5 0 1 1 3.4 2.3c-.9.4-1.4 1-1.4 2" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="12" cy="16.6" r="0.9" fill="currentColor"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="m4.5 7 7.5 6 7.5-6" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  logout: '<path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3M15 16l4-4-4-4M19 12H9" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  shield: '<path d="M12 3.5 5 6v5.5c0 4.7 3 7.6 7 9 4-1.4 7-4.3 7-9V6l-7-2.5Z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/>',
  flash: '<path d="M12 3 5 13.5h5.5L11 21l7-11h-5.5L12 3Z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/>',
};

export function Icon({ name, size = 18, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}
