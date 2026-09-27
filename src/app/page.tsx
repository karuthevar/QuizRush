'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  Play,
  QrCode,
  CheckCircle2,
  Users,
  Trophy,
  ArrowRight,
  PlusCircle,
  Sparkles,
  CreditCard,
  Gift,
  ShieldCheck,
} from 'lucide-react';
import { SAMPLE_QUIZZES } from '@/lib/sampleQuizzes';
import { createGameSession } from '@/lib/gameEngine';
import { signInWithGoogle, subscribeToAuth } from '@/lib/firebase';
import { checkCanHost, consumeHostCredit } from '@/lib/billingEngine';
import { PaywallModal } from '@/components/PaywallModal';

export default function HomePage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [user, setUser] = useState<any>(null);
  const [hostingQuizId, setHostingQuizId] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  React.useEffect(() => {
    const unsub = subscribeToAuth((u) => setUser(u));
    return () => unsub();
  }, []);

  const handleJoinWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().toUpperCase();
    if (cleanPin.length === 4) {
      router.push(`/join?pin=${cleanPin}`);
    }
  };

  const handleQuickHost = async (quiz: any) => {
    const uid = user?.uid || 'guest-host';
    const canHostStatus = await checkCanHost(uid);

    if (!canHostStatus.canHost) {
      setPaywallOpen(true);
      return;
    }

    try {
      setHostingQuizId(quiz.id);
      let hostId = user?.uid;
      if (!hostId) {
        const u = await signInWithGoogle();
        hostId = u?.uid || 'guest-host';
      }

      await consumeHostCredit(hostId);
      const newPin = await createGameSession(quiz, hostId);
      router.push(`/host/lobby/${newPin}`);
    } catch (err) {
      console.error(err);
    } finally {
      setHostingQuizId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center animate-fade-in">
      {/* Hero Section */}
      <section className="w-full max-w-6xl mx-auto px-4 pt-12 pb-16 text-center flex flex-col items-center">
        {/* Kahoot-like high energy badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-rush-purple/40 border border-rush-purple-light/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time Multiplayer Game Arena</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white max-w-4xl leading-tight sm:leading-none mb-6">
          Energize Your Classroom, Team & Friends with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rush-yellow to-rush-red">
            QuizRush!
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-white/70 max-w-2xl mb-10 leading-relaxed">
          The ultimate Kahoot alternative for live interactive quizzes. Host with Google, share a
          4-character PIN or QR code, and let players answer fast on their phones!
        </p>

        {/* Quick Join Card (High Contrast Kahoot Style) */}
        <div className="w-full max-w-md glass-card p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl mb-12">
          <form onSubmit={handleJoinWithPin} className="flex flex-col space-y-4">
            <label className="text-xs uppercase tracking-widest font-black text-white/70 text-left">
              Have a Game PIN?
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                placeholder="4-CHAR PIN"
                className="w-full text-center text-3xl font-black tracking-widest uppercase bg-rush-navy/80 border-2 border-white/20 focus:border-amber-400 focus:outline-none rounded-2xl py-4 text-amber-300 placeholder:text-white/20 transition shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={pin.trim().length !== 4}
              className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl transition-all ${
                pin.trim().length === 4
                  ? 'bg-gradient-to-r from-rush-green to-emerald-500 hover:brightness-110 text-white shadow-emerald-500/30 active:scale-95'
                  : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/10'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Enter Game</span>
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center space-x-2 text-xs text-white/60">
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Players don&apos;t need an account to play!</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/host/edit"
            className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rush-purple to-rush-red hover:brightness-110 text-white font-black text-base shadow-xl shadow-rush-purple/40 transition transform hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create a Quiz</span>
          </Link>
          <Link
            href="/host/dashboard"
            className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-base transition transform hover:scale-105"
          >
            <span>Host Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Pricing / Monetization Section */}
      <section className="w-full max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-wider mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Transparent Pay-Per-Quiz Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            1 Free Trial, Then Just $4.99 per Quiz
          </h2>
          <p className="text-white/60 text-sm mt-1 max-w-xl mx-auto">
            Zero recurring subscriptions. Never pay for months you don&apos;t use. Only pay when you host!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Trial Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col justify-between hover:border-emerald-400/50 transition">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/40">
                  Starter Pass
                </span>
                <Gift className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-4xl font-black text-white mb-1">$0</div>
              <div className="text-xs font-bold text-white/50 mb-6">1 Full Match Included Free</div>

              <ul className="space-y-3 text-xs sm:text-sm text-white/80">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to 100 concurrent players</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Live QR Code & 4-char PIN lobby</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Single & multi-choice questions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sound synthesizer & confetti podium</span>
                </li>
              </ul>
            </div>

            <Link
              href="/host/dashboard"
              className="mt-8 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider text-center transition"
            >
              Start Free Trial Match
            </Link>
          </div>

          {/* Pay As You Go Card */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border-2 border-amber-400 shadow-2xl shadow-amber-400/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-rush-red to-rush-yellow text-white text-[10px] font-black uppercase tracking-widest py-1 px-4 rounded-bl-xl shadow">
              Most Popular
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-400/40">
                  Single Match Pass
                </span>
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-4xl font-black text-amber-300 mb-1">
                $4.99 <span className="text-sm font-bold text-white/60">/ quiz</span>
              </div>
              <div className="text-xs font-bold text-white/50 mb-6">Pay-as-you-go &bull; No subscription</div>

              <ul className="space-y-3 text-xs sm:text-sm text-white/90">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Everything in Free Trial</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited custom quizzes & questions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Session analytics & CSV export</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Email scorecard reports to players</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setPaywallOpen(true)}
              className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-rush-green to-emerald-500 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition transform hover:scale-105 active:scale-95"
            >
              Get Match Pass ($4.99)
            </button>
          </div>
        </div>
      </section>

      {/* Featured Ready-to-Play Quizzes */}
      <section className="w-full max-w-6xl mx-auto px-4 py-12 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Ready-to-Play Quizzes (10 Included)</h2>
            <p className="text-white/60 text-sm">Launch a live game right now with pre-built trivia</p>
          </div>
          <Link
            href="/host/edit"
            className="text-xs font-bold uppercase tracking-wider text-amber-300 hover:text-white flex items-center space-x-1"
          >
            <span>Create Custom</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SAMPLE_QUIZZES.slice(0, 4).map((quiz) => (
            <div
              key={quiz.id}
              className="glass-card rounded-3xl overflow-hidden border border-white/15 flex flex-col justify-between hover:border-white/30 transition group"
            >
              <div className="h-44 relative overflow-hidden bg-rush-navy">
                <img
                  src={quiz.coverImage}
                  alt={quiz.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-rush-dark via-transparent to-transparent" />
                <div className="absolute top-4 right-4 bg-rush-dark/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-amber-300 border border-white/10">
                  {quiz.questions.length} Questions
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-black text-white mb-2">{quiz.title}</h3>
                  <p className="text-white/70 text-sm line-clamp-2 mb-4">{quiz.description}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-xs font-semibold text-white/50">
                    By {quiz.creatorName}
                  </span>
                  <button
                    onClick={() => handleQuickHost(quiz)}
                    disabled={hostingQuizId === quiz.id}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rush-red to-rush-yellow text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rush-red/30 hover:brightness-110 active:scale-95 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{hostingQuizId === quiz.id ? 'Starting...' : 'Host Live Game'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        userId={user?.uid || 'guest-host'}
        userEmail={user?.email}
        onUnlockSuccess={() => setPaywallOpen(false)}
      />
    </div>
  );
}
