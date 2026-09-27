'use client';

import React from 'react';
import { Question, Player, ColorTheme } from '@/lib/types';
import { ShapeIcon } from './ShapeIcon';
import { Check, X } from 'lucide-react';

interface BarChartResultsProps {
  question: Question;
  players: Record<string, Player>;
}

export const BarChartResults: React.FC<BarChartResultsProps> = ({ question, players }) => {
  // Count how many players selected each option for this question
  const counts: Record<string, number> = {};
  question.options.forEach((opt) => {
    counts[opt.id] = 0;
  });

  const playerList = Object.values(players || {});
  let totalResponses = 0;

  playerList.forEach((player) => {
    const ans = player.answers?.[question.id];
    if (ans?.selectedOptionIds) {
      ans.selectedOptionIds.forEach((optId) => {
        if (counts[optId] !== undefined) {
          counts[optId] += 1;
        }
      });
      totalResponses += 1;
    }
  });

  const maxCount = Math.max(1, ...Object.values(counts));

  const getColorBg = (color: ColorTheme) => {
    switch (color) {
      case 'red':
        return 'bg-rush-red';
      case 'blue':
        return 'bg-rush-blue';
      case 'yellow':
        return 'bg-rush-yellow';
      case 'green':
        return 'bg-rush-green';
      default:
        return 'bg-purple-600';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto glass-card p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-white">Question Results</h3>
          <p className="text-sm text-white/60">
            {totalResponses} / {playerList.length} player{playerList.length === 1 ? '' : 's'} answered
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/30">
          <span>Correct answers revealed below</span>
        </div>
      </div>

      {/* Vertical Bars Container */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 h-64 sm:h-72 items-end pt-8">
        {question.options.map((opt) => {
          const count = counts[opt.id] || 0;
          const heightPercent = Math.max(12, Math.round((count / maxCount) * 100));
          const isCorrect = opt.isCorrect;
          const barBg = getColorBg(opt.color);

          return (
            <div key={opt.id} className="flex flex-col items-center h-full justify-end group">
              {/* Answer Count indicator */}
              <div className="mb-2 font-black text-lg sm:text-2xl text-white drop-shadow">
                {count}
              </div>

              {/* Bar element */}
              <div
                className={`w-full max-w-[80px] rounded-2xl relative transition-all duration-700 ease-out flex flex-col justify-between p-2 shadow-lg ${barBg} ${
                  isCorrect
                    ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-rush-dark shadow-emerald-500/40'
                    : 'opacity-70 group-hover:opacity-100'
                }`}
                style={{ height: `${heightPercent}%` }}
              >
                {/* Result badge at top of bar */}
                <div className="flex justify-center -mt-5">
                  {isCorrect ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-black/60 text-white/60 flex items-center justify-center">
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Option shape at bottom of bar */}
                <div className="flex justify-center pb-1">
                  <ShapeIcon shape={opt.shape} size={22} className="text-white drop-shadow" />
                </div>
              </div>

              {/* Option Text preview below */}
              <div className="mt-3 text-center w-full px-1">
                <span className={`text-xs sm:text-sm font-bold line-clamp-2 ${isCorrect ? 'text-emerald-300' : 'text-white/70'}`}>
                  {opt.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
