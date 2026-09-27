'use client';

import React, { useEffect, useState } from 'react';
import { sounds } from '@/lib/soundEngine';

interface CountdownTimerProps {
  totalSeconds: number;
  startTime: number;
  onExpire?: () => void;
  isPaused?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  totalSeconds,
  startTime,
  onExpire,
  isPaused = false,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);
      setSecondsLeft(remaining);

      if (remaining > 0 && remaining <= 5) {
        sounds.playUrgentTick();
      } else if (remaining > 5) {
        sounds.playTick();
      }

      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, totalSeconds, isPaused, onExpire]);

  const percentage = Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100));

  // Determine color based on time left
  let timerColor = 'text-emerald-400 stroke-emerald-400';
  let barBg = 'bg-emerald-500';
  if (percentage <= 25) {
    timerColor = 'text-rush-red stroke-rush-red animate-pulse';
    barBg = 'bg-rush-red';
  } else if (percentage <= 50) {
    timerColor = 'text-amber-400 stroke-amber-400';
    barBg = 'bg-amber-400';
  }

  return (
    <div className="flex flex-col items-center">
      {/* Circular Timer Display */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="40%"
            className="stroke-white/10"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="50%"
            cy="50%"
            r="40%"
            className={`transition-all duration-1000 ease-linear ${timerColor}`}
            strokeWidth="8"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (251.2 * percentage) / 100}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl sm:text-3xl font-black ${timerColor.split(' ')[0]}`}>
            {secondsLeft}
          </span>
        </div>
      </div>

      {/* Linear progress bar below */}
      <div className="w-full max-w-xs h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${barBg}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
