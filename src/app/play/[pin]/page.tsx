'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { GameSession, Player } from '@/lib/types';
import { subscribeToGame, submitPlayerAnswer } from '@/lib/gameEngine';
import { AnswerPad } from '@/components/AnswerPad';
import { Podium } from '@/components/Podium';
import { sounds } from '@/lib/soundEngine';
import { Flame, Trophy, CheckCircle, XCircle, Sparkles, AlertCircle } from 'lucide-react';

export default function PlayerGamePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const pin = ((params?.pin as string) || '').toUpperCase();
  const playerIdParam = searchParams.get('playerId');

  const [session, setSession] = useState<GameSession | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [hasAnsweredCurrentQuestion, setHasAnsweredCurrentQuestion] = useState(false);
  const [soundPlayedForStatus, setSoundPlayedForStatus] = useState<string | null>(null);

  // Load player info
  useEffect(() => {
    let pid = playerIdParam;
    if (!pid && typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`quizrush_player_${pin}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          pid = parsed.id;
        } catch (e) {}
      }
    }

    if (!pid) {
      router.push(`/join?pin=${pin}`);
      return;
    }

    const unsub = subscribeToGame(pin, (updatedSession) => {
      setSession(updatedSession);
      if (updatedSession?.players && pid && updatedSession.players[pid]) {
        setCurrentPlayer(updatedSession.players[pid]);
      }
    });

    return () => unsub();
  }, [pin, playerIdParam, router]);

  // Handle question transitions & audio
  useEffect(() => {
    if (!session) return;

    const currentQ = session.quiz.questions[session.currentQuestionIndex];
    if (session.status === 'question') {
      const alreadyAnswered = Boolean(
        currentQ && currentPlayer?.answers?.[currentQ.id]
      );
      setHasAnsweredCurrentQuestion(alreadyAnswered);
    }

    if (session.status === 'result' && soundPlayedForStatus !== `result_${session.currentQuestionIndex}`) {
      setSoundPlayedForStatus(`result_${session.currentQuestionIndex}`);
      if (currentPlayer?.lastAnswerCorrect) {
        sounds.playCorrect();
      } else {
        sounds.playWrong();
      }
    }
  }, [session, currentPlayer, soundPlayedForStatus]);

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-white/80 font-bold text-lg">Connecting to Game PIN {pin}...</p>
      </div>
    );
  }

  const currentQ = session.quiz.questions[session.currentQuestionIndex];

  const handleAnswerSubmit = async (selectedOptionIds: string[]) => {
    if (!currentPlayer || !currentQ || hasAnsweredCurrentQuestion) return;
    setHasAnsweredCurrentQuestion(true);

    try {
      await submitPlayerAnswer(
        pin,
        currentPlayer.id,
        currentQ.id,
        selectedOptionIds,
        session.questionStartTime || Date.now(),
        currentQ.timeLimit
      );
    } catch (err) {
      console.error('Answer submission error:', err);
    }
  };

  // 1. LOBBY VIEW (WAITING FOR ORGANIZER TO START)
  if (session.status === 'lobby') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center">
          <div className="relative mb-6">
            <img
              src={
                currentPlayer?.avatar ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${currentPlayer?.nickname || 'player'}`
              }
              alt={currentPlayer?.nickname}
              className="w-24 h-24 rounded-full border-4 border-amber-400 shadow-2xl bg-rush-dark"
            />
            <span className="absolute bottom-0 right-0 p-1.5 bg-emerald-500 rounded-full border-2 border-rush-dark">
              <CheckCircle className="w-4 h-4 text-white" />
            </span>
          </div>

          <h2 className="text-3xl font-black text-white mb-1">
            You&apos;re In, {currentPlayer?.nickname}!
          </h2>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rush-yellow/10 text-amber-300 border border-rush-yellow/30 text-xs font-black uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PIN: {pin}</span>
          </div>

          <p className="text-white/70 text-sm leading-relaxed mb-6">
            Look up at the organizer&apos;s screen! The game will begin as soon as the host hits
            Start.
          </p>

          <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-bold text-white/80">Waiting for host to start...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. COUNTDOWN VIEW
  if (session.status === 'countdown') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-amber-300 mb-4 animate-bounce">
          Question {session.currentQuestionIndex + 1}
        </h3>
        <div className="text-7xl sm:text-9xl font-black text-white drop-shadow-2xl">
          Get Ready!
        </div>
        <p className="text-white/60 text-sm mt-4">Answer fast for maximum points!</p>
      </div>
    );
  }

  // 3. LIVE QUESTION VIEW
  if (session.status === 'question' && currentQ) {
    return (
      <div className="flex-1 flex flex-col items-center justify-between p-4 max-w-4xl mx-auto w-full">
        {/* Top Info Bar */}
        <div className="w-full flex items-center justify-between py-2 px-4 glass-panel rounded-2xl border border-white/10 mb-4">
          <span className="text-xs font-black uppercase tracking-wider text-amber-300">
            Q {session.currentQuestionIndex + 1} of {session.quiz.questions.length}
          </span>
          <div className="flex items-center space-x-3">
            {currentPlayer && (
              <span className="text-xs font-extrabold text-white">
                Score: {currentPlayer.score.toLocaleString()} pts
              </span>
            )}
            {currentPlayer && currentPlayer.streak > 1 && (
              <span className="flex items-center space-x-1 text-xs font-black text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{currentPlayer.streak} streak</span>
              </span>
            )}
          </div>
        </div>

        {/* Question Title */}
        <div className="w-full text-center py-4 mb-4">
          <h2 className="text-xl sm:text-3xl font-black text-white drop-shadow leading-snug">
            {currentQ.title}
          </h2>
        </div>

        {/* Interactive Answer Pad */}
        <AnswerPad
          question={currentQ}
          hasAnswered={hasAnsweredCurrentQuestion}
          onSubmit={handleAnswerSubmit}
        />
      </div>
    );
  }

  // 4. QUESTION RESULT VIEW
  if (session.status === 'result' && currentQ) {
    const isCorrect = currentPlayer?.lastAnswerCorrect;
    const pointsEarned = currentPlayer?.lastPointsEarned || 0;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div
          className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl flex flex-col items-center ${
            isCorrect
              ? 'bg-emerald-950/80 border-emerald-500/50 shadow-emerald-500/20'
              : 'bg-rose-950/80 border-rose-500/50 shadow-rose-500/20'
          }`}
        >
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4">
            {isCorrect ? (
              <CheckCircle className="w-20 h-20 text-emerald-400 animate-bounce" />
            ) : (
              <XCircle className="w-20 h-20 text-rose-400 animate-shake" />
            )}
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
            {isCorrect ? 'Awesome! Correct!' : 'Oops! Incorrect'}
          </h2>

          <div className="text-2xl font-black text-amber-300 mb-4">
            {isCorrect ? `+${pointsEarned.toLocaleString()} Points` : '+0 Points'}
          </div>

          {currentPlayer && currentPlayer.streak > 1 && (
            <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-sm font-black mb-4 animate-pulse">
              <Flame className="w-4 h-4 fill-current text-amber-400" />
              <span>Answer Streak: {currentPlayer.streak} in a row!</span>
            </div>
          )}

          <p className="text-white/60 text-xs mt-2">
            Watch the host screen for the leaderboard!
          </p>
        </div>
      </div>
    );
  }

  // 5. LEADERBOARD VIEW
  if (session.status === 'leaderboard') {
    const allPlayers = Object.values(session.players || {}).sort((a, b) => b.score - a.score);
    const myRank = allPlayers.findIndex((p) => p.id === currentPlayer?.id) + 1;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>

          <h2 className="text-2xl font-black text-white mb-1">Your Standings</h2>
          <div className="text-5xl font-black text-amber-300 my-3">
            {myRank > 0 ? `#${myRank}` : '-'}
          </div>
          <p className="text-white/70 text-sm mb-4">
            out of {allPlayers.length} players
          </p>

          <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold text-white/60">Total Score</span>
            <span className="text-lg font-black text-white">
              {currentPlayer?.score.toLocaleString()} pts
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 6. PODIUM VIEW
  if (session.status === 'podium' || session.status === 'ended') {
    const playersList = Object.values(session.players || {});
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Podium players={playersList} />
      </div>
    );
  }

  return null;
}
