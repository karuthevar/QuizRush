'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QuizEditorForm } from '@/components/QuizEditorForm';
import { getQuizById } from '@/lib/gameEngine';
import { Quiz } from '@/lib/types';
import { subscribeToAuth } from '@/lib/firebase';

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAuth((u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!id) return;
    getQuizById(id)
      .then((q) => {
        if (!q) {
          router.push('/host/dashboard');
        } else {
          setQuiz(q);
        }
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-white/60 text-sm">Loading quiz...</p>
      </div>
    );
  }

  if (!quiz) return null;

  return <QuizEditorForm initialQuiz={quiz} user={user} />;
}
