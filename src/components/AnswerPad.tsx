'use client';

import React, { useState } from 'react';
import { Question, AnswerOption, ColorTheme } from '@/lib/types';
import { ShapeIcon } from './ShapeIcon';
import { Check, Send, CheckCircle2 } from 'lucide-react';
import { sounds } from '@/lib/soundEngine';

interface AnswerPadProps {
  question: Question;
  hasAnswered: boolean;
  onSubmit: (selectedOptionIds: string[]) => void;
}

export const AnswerPad: React.FC<AnswerPadProps> = ({
  question,
  hasAnswered,
  onSubmit,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isMultiple = question.type === 'multiple';

  const getColorClasses = (color: ColorTheme) => {
    switch (color) {
      case 'red':
        return 'bg-rush-red hover:bg-[#eb294a] shadow-[#a9122a] border-red-400/30';
      case 'blue':
        return 'bg-rush-blue hover:bg-[#1a76e6] shadow-[#0c4fa3] border-blue-400/30';
      case 'yellow':
        return 'bg-rush-yellow hover:bg-[#ffb424] shadow-[#c77e00] border-amber-300/30';
      case 'green':
        return 'bg-rush-green hover:bg-[#2f9e10] shadow-[#1b6607] border-emerald-400/30';
      default:
        return 'bg-slate-700 shadow-slate-900 border-white/20';
    }
  };

  const handleSelect = (optionId: string) => {
    if (hasAnswered) return;
    sounds.playPop();

    if (isMultiple) {
      setSelectedIds((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedIds([optionId]);
      onSubmit([optionId]);
    }
  };

  const handleSubmitMultiple = () => {
    if (hasAnswered || selectedIds.length === 0) return;
    sounds.playPop();
    onSubmit(selectedIds);
  };

  if (hasAnswered) {
    return (
      <div className="w-full max-w-lg mx-auto py-12 px-6 glass-card rounded-3xl text-center border border-white/20 shadow-2xl animate-fade-in">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
        </div>
        <h3 className="text-2xl font-black text-white mb-2">Answer Locked In!</h3>
        <p className="text-white/70 text-sm">
          Keep your eyes on the big screen! Waiting for the timer to expire...
        </p>
        <div className="mt-6 flex justify-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
          <span className="w-3 h-3 rounded-full bg-rush-blue animate-pulse delay-75" />
          <span className="w-3 h-3 rounded-full bg-rush-red animate-pulse delay-150" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {isMultiple && (
        <div className="mb-4 bg-rush-purple/30 border border-rush-purple-light/50 px-4 py-2 rounded-2xl text-center">
          <span className="text-amber-300 font-black text-sm uppercase tracking-wider">
            ✨ Multiple Choice Question
          </span>
          <p className="text-xs text-white/80 mt-0.5">
            Select ALL that apply, then tap the Submit button below!
          </p>
        </div>
      )}

      {/* Grid of answer options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full px-2">
        {question.options.map((opt) => {
          const isSelected = selectedIds.includes(opt.id);
          const colorClass = getColorClasses(opt.color);

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`relative min-h-[100px] sm:min-h-[140px] p-5 rounded-2xl sm:rounded-3xl flex items-center text-left text-white transition-all transform active:scale-98 shadow-[0_6px_0_rgba(0,0,0,0.4)] border ${colorClass} ${
                isSelected ? 'ring-4 ring-white ring-offset-2 ring-offset-rush-dark scale-[1.02]' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center mr-4 shrink-0">
                <ShapeIcon shape={opt.shape} size={28} className="text-white drop-shadow" />
              </div>

              <div className="flex-1 pr-6">
                <span className="text-lg sm:text-xl font-black leading-tight drop-shadow-sm line-clamp-2">
                  {opt.text}
                </span>
              </div>

              {/* Selection Checkbox for multi-choice */}
              {isMultiple && (
                <div
                  className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition ${
                    isSelected ? 'bg-white border-white' : 'border-white/50 bg-black/20'
                  }`}
                >
                  {isSelected && <Check className="w-5 h-5 text-rush-dark stroke-[3]" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Multi-choice Submit Button */}
      {isMultiple && (
        <button
          onClick={handleSubmitMultiple}
          disabled={selectedIds.length === 0}
          className={`mt-6 w-full max-w-sm py-4 rounded-2xl font-black text-lg uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl transition-all ${
            selectedIds.length > 0
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-emerald-500/30 hover:scale-105 active:scale-95'
              : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
          }`}
        >
          <Send className="w-5 h-5" />
          <span>Submit Answers ({selectedIds.length})</span>
        </button>
      )}
    </div>
  );
};
