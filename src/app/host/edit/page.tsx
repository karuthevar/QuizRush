'use client';

import React, { useEffect, useState } from 'react';
import { QuizEditorForm } from '@/components/QuizEditorForm';
import { subscribeToAuth } from '@/lib/firebase';

export default function CreateQuizPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = subscribeToAuth((u) => setUser(u));
    return () => unsub();
  }, []);

  return <QuizEditorForm user={user} />;
}
