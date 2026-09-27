'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  KeyRound,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { signInWithGoogle, subscribeToAuth } from '@/lib/firebase';
import {
  authenticateWithPasskey,
  authenticateWithGoogleEmail,
  verifyAdminSession,
} from '@/lib/adminAuth';
import { sounds } from '@/lib/soundEngine';

export default function SecretGatekeeperPage() {
  const router = useRouter();
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // If already authenticated as admin, jump straight to /admin
    if (verifyAdminSession()) {
      router.push('/admin');
    }

    const unsub = subscribeToAuth((u) => {
      setUser(u);
      if (u?.email && authenticateWithGoogleEmail(u.email)) {
        sounds.playCorrect();
        router.push('/admin');
      }
    });

    return () => unsub();
  }, [router]);

  const handlePasskeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passkey.trim()) {
      setError('Please provide the master passkey.');
      return;
    }

    const success = authenticateWithPasskey(passkey);
    if (success) {
      sounds.playCorrect();
      router.push('/admin');
    } else {
      sounds.playWrong();
      setError('Invalid passkey. Access denied.');
    }
  };

  const handleGoogleAdminLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser?.email) {
        const isAuth = authenticateWithGoogleEmail(loggedUser.email);
        if (isAuth) {
          sounds.playCorrect();
          router.push('/admin');
          return;
        } else {
          sounds.playWrong();
          setError(
            `Access Denied: Email "${loggedUser.email}" is not authorized as an administrator.`
          );
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Google Sign-In failed or was cancelled.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[80vh] animate-fade-in">
      <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-rush-red/10 rounded-full blur-2xl pointer-events-none" />

        {/* Security Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-rush-red/20 border border-rush-red/40 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rush-red/20 text-rush-red">
            <Lock className="w-7 h-7" />
          </div>
          <span className="inline-block text-[11px] font-black uppercase tracking-widest text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/10 mb-2">
            Restricted Gatekeeper
          </span>
          <h1 className="text-2xl font-black text-white">System Administrator Gate</h1>
          <p className="text-xs text-white/50 mt-1">
            This endpoint is private and not indexed by search engines.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rush-red/20 border border-rush-red/40 flex items-start space-x-2.5 text-red-200 text-xs font-bold animate-shake">
            <AlertCircle className="w-4 h-4 text-rush-red shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Method 1: Google OAuth with Admin Email */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white text-rush-dark hover:bg-white/90 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg transition active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In with Authorized Google Account'}</span>
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-rush-dark px-3 text-[10px] uppercase font-bold text-white/40 tracking-wider">
              or enter master passkey
            </span>
            <div className="border-t border-white/10 w-full" />
          </div>

          {/* Method 2: Master Admin Passkey */}
          <form onSubmit={handlePasskeySubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-extrabold text-white/70 mb-1.5">
                Admin Master Secret Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Enter administrator passkey..."
                  className="w-full text-sm font-bold bg-rush-navy/90 border border-white/20 focus:border-amber-400 focus:outline-none rounded-xl px-4 py-3 text-white placeholder:text-white/30 transition pl-10"
                />
                <KeyRound className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rush-purple to-rush-red hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rush-purple/30 flex items-center justify-center space-x-2 transition active:scale-95"
            >
              <span>Unlock Admin Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-center text-[10px] text-white/40 flex items-center justify-center space-x-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rush-yellow/60" />
          <span>Encrypted Admin Portal • Authorized Personnel Only</span>
        </div>
      </div>
    </div>
  );
}
