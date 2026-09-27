import { db, isFirebaseConfigured } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { GameSession, GameStatus, Player, PlayerAnswer, Quiz } from './types';
import { SAMPLE_QUIZZES } from './sampleQuizzes';

const PIN_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes 0, O, 1, I

export const generatePin = (): string => {
  let pin = '';
  for (let i = 0; i < 4; i++) {
    pin += PIN_CHARACTERS.charAt(Math.floor(Math.random() * PIN_CHARACTERS.length));
  }
  return pin;
};

// Local storage broadcast channel cache
const broadcastChannels = new Map<string, BroadcastChannel>();

const getBroadcastChannel = (pin: string): BroadcastChannel | null => {
  if (typeof window === 'undefined') return null;
  if (!('BroadcastChannel' in window)) return null;

  if (!broadcastChannels.has(pin)) {
    const ch = new BroadcastChannel(`quizrush_game_${pin}`);
    broadcastChannels.set(pin, ch);
  }
  return broadcastChannels.get(pin)!;
};

// ==========================================
// QUIZ MANAGEMENT
// ==========================================

export const getAllQuizzes = async (creatorId?: string): Promise<Quiz[]> => {
  let localQuizzes: Quiz[] = [];
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('quizrush_custom_quizzes');
    if (saved) {
      try {
        localQuizzes = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const q = creatorId
        ? query(collection(db, 'quizzes'), where('creatorId', '==', creatorId))
        : collection(db, 'quizzes');
      const snap = await getDocs(q);
      const remoteQuizzes: Quiz[] = [];
      snap.forEach((doc) => {
        remoteQuizzes.push(doc.data() as Quiz);
      });
      return [...SAMPLE_QUIZZES, ...localQuizzes, ...remoteQuizzes];
    } catch (err) {
      console.warn('Failed to fetch from Firestore, falling back to local:', err);
    }
  }

  return [...SAMPLE_QUIZZES, ...localQuizzes];
};

export const getQuizById = async (id: string): Promise<Quiz | null> => {
  const all = await getAllQuizzes();
  return all.find((q) => q.id === id) || null;
};

export const saveQuiz = async (quiz: Quiz): Promise<void> => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('quizrush_custom_quizzes');
    let localQuizzes: Quiz[] = saved ? JSON.parse(saved) : [];
    const idx = localQuizzes.findIndex((q) => q.id === quiz.id);
    if (idx >= 0) {
      localQuizzes[idx] = quiz;
    } else {
      localQuizzes.unshift(quiz);
    }
    localStorage.setItem('quizrush_custom_quizzes', JSON.stringify(localQuizzes));
  }

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'quizzes', quiz.id), quiz);
    } catch (err) {
      console.error('Error saving quiz to Firestore:', err);
    }
  }
};

export const deleteQuiz = async (id: string): Promise<void> => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('quizrush_custom_quizzes');
    if (saved) {
      let localQuizzes: Quiz[] = JSON.parse(saved);
      localQuizzes = localQuizzes.filter((q) => q.id !== id);
      localStorage.setItem('quizrush_custom_quizzes', JSON.stringify(localQuizzes));
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'quizzes', id));
    } catch (err) {
      console.error('Error deleting quiz from Firestore:', err);
    }
  }
};

// ==========================================
// GAME SESSION MANAGEMENT
// ==========================================

export const createGameSession = async (quiz: Quiz, hostId: string): Promise<string> => {
  const pin = generatePin();
  const session: GameSession = {
    pin,
    quizId: quiz.id,
    quiz,
    hostId,
    status: 'lobby',
    currentQuestionIndex: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    players: {},
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(`quizrush_session_${pin}`, JSON.stringify(session));
    const ch = getBroadcastChannel(pin);
    ch?.postMessage({ type: 'UPDATE', session });
  }

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'games', pin), session);
    } catch (err) {
      console.error('Failed to save game to Firestore:', err);
    }
  }

  return pin;
};

export const getGameSession = async (pin: string): Promise<GameSession | null> => {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'games', pin));
      if (snap.exists()) {
        return snap.data() as GameSession;
      }
    } catch (e) {
      console.warn(e);
    }
  }

  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(`quizrush_session_${pin}`);
    if (item) {
      return JSON.parse(item);
    }
  }
  return null;
};

