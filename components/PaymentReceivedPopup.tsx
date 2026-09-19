"use client";

import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";
import styles from "./PaymentReceivedPopup.module.css";

export type ReceivedPayment = {
  id: string;
  amount: number;
  senderName?: string | null;
  receivedAt?: string | null;
};

type Props = {
  payment: ReceivedPayment | null;
  onClose: () => void;
};

export default function PaymentReceivedPopup({ payment, onClose }: Props) {
  const animationRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!payment || !animationRef.current) return;
    let cancelled = false;
    let player: AnimationItem | undefined;

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      Promise.all([
        import("lottie-web"),
        fetch("/animations/v-coin-received.json").then((response) => {
          if (!response.ok) throw new Error("Unable to load V coin animation");
          return response.json();
        }),
      ])
        .then(([module, animationData]) => {
          if (cancelled || !animationRef.current) return;
          player = module.default.loadAnimation({
            container: animationRef.current,
            renderer: "svg",
            loop: true,
            autoplay: true,
            animationData,
          });
        })
        .catch((error) => console.error("V coin animation:", error));
    }

    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        // This dialog has one keyboard action; keep focus inside it.
        event.preventDefault();
        closeRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelled = true;
      player?.destroy();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [payment?.id, onClose]);

  if (!payment) return null;

  const amount = Number.isFinite(payment.amount)
    ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(payment.amount)
    : "0";

  return (
    <div className={styles.backdrop} onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="received-title" aria-describedby="received-detail">
        <button ref={closeRef} className={styles.close} type="button" onClick={onClose} aria-label="Close payment notification">×</button>
        <div className={styles.coin} role="img" aria-label="V coin animation">
          <div ref={animationRef} className={styles.animation} />
          <span className={styles.staticCoin} aria-hidden="true">V</span>
        </div>
        <h2 id="received-title">Payment received!</h2>
        <p className={styles.amount}>+{amount} V</p>
        <p id="received-detail" className={styles.detail}>
          {payment.senderName ? `From ${payment.senderName}` : "Your wallet has been credited."}
        </p>
        <button className={styles.done} type="button" onClick={onClose}>Done</button>
      </section>
    </div>
  );
}
