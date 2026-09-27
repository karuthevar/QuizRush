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
  Gift,
  Coins,
} from 'lucide-react';
import { signInWithGoogle, signOutUser, subscribeToAuth } from '@/lib/firebase';
import { sounds } from '@/lib/soundEngine';
import { getBillingProfile } from '@/lib/billingEngine';
import { HostBillingProfile } from '@/lib/types';
import { PaywallModal } from './PaywallModal';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [billing, setBilling] = useState<HostBillingProfile | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const loadBilling = async (uid?: string) => {
    const profile = await getBillingProfile(uid || user?.uid || 'guest-host');
    setBilling(profile);
  };

  useEffect(() => {
    loadBilling(user?.uid);
    const handleBillingChange = () => loadBilling(user?.uid);
    window.addEventListener('quizrush_billing_change', handleBillingChange);
    return () => window.removeEventListener('quizrush_billing_change', handleBillingChange);
  }, [user]);

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

  const freeTrialsRemaining = billing ? Math.max(0, billing.freeTrialsTotal - billing.freeTrialsUsed) : 1;
  const paidCredits = billing?.paidCredits || 0;

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
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={toggleSound}
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            {muted ? <VolumeX className="w-5 h-5 text-rush-red" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          {/* Pricing Pass / Credit Badge */}
          <button
            onClick={() => setPaywallOpen(true)}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black transition"
            title="Click to view passes & pricing"
          >
            {freeTrialsRemaining > 0 ? (
              <>
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span>1 Free Pass</span>
              </>
            ) : paidCredits > 0 ? (
              <>
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                <span>{paidCredits} Pass{paidCredits === 1 ? '' : 'es'}</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-rush-red fill-current" />
                <span>Get Pass ($4.99)</span>
              </>
            )}
          </button>

          <Link
            href="/join"
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rush-blue/20 hover:bg-rush-blue/40 text-blue-300 border border-rush-blue/40 font-bold text-xs transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Join PIN</span>
          </Link>

          <Link
            href="/admin"
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition"
            title="Admin & History Dashboard"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden md:inline">Admin</span>
          </Link>

          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                href="/host/dashboard"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden md:inline">Dashboard</span>
              </Link>

              <Link
                href="/host/edit"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rush-purple to-rush-red hover:brightness-110 text-white font-bold text-xs shadow-md transition"
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
                  className="w-7 h-7 rounded-full border border-amber-400/50"
                />
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rush-red to-rush-yellow text-white font-black text-xs shadow-lg shadow-rush-red/30 hover:brightness-110 active:scale-95 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{loading ? '...' : 'Sign-In'}</span>
            </button>
          )}
        </div>
      </div>

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        userId={user?.uid || 'guest-host'}
        userEmail={user?.email}
        onUnlockSuccess={() => setPaywallOpen(false)}
      />
    </nav>
  );
};
