'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, QrCode, Smartphone } from 'lucide-react';

interface QRCodeCardProps {
  pin: string;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({ pin }) => {
  const [copied, setCopied] = useState(false);

  const getJoinUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/join?pin=${pin}`;
    }
    return `https://quizrush.vercel.app/join?pin=${pin}`;
  };

  const joinUrl = getJoinUrl();

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center max-w-sm w-full mx-auto text-center transform transition hover:scale-[1.02]">
      {/* Header Badge */}
      <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-rush-yellow mb-3 bg-rush-yellow/10 px-3 py-1 rounded-full border border-rush-yellow/30">
        <Smartphone className="w-3.5 h-3.5" />
        <span>Scan or Enter Code</span>
      </div>

      {/* QR Code Container */}
      <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-amber-400 mb-4 group relative">
        <QRCodeSVG
          value={joinUrl}
          size={190}
          level="H"
          includeMargin={false}
        />
        <div className="absolute inset-0 bg-rush-navy/90 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white text-xs font-bold px-3">Point mobile camera here to jump straight in!</p>
        </div>
      </div>

      {/* Game PIN Display */}
      <div className="w-full bg-white/10 rounded-2xl p-3 border border-white/10 mb-3">
        <div className="text-xs uppercase tracking-wider text-white/60 font-semibold mb-1">
          Game PIN
        </div>
        <div className="text-4xl sm:text-5xl font-black tracking-widest text-amber-300 drop-shadow-md">
          {pin}
        </div>
      </div>

      {/* Copy link button */}
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs tracking-wider transition active:scale-95"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">Join Link Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-white/70" />
            <span>Copy Direct Invite Link</span>
          </>
        )}
      </button>
    </div>
  );
};