export const subscribeToGame = (
  pin: string,
  callback: (session: GameSession | null) => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  let unsubFirestore: (() => void) | null = null;

  if (isFirebaseConfigured && db) {
    try {
      unsubFirestore = onSnapshot(doc(db, 'games', pin), (snap) => {
        if (snap.exists()) {
          callback(snap.data() as GameSession);
        } else {
          callback(null);
        }
      });
    } catch (err) {
      console.warn('Firestore onSnapshot error, falling back to local channel:', err);
    }
  }

  // Local BroadcastChannel & storage event fallback
  const syncFromLocalStorage = () => {
    const raw = localStorage.getItem(`quizrush_session_${pin}`);
    if (raw) {
      try {
        callback(JSON.parse(raw));
      } catch (err) {
        console.error(err);
      }
    }
  };

  syncFromLocalStorage();

  const ch = getBroadcastChannel(pin);
  const handleMessage = (e: MessageEvent) => {
    if (e.data?.session) {
      callback(e.data.session);
    }
  };

  if (ch) {
    ch.addEventListener('message', handleMessage);
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === `quizrush_session_${pin}`) {
      syncFromLocalStorage();
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    if (unsubFirestore) unsubFirestore();
    if (ch) ch.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
};

export const updateGameSession = async (
  pin: string,
  updater: (prev: GameSession) => GameSession
): Promise<void> => {
  let session = await getGameSession(pin);
  if (!session) return;

  session = updater(session);
  session.updatedAt = Date.now();

  if (typeof window !== 'undefined') {
    localStorage.setItem(`quizrush_session_${pin}`, JSON.stringify(session));
    const ch = getBroadcastChannel(pin);
    ch?.postMessage({ type: 'UPDATE', session });
  }

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'games', pin), session as any);
    } catch (err) {
      console.error('Error updating game in Firestore:', err);
    }
  }
};

export const joinGame = async (
  pin: string,
  player: Omit<Player, 'score' | 'streak' | 'answers' | 'connected' | 'joinedAt'>
): Promise<Player> => {
  const newPlayer: Player = {
    ...player,
    score: 0,
    streak: 0,
    answers: {},
    connected: true,
    joinedAt: Date.now(),
  };

  await updateGameSession(pin, (session) => {
    const players = { ...(session.players || {}) };
    players[newPlayer.id] = newPlayer;
    return { ...session, players };
  });

  return newPlayer;
};

export const submitPlayerAnswer = async (
  pin: string,
  playerId: string,
  questionId: string,
  selectedOptionIds: string[],
  startTimeMs: number,
  timeLimitSec: number
): Promise<{ isCorrect: boolean; pointsEarned: number }> => {
  const now = Date.now();
  const timeTakenSec = Math.max(0.1, (now - startTimeMs) / 1000);

  let isCorrect = false;
  let pointsEarned = 0;

  await updateGameSession(pin, (session) => {
    const question = session.quiz.questions.find((q) => q.id === questionId);
    if (!question) return session;

    const correctOptionIds = question.options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.id)
      .sort();

    const selectedSorted = [...selectedOptionIds].sort();

    // Check correctness
    if (question.type === 'single') {
      isCorrect =
        selectedSorted.length === 1 &&
        correctOptionIds.length === 1 &&
        selectedSorted[0] === correctOptionIds[0];
    } else {
      // Multiple choice: must pick all correct options and no incorrect ones
      isCorrect =
        selectedSorted.length === correctOptionIds.length &&
        selectedSorted.every((val, idx) => val === correctOptionIds[idx]);
    }

    const player = session.players?.[playerId];
    if (!player) return session;

    if (isCorrect) {
      // Kahoot speed bonus: max score if immediate, degrades to 50% at timeLimit
      const basePoints = question.points || 1000;
      const speedRatio = Math.max(0, 1 - timeTakenSec / (timeLimitSec * 1.5));
      const streakBonus = Math.min(500, (player.streak || 0) * 100);
      pointsEarned = Math.round(basePoints * (0.5 + 0.5 * speedRatio)) + streakBonus;
    } else {
      pointsEarned = 0;
    }

    const streak = isCorrect ? (player.streak || 0) + 1 : 0;
    const score = (player.score || 0) + pointsEarned;

    const answerRecord: PlayerAnswer = {
      questionId,
      selectedOptionIds,
      answeredAt: now,
      isCorrect,
      pointsEarned,
      timeToAnswerMs: Math.round(timeTakenSec * 1000),
    };

    const updatedPlayer: Player = {
      ...player,
      score,
      streak,
      lastAnswerCorrect: isCorrect,
      lastPointsEarned: pointsEarned,
      answers: {
        ...(player.answers || {}),
        [questionId]: answerRecord,
      },
    };

    return {
      ...session,
      players: {
        ...session.players,
        [playerId]: updatedPlayer,
      },
    };
  });

  return { isCorrect, pointsEarned };
};

export const getSortedLeaderboard = (players: Record<string, Player> = {}): Player[] => {
  return Object.values(players).sort((a, b) => b.score - a.score);
};
