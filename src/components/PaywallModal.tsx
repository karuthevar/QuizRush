'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Lock,
  X,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { sounds } from '@/lib/soundEngine';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userEmail?: string;
  onUnlockSuccess?: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  userId = 'guest-host',
  userEmail,
  onUnlockSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = async (simulated: boolean = false) => {
    sounds.playPop();
    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail,
          simulated,
          origin: window.location.origin,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout redirect failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card max-w-lg w-full rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-400/20 to-rush-red/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rush-red/20 text-rush-red border border-rush-red/40 text-xs font-black uppercase tracking-wider mb-4">
          <Lock className="w-3.5 h-3.5" />
          <span>1 Free Trial Completed</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">
          Unlock Your Next Live Quiz for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rush-yellow to-rush-red">
            $4.99
          </span>
        </h2>

        <p className="text-white/70 text-sm leading-relaxed mb-6">
          Enjoy pay-per-quiz flexibility! No monthly subscriptions or recurring fees. Only pay when
          you host a live session.
        </p>

        {/* Feature Highlights Card */}
        <div className="bg-rush-navy/70 border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 space-y-3">
          <div className="text-xs uppercase font-extrabold tracking-wider text-amber-300 mb-2">
            What&apos;s Included in Your $4.99 Match Pass:
          </div>

          <div className="flex items-start space-x-3 text-xs sm:text-sm text-white/90">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Full Live Multiplayer Room</strong> with up to 100 concurrent players</span>
          </div>

          <div className="flex items-start space-x-3 text-xs sm:text-sm text-white/90">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Zero-Login Joining</strong> via Live QR Code & 4-character PIN</span>
          </div>

          <div className="flex items-start space-x-3 text-xs sm:text-sm text-white/90">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Single 1-of-4 & Multi-Choice</strong> questions with animated bar charts</span>
          </div>

          <div className="flex items-start space-x-3 text-xs sm:text-sm text-white/90">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Grand Confetti Podium</strong> & automated session history logging</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleCheckout(false)}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rush-green via-emerald-500 to-teal-400 hover:brightness-110 text-white font-black text-base uppercase tracking-wider shadow-xl shadow-emerald-500/30 flex items-center justify-center space-x-2 transition transform active:scale-95"
          >
            <CreditCard className="w-5 h-5" />
            <span>{loading ? 'Opening Stripe Checkout...' : 'Pay $4.99 via Stripe'}</span>
          </button>

          {/* Quick simulated test button for development */}
          <button
            onClick={() => handleCheckout(true)}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>🧪 Instant Test Payment (Dev/Demo Mode)</span>
          </button>
        </div>

        <div className="mt-4 text-center text-[11px] text-white/40 flex items-center justify-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Guaranteed secure 256-bit encrypted checkout via Stripe</span>
        </div>
      </div>
    </div>
  );
};
