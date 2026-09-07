'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/ui';
import { Icon } from '@/components/icons';

// Uses the browser's BarcodeDetector API where it exists (Chrome/Edge on
// Android and desktop) to actually read a QR code from the camera feed.
// Safari/iOS don't support BarcodeDetector yet — there the viewfinder still
// shows, but detection needs a JS fallback library (e.g. `jsQR`) wired
// into the same video element.
export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;

    async function start() {
      if (!('BarcodeDetector' in window)) {
        setSupported(false);
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError('Camera access was denied. Enable it in your browser settings to scan.');
        return;
      }

      if ('BarcodeDetector' in window) {
        // @ts-expect-error — BarcodeDetector isn't in the TS DOM lib yet
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const tick = async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0) {
                router.push(`/send?to=${encodeURIComponent(codes[0].rawValue)}`);
                return;
              }
            } catch {
              // detection hiccup — keep trying
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }
    }

    start();
    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [router]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-5 pt-2">
        <TopBar title="Scan to pay" backHref="/dashboard" />
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
        <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover opacity-80" />

        <div className="relative h-[210px] w-[210px]">
          <Corner className="left-0 top-0 rounded-tl-[10px] border-l-4 border-t-4" />
          <Corner className="right-0 top-0 rounded-tr-[10px] border-r-4 border-t-4" />
          <Corner className="bottom-0 left-0 rounded-bl-[10px] border-b-4 border-l-4" />
          <Corner className="bottom-0 right-0 rounded-br-[10px] border-b-4 border-r-4" />
        </div>

        {error && (
          <p className="absolute bottom-6 left-6 right-6 text-center text-[13px] text-red">{error}</p>
        )}
        {!error && !supported && (
          <p className="absolute bottom-6 left-6 right-6 text-center text-[12px] text-muted">
            Automatic detection isn&apos;t supported in this browser yet — enter the address manually instead.
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-3.5 py-6">
        <button
          type="button"
          onClick={() => router.push('/send')}
          className="text-[13px] font-semibold text-brass"
        >
          Enter address manually
        </button>
      </div>
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return <span className={`absolute h-8 w-8 border-brass ${className}`} />;
}
