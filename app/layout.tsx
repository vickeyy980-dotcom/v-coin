import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'V Coin',
  description: 'The everyday wallet for V Coin.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-ink text-cream">
        <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-ink">{children}</div>
      </body>
    </html>
  );
}
