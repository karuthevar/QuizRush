'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  Play,
  Edit,
  Trash2,
  Sparkles,
  BookOpen,
  Users,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { getAllQuizzes, deleteQuiz, createGameSession } from '@/lib/gameEngine';
import { Quiz } from '@/lib/types';
import { subscribeToAuth, signInWithGoogle } from '@/lib/firebase';

export default function HostDashboardPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hostingId, setHostingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const list = await getAllQuizzes(user?.uid);
      setQuizzes(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [user]);

  const handleStartHosting = async (quiz: Quiz) => {
    try {
      setHostingId(quiz.id);
      let hostId = user?.uid;
      if (!hostId) {
        const loggedInUser = await signInWithGoogle();
        hostId = loggedInUser?.uid || 'guest-host';
      }
      const pin = await createGameSession(quiz, hostId);
      router.push(`/host/lobby/${pin}`);
    } catch (err) {
      console.error('Failed to create game session:', err);
    } finally {
      setHostingId(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this quiz?')) {
      await deleteQuiz(id);
      loadQuizzes();
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-white/10 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rush-purple/40 text-purple-200 border border-rush-purple-light/40 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Host Command Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Quiz Management</h1>
          <p className="text-white/60 text-sm mt-1">
            Organize questions, launch live multiplayer rooms, and share 4-character PINs
          </p>
        </div>

        <Link
          href="/host/edit"
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-rush-purple to-rush-red hover:brightness-110 text-white font-black text-sm shadow-xl shadow-rush-purple/30 transition transform hover:scale-105 active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Create New Quiz</span>
        </Link>
      </div>

      {/* Stats Quick Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rush-red/20 border border-rush-red/40 flex items-center justify-center text-rush-red">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{quizzes.length}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-white/50">Available Quizzes</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rush-blue/20 border border-rush-blue/40 flex items-center justify-center text-rush-blue">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              {quizzes.reduce((acc, q) => acc + q.questions.length, 0)}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-white/50">Total Questions</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">Multiplayer</div>
            <div className="text-xs font-bold uppercase tracking-wider text-white/50">Zero-Login Player PINs</div>
          </div>
        </div>
      </div>

      {/* Quiz Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-white/60 text-sm font-semibold">Loading quizzes...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="py-20 glass-card rounded-3xl border border-white/10 text-center max-w-lg mx-auto p-8">
          <Layers className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-black text-white mb-2">No Quizzes Created Yet</h3>
          <p className="text-white/60 text-sm mb-6">
            Get started by building your first interactive quiz with single or multiple choice questions!
          </p>
          <Link
            href="/host/edit"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rush-purple to-rush-red text-white font-bold text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Quiz</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const isOfficial = quiz.id.startsWith('quiz-tech') || quiz.id.startsWith('quiz-world');

            return (
              <div
                key={quiz.id}
                className="glass-card rounded-3xl overflow-hidden border border-white/15 flex flex-col justify-between hover:border-white/30 transition group hover:shadow-2xl hover:shadow-rush-purple/20"
              >
                {/* Cover Banner */}
                <div className="h-40 relative bg-rush-navy overflow-hidden">
                  <img
                    src={
                      quiz.coverImage ||
                      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                    }
                    alt={quiz.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-75"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-rush-dark via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 bg-rush-dark/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-black text-amber-300 border border-white/10">
                    {quiz.questions.length} Questions
                  </div>
                  {isOfficial && (
                    <div className="absolute top-3 left-3 bg-rush-blue/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white border border-white/10">
                      Official
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white mb-2 line-clamp-1 group-hover:text-amber-300 transition">
                      {quiz.title}
                    </h3>
                    <p className="text-white/60 text-xs line-clamp-2 leading-relaxed mb-4">
                      {quiz.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Link
                        href={`/host/edit/${quiz.id}`}
                        className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition"
                        title="Edit Quiz"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      {!isOfficial && (
                        <button
                          onClick={(e) => handleDelete(quiz.id, e)}
                          className="p-2 rounded-xl text-white/60 hover:text-rush-red hover:bg-rush-red/10 transition"
                          title="Delete Quiz"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleStartHosting(quiz)}
                      disabled={hostingId === quiz.id}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rush-red to-rush-yellow text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rush-red/30 hover:brightness-110 active:scale-95 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{hostingId === quiz.id ? 'Starting...' : 'Host Live'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
