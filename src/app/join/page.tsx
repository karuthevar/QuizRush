'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Play, Sparkles, AlertCircle, RefreshCw, UserCheck } from 'lucide-react';
import { getGameSession, joinGame } from '@/lib/gameEngine';
import { sounds } from '@/lib/soundEngine';

const AVATAR_SEEDS = ['CoolBot', 'PixelFox', 'CyberCat', 'CosmicOwl', 'SpeedyRacer', 'NeonNinja'];

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState(AVATAR_SEEDS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pinParam = searchParams.get('pin');
    if (pinParam) {
      setPin(pinParam.toUpperCase());
    }
  }, [searchParams]);

  const handleRandomizeAvatar = () => {
    sounds.playPop();
    const randomSeed = 'Avatar_' + Math.random().toString(36).substring(2, 8);
    setSelectedAvatarSeed(randomSeed);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPin = pin.trim().toUpperCase();
    const cleanNick = nickname.trim();

    if (cleanPin.length !== 4) {
      setError('Please enter a valid 4-character game PIN.');
      return;
    }

    if (!cleanNick) {
      setError('Please choose a nickname to enter the game.');
      return;
    }

    try {
      setLoading(true);
      const session = await getGameSession(cleanPin);

      if (!session) {
        setError(`No active game found for PIN "${cleanPin}". Check with your host!`);
        setLoading(false);
        return;
      }

      if (session.status === 'ended') {
        setError('This game has already finished. Ask the host for the new PIN.');
        setLoading(false);
        return;
      }

      const playerId = 'player_' + Math.random().toString(36).substring(2, 9);
      const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedAvatarSeed}`;

      await joinGame(cleanPin, {
        id: playerId,
        nickname: cleanNick,
        avatar: avatarUrl,
      });

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          `quizrush_player_${cleanPin}`,
          JSON.stringify({ id: playerId, nickname: cleanNick, avatar: avatarUrl })
        );
      }

      sounds.playCorrect();
      router.push(`/play/${cleanPin}?playerId=${playerId}`);
    } catch (err: any) {
      console.error(err);
      setError('Failed to join game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedAvatarSeed}`;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md glass-card p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rush-yellow/10 text-amber-300 border border-rush-yellow/30 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Player Check-In</span>
          </div>
          <h2 className="text-3xl font-black text-white">Join QuizRush</h2>
          <p className="text-white/60 text-xs mt-1">No password or signup required!</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rush-red/20 border border-rush-red/40 flex items-center space-x-3 text-red-200 text-xs font-bold animate-shake">
            <AlertCircle className="w-5 h-5 text-rush-red shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-5">
          {/* PIN Input */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-extrabold text-white/70 mb-1.5">
              1. Game PIN
            </label>
            <input
              type="text"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.toUpperCase())}
              placeholder="e.g. K9R2"
              className="w-full text-center text-3xl font-black tracking-widest uppercase bg-rush-navy/90 border-2 border-white/20 focus:border-amber-400 focus:outline-none rounded-2xl py-3 text-amber-300 placeholder:text-white/20 transition shadow-inner"
            />
          </div>

          {/* Nickname Input */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-extrabold text-white/70 mb-1.5">
              2. Your Nickname
            </label>
            <input
              type="text"
              maxLength={15}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Speedster Alex"
              className="w-full text-lg font-bold bg-rush-navy/90 border-2 border-white/20 focus:border-cyan-400 focus:outline-none rounded-2xl px-4 py-3 text-white placeholder:text-white/30 transition shadow-inner"
            />
          </div>

          {/* Avatar Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs uppercase tracking-wider font-extrabold text-white/70">
                3. Choose Your Avatar
              </label>
              <button
                type="button"
                onClick={handleRandomizeAvatar}
                className="text-xs text-amber-300 hover:text-white flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Randomize</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 p-2 bg-rush-navy/50 rounded-2xl border border-white/10">
              {AVATAR_SEEDS.map((seed) => {
                const isSelected = selectedAvatarSeed === seed;
                return (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setSelectedAvatarSeed(seed);
                    }}
                    className={`w-12 h-12 rounded-xl p-1 transition transform ${
                      isSelected
                        ? 'bg-amber-400 ring-2 ring-white scale-110 shadow-lg'
                        : 'hover:bg-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`}
                      alt={seed}
                      className="w-full h-full object-contain"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Join Button */}
          <button
            type="submit"
            disabled={loading || pin.trim().length !== 4 || !nickname.trim()}
            className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl transition-all ${
              pin.trim().length === 4 && nickname.trim() && !loading
                ? 'bg-gradient-to-r from-rush-green to-emerald-500 hover:brightness-110 text-white shadow-emerald-500/30 active:scale-95'
                : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/10'
            }`}
          >
            {loading ? (
              <span>Connecting to Arena...</span>
            ) : (
              <>
                <UserCheck className="w-5 h-5" />
                <span>Enter Arena!</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-white">Loading Arena...</div>}>
      <JoinContent />
    </Suspense>
  );
}
