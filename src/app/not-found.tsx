import React from 'react';
import Link from 'next/link';
import { Home, Play, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[70vh] text-center animate-fade-in">
      <div className="max-w-md w-full glass-card p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-rush-red/10 border border-rush-red/30 flex items-center justify-center mb-6">
          <HelpCircle className="w-10 h-10 text-rush-red" />
        </div>

        <h1 className="text-6xl font-black bg-gradient-to-r from-rush-red via-rush-yellow to-amber-300 bg-clip-text text-transparent mb-2">
          404
        </h1>
        <h2 className="text-2xl font-black text-white mb-3">Page Not Found</h2>
        <p className="text-white/60 text-sm mb-8">
          The page you are looking for doesn't exist, was moved, or has been relocated.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>

          <Link
            href="/join"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-rush-purple to-rush-blue hover:brightness-110 text-white font-bold text-sm shadow-lg transition"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Join a Game</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
