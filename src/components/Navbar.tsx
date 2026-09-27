'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Play,
  PlusCircle,
  LogIn,
  LogOut,
  LayoutDashboard,
  Volume2,
  VolumeX,
  ShieldCheck,
} from 'lucide-react';
import { signInWithGoogle, signOutUser, subscribeToAuth } from '@/lib/firebase';
import { sounds } from '@/lib/soundEngine';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const loggedInUser = await signInWithGoogle();
      if (loggedInUser) {
        router.push('/host/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    setUser(null);
    router.push('/');
  };

  const toggleSound = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    sounds.setMuted(newMuted);
  };

  return (
    <nav className="w-full border-b border-white/10 bg-rush-dark/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-rush-red flex items-center justify-center shadow-lg shadow-rush-red/30 transform group-hover:scale-105 transition">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-white via-amber-200 to-rush-yellow bg-clip-text text-transparent">
            Quiz<span className="text-rush-red">Rush</span>
          </span>
        </Link>

        {/* Center / Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={toggleSound}
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            {muted ? <VolumeX className="w-5 h-5 text-rush-red" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          <Link
            href="/join"
            className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rush-blue/20 hover:bg-rush-blue/40 text-blue-300 border border-rush-blue/40 font-bold text-sm transition"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Join PIN</span>
          </Link>

          <Link
            href="/admin"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-sm transition"
            title="Admin & History Dashboard"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden md:inline">Admin & History</span>
          </Link>

          {user ? (
            <div className="flex items-center space-x-3">
              <Link
                href="/host/dashboard"
                className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden md:inline">Dashboard</span>
              </Link>

              <Link
                href="/host/edit"
                className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-rush-purple to-rush-red hover:brightness-110 text-white font-bold text-sm shadow-md transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create</span>
              </Link>

              {/* User Avatar & Logout */}
              <div className="flex items-center space-x-2 pl-2 border-l border-white/10">
                <img
                  src={
                    user.photoURL ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${user.displayName || user.email || 'user'}`
                  }
                  alt={user.displayName || 'Organizer'}
                  className="w-8 h-8 rounded-full border border-amber-400/50"
                />
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rush-red to-rush-yellow text-white font-black text-sm shadow-lg shadow-rush-red/30 hover:brightness-110 active:scale-95 transition"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? '...' : 'Sign-In'}</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
