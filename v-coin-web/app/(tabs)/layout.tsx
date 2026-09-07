import { BottomNav } from '@/components/BottomNav';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2">{children}</div>
      <BottomNav />
    </div>
  );
}
