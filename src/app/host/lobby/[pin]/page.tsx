'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameSession, GameStatus, Player } from '@/lib/types';
import {
  subscribeToGame,
  updateGameSession,
  getSortedLeaderboard,
  createGameSession,
} from '@/lib/gameEngine';
import { QRCodeCard } from '@/components/QRCodeCard';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ShapeIcon } from '@/components/ShapeIcon';
import { BarChartResults } from '@/components/BarChartResults';
import { Podium } from '@/components/Podium';
import { sounds } from '@/lib/soundEngine';
import {
  Users,
  Play,
  ArrowRight,
  Flame,
  SkipForward,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';

export default function HostLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const pin = ((params?.pin as string) || '').toUpperCase();

  const [session, setSession] = useState<GameSession | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const unsub = subscribeToGame(pin, (updatedSession) => {
      setSession(updatedSession);
    });

    return () => unsub();
  }, [pin]);

  // Handle ambient lobby music on lobby status
  useEffect(() => {
    if (session?.status === 'lobby' && !muted) {
      sounds.startLobbyMusic();
    } else {
      sounds.stopLobbyMusic();
    }

    return () => {
      sounds.stopLobbyMusic();
    };
  }, [session?.status, muted]);

  const toggleSound = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    sounds.setMuted(nextMuted);
  };

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-white/80 font-bold text-lg">Initializing Host Arena for PIN {pin}...</p>
      </div>
    );
  }

  const currentQ = session.quiz.questions[session.currentQuestionIndex];
  const playersList = Object.values(session.players || {});
  const answeredCount = currentQ
    ? playersList.filter((p) => p.answers?.[currentQ.id]).length
    : 0;

  // Change Game State handler
  const transitionTo = async (
    newStatus: GameStatus,
    extraUpdates?: Partial<GameSession>
  ) => {
    await updateGameSession(pin, (prev) => ({
      ...prev,
      status: newStatus,
      ...extraUpdates,
    }));
  };

  const handleStartGame = async () => {
    sounds.stopLobbyMusic();
    sounds.playStartGame();

    await transitionTo('countdown', { currentQuestionIndex: 0 });

    // 3-second countdown before showing question
    setTimeout(async () => {
      await transitionTo('question', {
        questionStartTime: Date.now(),
        questionEndTime:
          Date.now() + (session.quiz.questions[0]?.timeLimit || 20) * 1000,
      });
    }, 3000);
  };

  const handleQuestionExpired = async () => {
    await transitionTo('result');
  };

  const handleShowLeaderboard = async () => {
    sounds.playPop();
    await transitionTo('leaderboard');
  };

  const handleNextQuestion = async () => {
    sounds.playPop();
    const nextIdx = session.currentQuestionIndex + 1;

    if (nextIdx < session.quiz.questions.length) {
      await transitionTo('countdown', { currentQuestionIndex: nextIdx });

      setTimeout(async () => {
        const nextQ = session.quiz.questions[nextIdx];
        await transitionTo('question', {
          currentQuestionIndex: nextIdx,
          questionStartTime: Date.now(),
          questionEndTime: Date.now() + (nextQ.timeLimit || 20) * 1000,
        });
      }, 3000);
    } else {
      // Reached end of quiz! Go to Podium!
      await transitionTo('podium');
    }
  };

  const handlePlayAgain = async () => {
    try {
      const newPin = await createGameSession(session.quiz, session.hostId);
      router.push(`/host/lobby/${newPin}`);
    } catch (e) {
      console.error(e);
    }
  };

  // ==========================================
  // 1. LOBBY VIEW
  // ==========================================
  if (session.status === 'lobby') {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col justify-between animate-fade-in">
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-amber-300">
              Hosting Quiz
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{session.quiz.title}</h1>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSound}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition"
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="w-5 h-5 text-rush-red" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
            </button>

            <button
              onClick={handleStartGame}
              className="flex items-center space-x-2 px-6 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rush-green to-emerald-500 hover:brightness-110 text-white font-black text-base uppercase tracking-wider shadow-xl shadow-emerald-500/30 transition transform hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Game ({playersList.length})</span>
            </button>
          </div>
        </div>

        {/* Center Arena: QR Code & Connected Players */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 items-center">
          {/* QR Code and Game PIN Card */}
          <div className="lg:col-span-5 flex justify-center">
            <QRCodeCard pin={pin} />
          </div>

          {/* Connected Players Roster */}
          <div className="lg:col-span-7 glass-card p-6 sm:p-8 rounded-3xl border border-white/15 min-h-[380px] flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-black text-white">Players Joined Arena</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black">
                  {playersList.length} Connected
                </span>
              </div>

              {playersList.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Users className="w-8 h-8 text-white/30" />
                  </div>
                  <h4 className="text-lg font-black text-white mb-1">Waiting for Players...</h4>
                  <p className="text-white/60 text-xs max-w-sm mx-auto">
                    Quiz takers can scan the QR code with their mobile phone or enter PIN{' '}
                    <span className="text-amber-300 font-black">{pin}</span> at{' '}
                    <span className="text-cyan-400 font-bold">/join</span>
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 max-h-72 overflow-y-auto p-1">
                  {playersList.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-white font-bold text-sm shadow-md animate-bounce-slight"
                    >
                      <img
                        src={
                          player.avatar ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${player.nickname}`
                        }
                        alt={player.nickname}
                        className="w-7 h-7 rounded-full bg-rush-dark"
                      />
                      <span>{player.nickname}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 text-xs text-white/50 text-center">
              💡 Tip: You can test with 1 player by opening a new Incognito window or browser tab!
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. COUNTDOWN VIEW
  // ==========================================
  if (session.status === 'countdown') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <span className="text-xl sm:text-2xl font-black uppercase tracking-widest text-amber-300 mb-4 animate-bounce">
          Question {session.currentQuestionIndex + 1} of {session.quiz.questions.length}
        </span>
        <h2 className="text-4xl sm:text-6xl font-black text-white max-w-3xl drop-shadow-2xl">
          {currentQ?.title}
        </h2>
        <div className="text-7xl sm:text-9xl font-black text-amber-400 my-8 animate-pulse">
          3...
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. LIVE QUESTION VIEW
  // ==========================================
  if (session.status === 'question' && currentQ) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex flex-col justify-between">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-black uppercase tracking-wider text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/30">
              Q {session.currentQuestionIndex + 1} / {session.quiz.questions.length}
            </span>
            <span className="text-xs font-extrabold text-white/70">
              {currentQ.type === 'single' ? 'Single Choice (1 of 4)' : 'Multiple Choice ✨'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm font-black text-amber-300 bg-rush-navy/80 px-4 py-2 rounded-2xl border border-white/10">
              Answers: {answeredCount} / {playersList.length}
            </div>

            <button
              onClick={handleQuestionExpired}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition"
            >
              <SkipForward className="w-4 h-4" />
              <span>Show Results</span>
            </button>
          </div>
        </div>

        {/* Center: Question Title & Countdown */}
        <div className="my-6 flex flex-col items-center text-center">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white max-w-4xl drop-shadow mb-6 leading-tight">
            {currentQ.title}
          </h2>

          <CountdownTimer
            totalSeconds={currentQ.timeLimit || 20}
            startTime={session.questionStartTime || Date.now()}
            onExpire={handleQuestionExpired}
            isPaused={answeredCount >= playersList.length && playersList.length > 0}
          />
        </div>

        {/* Answer Choices Grid on Big Screen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-5xl mx-auto w-full pb-4">
          {currentQ.options.map((opt) => {
            let colorBg = 'bg-rush-red';
            if (opt.color === 'blue') colorBg = 'bg-rush-blue';
            if (opt.color === 'yellow') colorBg = 'bg-rush-yellow';
            if (opt.color === 'green') colorBg = 'bg-rush-green';

            return (
              <div
                key={opt.id}
                className={`p-6 rounded-3xl min-h-[90px] sm:min-h-[110px] flex items-center text-white shadow-xl ${colorBg}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-black/20 flex items-center justify-center mr-4 shrink-0">
                  <ShapeIcon shape={opt.shape} size={28} className="text-white drop-shadow" />
                </div>
                <span className="text-lg sm:text-2xl font-black drop-shadow-sm line-clamp-2">
                  {opt.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. RESULTS VIEW (BAR CHART)
  // ==========================================
  if (session.status === 'result' && currentQ) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex flex-col justify-between animate-fade-in">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <span className="text-xs font-black uppercase tracking-wider text-amber-300">
            Question {session.currentQuestionIndex + 1} Breakdown
          </span>

          <button
            onClick={handleShowLeaderboard}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rush-blue to-cyan-500 hover:brightness-110 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-rush-blue/30 transition transform hover:scale-105 active:scale-95"
          >
            <span>Next: Leaderboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <BarChartResults question={currentQ} players={session.players || {}} />

        <div className="py-4 text-center text-xs text-white/50">
          Correct answer(s) are highlighted with glowing green badges!
        </div>
      </div>
    );
  }

  // ==========================================
  // 5. LEADERBOARD VIEW
  // ==========================================
  if (session.status === 'leaderboard') {
    const sorted = getSortedLeaderboard(session.players);
    const topFive = sorted.slice(0, 5);
    const isLastQuestion = session.currentQuestionIndex >= session.quiz.questions.length - 1;

    return (
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full flex flex-col justify-between animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Leaderboard</h2>
              <p className="text-white/60 text-xs">Top scores after Question {session.currentQuestionIndex + 1}</p>
            </div>
          </div>

          <button
            onClick={handleNextQuestion}
            className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rush-green to-emerald-500 hover:brightness-110 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/30 transition transform hover:scale-105 active:scale-95"
          >
            <span>{isLastQuestion ? 'Reveal Champions Podium 🏆' : 'Next Question'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Top 5 Scoreboard List */}
        <div className="space-y-3 flex-1 mb-8">
          {topFive.map((player, idx) => (
            <div
              key={player.id}
              className={`p-4 sm:p-5 rounded-3xl border flex items-center justify-between transition-all transform hover:scale-[1.01] ${
                idx === 0
                  ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/30 shadow-xl'
                  : idx === 1
                  ? 'bg-slate-700/30 border-slate-300 shadow-md'
                  : idx === 2
                  ? 'bg-amber-900/30 border-amber-700 shadow-md'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center space-x-4">
                <span
                  className={`w-9 h-9 rounded-2xl font-black text-base flex items-center justify-center ${
                    idx === 0
                      ? 'bg-amber-400 text-rush-dark'
                      : idx === 1
                      ? 'bg-slate-300 text-rush-dark'
                      : idx === 2
                      ? 'bg-amber-700 text-white'
                      : 'bg-white/10 text-white/70'
                  }`}
                >
                  #{idx + 1}
                </span>

                <img
                  src={
                    player.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${player.nickname}`
                  }
                  alt={player.nickname}
                  className="w-12 h-12 rounded-full bg-rush-dark border-2 border-white/20"
                />

                <div>
                  <h4 className="text-lg font-black text-white">{player.nickname}</h4>
                  {player.streak > 1 && (
                    <div className="flex items-center space-x-1 text-xs font-black text-amber-400">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{player.streak} streak</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-2xl font-black text-amber-300">
                {player.score.toLocaleString()} pts
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // 6. PODIUM VIEW
  // ==========================================
  if (session.status === 'podium' || session.status === 'ended') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Podium players={playersList} onPlayAgain={handlePlayAgain} />
      </div>
    );
  }

  return null;
}
