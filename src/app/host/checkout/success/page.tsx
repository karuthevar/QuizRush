'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Zap, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { addHostCredits } from '@/lib/billingEngine';
import { sounds } from '@/lib/soundEngine';

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || 'guest-host';
  const simulated = searchParams.get('simulated') === 'true';
  const sessionId = searchParams.get('session_id');

  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    sounds.playCorrect();

    // Trigger celebratory confetti burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E21B3C', '#1368CE', '#FFA602', '#26890C', '#FFFFFF'],
    });

    // Credit user +1 quiz pass
    addHostCredits(userId, 1, {
      id: sessionId || `tx_${Date.now()}`,
      amount: 499,
      status: simulated ? 'simulated' : 'paid',
    }).then(() => {
      setProcessed(true);
    });
  }, [userId, simulated, sessionId]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-full max-w-lg glass-card p-8 sm:p-10 rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20 animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rush-yellow/10 text-amber-300 border border-rush-yellow/30 text-xs font-black uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Payment Confirmed &bull; $4.99 USD</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
          Quiz Pass Unlocked!
        </h1>
        <p className="text-white/70 text-sm leading-relaxed mb-6">
          Your account now has <strong className="text-amber-300 font-black">+1 Live Quiz Pass</strong>.
          You can now host your match with full audio, real-time QR code joining, and confetti podium!
        </p>

        {simulated && (
          <div className="w-full p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-200 text-xs font-bold mb-6">
            🧪 Demo Mode: Credit added instantly for testing! In production, this verifies with live Stripe webhooks.
          </div>
        )}

        <div className="w-full flex flex-col sm:flex-row gap-3">
          <Link
            href="/host/dashboard"
            className="flex-1 flex items-center justify-center space-x-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rush-green to-emerald-500 hover:brightness-110 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/30 transition transform hover:scale-105 active:scale-95"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Launch Live Match</span>
          </Link>

          <Link
            href="/admin"
            className="flex items-center justify-center space-x-2 py-3.5 px-5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition"
          >
            <span>Billing & Admin</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-white font-bold">Verifying payment...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
