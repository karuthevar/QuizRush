'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player } from '@/lib/types';
import { Crown, Trophy, RotateCcw, Home } from 'lucide-react';
import { sounds } from '@/lib/soundEngine';
import Link from 'next/link';

interface PodiumProps {
  players: Player[];
  onPlayAgain?: () => void;
}

export const Podium: React.FC<PodiumProps> = ({ players, onPlayAgain }) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];
  const runnersUp = sorted.slice(3, 10);

  useEffect(() => {
    sounds.playPodium();

    // Trigger multi-stage confetti burst
    const end = Date.now() + 3.5 * 1000;
    const colors = ['#E21B3C', '#1368CE', '#FFA602', '#26890C', '#FFFFFF'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center py-6 px-4 animate-fade-in">
      {/* Trophy Header */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center mb-3 shadow-lg shadow-amber-400/20">
          <Trophy className="w-9 h-9 text-amber-300" />
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 drop-shadow-md">
          QuizRush Champions!
        </h2>
        <p className="text-white/70 text-sm mt-1">Huge congratulations to the top trivia masters</p>
      </div>

      {/* The 3 Podium Pedestals */}
      <div className="w-full grid grid-cols-3 gap-2 sm:gap-6 items-end justify-center mb-12 max-w-2xl px-2">
        {/* 2nd Place (Silver) */}
        <div className="flex flex-col items-center">
          {second ? (
            <>
              <div className="relative mb-2 flex flex-col items-center">
                <img
                  src={second.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${second.nickname}`}
                  alt={second.nickname}
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 border-slate-300 shadow-xl bg-slate-800"
                />
                <span className="text-xs font-black text-slate-300 mt-1 truncate max-w-[90px]">
                  {second.nickname}
                </span>
                <span className="text-xs font-bold text-amber-300">{second.score.toLocaleString()} pts</span>
              </div>
              <div className="w-full h-36 sm:h-48 rounded-t-3xl bg-gradient-to-t from-slate-700 via-slate-600 to-slate-400 flex flex-col items-center justify-start pt-4 shadow-xl border-t-2 border-slate-200">
                <span className="text-3xl sm:text-5xl font-black text-white drop-shadow">2</span>
                <span className="text-xs uppercase font-extrabold tracking-widest text-slate-200 mt-1">Silver</span>
              </div>
            </>
          ) : (
            <div className="w-full h-36 sm:h-48 rounded-t-3xl bg-white/5 border-t border-white/10 flex items-center justify-center text-white/30 text-xs">
              Empty
            </div>
          )}
        </div>

        {/* 1st Place (Gold) */}
        <div className="flex flex-col items-center">
          {first ? (
            <>
              <div className="relative mb-2 flex flex-col items-center">
                <Crown className="w-8 h-8 text-amber-300 animate-bounce -mb-1 drop-shadow-lg" />
                <img
                  src={first.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${first.nickname}`}
                  alt={first.nickname}
                  className="w-18 h-18 sm:w-24 sm:h-24 rounded-full border-4 border-amber-400 shadow-2xl bg-amber-950 ring-4 ring-amber-400/40"
                />
                <span className="text-sm sm:text-base font-black text-amber-300 mt-1 truncate max-w-[110px]">
                  {first.nickname}
                </span>
                <span className="text-xs sm:text-sm font-black text-white">{first.score.toLocaleString()} pts</span>
              </div>
              <div className="w-full h-48 sm:h-64 rounded-t-3xl bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-300 flex flex-col items-center justify-start pt-4 shadow-2xl border-t-4 border-white">
                <span className="text-4xl sm:text-6xl font-black text-white drop-shadow-lg">1</span>
                <span className="text-xs uppercase font-extrabold tracking-widest text-amber-950 mt-1">Gold</span>
              </div>
            </>
          ) : (
            <div className="w-full h-48 sm:h-64 rounded-t-3xl bg-white/5 border-t border-white/10 flex items-center justify-center text-white/30 text-xs">
              Empty
            </div>
          )}
        </div>

        {/* 3rd Place (Bronze) */}
        <div className="flex flex-col items-center">
          {third ? (
            <>
              <div className="relative mb-2 flex flex-col items-center">
                <img
                  src={third.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${third.nickname}`}
                  alt={third.nickname}
                  className="w-12 h-12 sm:w-18 sm:h-18 rounded-full border-4 border-amber-700 shadow-xl bg-amber-950"
                />
                <span className="text-xs font-black text-amber-200 mt-1 truncate max-w-[90px]">
                  {third.nickname}
                </span>
                <span className="text-xs font-bold text-amber-300">{third.score.toLocaleString()} pts</span>
              </div>
              <div className="w-full h-28 sm:h-36 rounded-t-3xl bg-gradient-to-t from-amber-900 via-amber-800 to-amber-600 flex flex-col items-center justify-start pt-4 shadow-xl border-t-2 border-amber-500">
                <span className="text-2xl sm:text-4xl font-black text-white drop-shadow">3</span>
                <span className="text-xs uppercase font-extrabold tracking-widest text-amber-200 mt-1">Bronze</span>
              </div>
            </>
          ) : (
            <div className="w-full h-28 sm:h-36 rounded-t-3xl bg-white/5 border-t border-white/10 flex items-center justify-center text-white/30 text-xs">
              Empty
            </div>
          )}
        </div>
      </div>

      {/* Runners Up List */}
      {runnersUp.length > 0 && (
        <div className="w-full max-w-xl glass-card rounded-2xl p-4 border border-white/10 mb-8">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-3 px-2">
            Top Contenders
          </h4>
          <div className="space-y-2">
            {runnersUp.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-black text-white/50 w-5">#{idx + 4}</span>
                  <img
                    src={p.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.nickname}`}
                    alt={p.nickname}
                    className="w-7 h-7 rounded-full bg-rush-dark"
                  />
                  <span className="text-sm font-bold text-white">{p.nickname}</span>
                </div>
                <span className="text-sm font-black text-amber-300">{p.score.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-4">
        {onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rush-blue to-cyan-500 hover:brightness-110 text-white font-black text-sm shadow-xl shadow-rush-blue/30 transition transform hover:scale-105"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
        )}
        <Link
          href="/host/dashboard"
          className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition transform hover:scale-105"
        >
          <Home className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
