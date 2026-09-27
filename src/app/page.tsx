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
} from 'lucide-react';
import { SAMPLE_QUIZZES } from '@/lib/sampleQuizzes';
import { createGameSession } from '@/lib/gameEngine';
import { signInWithGoogle, subscribeToAuth } from '@/lib/firebase';

export default function HomePage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [user, setUser] = useState<any>(null);
  const [hostingQuizId, setHostingQuizId] = useState<string | null>(null);

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
    try {
      setHostingQuizId(quiz.id);
      let hostId = user?.uid;
      if (!hostId) {
        const u = await signInWithGoogle();
        hostId = u?.uid || 'guest-host';
      }
      const newPin = await createGameSession(quiz, hostId);
      router.push(`/host/lobby/${newPin}`);
    } catch (err) {
      console.error(err);
    } finally {
      setHostingQuizId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center">
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

      {/* Feature Showcase Grid */}
      <section className="w-full max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-black text-center text-white mb-2">
          Everything You Love About Interactive Quizzes
        </h2>
        <p className="text-center text-white/60 text-sm mb-10">
          Engineered for low latency, big screens, and thrilling classroom competition
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col items-start hover:border-amber-400/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-rush-red/20 border border-rush-red/40 flex items-center justify-center text-rush-red mb-4">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Frictionless Joining</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Quiz takers never need to register or remember passwords. Simply scan the live QR code
              or type the 4-character code on their phone to join in 3 seconds.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col items-start hover:border-rush-blue/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-rush-blue/20 border border-rush-blue/40 flex items-center justify-center text-rush-blue mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Single & Multi-Choice</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Full flexibility for organizers! Create classic 1-of-4 rapid-fire questions or challenging
              multi-select questions where players must find all correct answers.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col items-start hover:border-amber-400/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-rush-yellow/20 border border-rush-yellow/40 flex items-center justify-center text-rush-yellow mb-4">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Podium & Streaks</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Kahoot-style speed bonuses, flame streaks, real-time leaderboard rank adjustments, and a
              triumphant 1st, 2nd, and 3rd place podium finale with confetti!
            </p>
          </div>
        </div>
      </section>

      {/* Featured Ready-to-Play Quizzes */}
      <section className="w-full max-w-6xl mx-auto px-4 py-12 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Ready-to-Play Quizzes</h2>
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
          {SAMPLE_QUIZZES.map((quiz) => (
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
    </div>
  );
}
