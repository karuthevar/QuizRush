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
  orderBy,
} from 'firebase/firestore';
import { GameSession, GameStatus, Player, PlayerAnswer, Quiz, GameHistory, QuestionStat } from './types';
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

    // Sync to server API for other devices and incognito tabs
    fetch(`/api/game/${pin}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session }),
    }).catch(() => {});
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
  const cleanPin = pin.trim().toUpperCase();

  // 1. Try Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'games', cleanPin));
      if (snap.exists()) {
        return snap.data() as GameSession;
      }
    } catch (e) {
      console.warn('Firestore getGameSession error:', e);
    }
  }

  // 2. Try Local Storage
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(`quizrush_session_${cleanPin}`);
    if (item) {
      try {
        return JSON.parse(item);
      } catch (e) {}
    }

    // 3. Try Server API fallback for cross-device joining
    try {
      const res = await fetch(`/api/game/${cleanPin}`);
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          localStorage.setItem(`quizrush_session_${cleanPin}`, JSON.stringify(data.session));
          return data.session;
        }
      }
    } catch (e) {}
  }

  return null;
};

export const subscribeToGame = (
  pin: string,
  callback: (session: GameSession | null) => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const cleanPin = pin.trim().toUpperCase();
  let unsubFirestore: (() => void) | null = null;
  let pollInterval: any = null;

  if (isFirebaseConfigured && db) {
    try {
      unsubFirestore = onSnapshot(doc(db, 'games', cleanPin), (snap) => {
        if (snap.exists()) {
          callback(snap.data() as GameSession);
        } else {
          callback(null);
        }
      });
    } catch (err) {
      console.warn('Firestore onSnapshot error, falling back to local/polling:', err);
    }
  }

  // Local BroadcastChannel & storage event fallback
  const syncFromLocalStorage = () => {
    const raw = localStorage.getItem(`quizrush_session_${cleanPin}`);
    if (raw) {
      try {
        callback(JSON.parse(raw));
      } catch (err) {
        console.error(err);
      }
    }
  };

  syncFromLocalStorage();

  const ch = getBroadcastChannel(cleanPin);
  const handleMessage = (e: MessageEvent) => {
    if (e.data?.session) {
      callback(e.data.session);
    }
  };

  if (ch) {
    ch.addEventListener('message', handleMessage);
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === `quizrush_session_${cleanPin}`) {
      syncFromLocalStorage();
    }
  };
  window.addEventListener('storage', handleStorage);

  // Cross-device server polling fallback to sync players across devices
  pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/game/${cleanPin}`);
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          callback(data.session);
        }
      }
    } catch (err) {}
  }, 1200);

  return () => {
    if (unsubFirestore) unsubFirestore();
    if (ch) ch.removeEventListener('message', handleMessage);
    if (pollInterval) clearInterval(pollInterval);
    window.removeEventListener('storage', handleStorage);
  };
};

export const updateGameSession = async (
  pin: string,
  updater: (prev: GameSession) => GameSession
): Promise<void> => {
  const cleanPin = pin.trim().toUpperCase();
  let session = await getGameSession(cleanPin);
  if (!session) return;

  session = updater(session);
  session.updatedAt = Date.now();

  // If game reaches podium or ended, automatically log to history
  if (session.status === 'podium' || session.status === 'ended') {
    recordGameHistory(session).catch(console.error);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(`quizrush_session_${cleanPin}`, JSON.stringify(session));
    const ch = getBroadcastChannel(cleanPin);
    ch?.postMessage({ type: 'UPDATE', session });

    // Sync to server API for other devices and incognito tabs
    fetch(`/api/game/${cleanPin}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session }),
    }).catch(() => {});
  }

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'games', cleanPin), session as any);
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

// ==========================================
// GAME HISTORY & ADMIN LOGGING
// ==========================================

const SEED_SAMPLE_HISTORY: GameHistory[] = [
  {
    id: 'hist_sample_1',
    pin: 'K8R4',
    quizId: 'quiz-world-capitals',
    quizTitle: '🏛️ World Capitals Showdown',
    hostId: 'official-quizrush',
    hostEmail: 'organizer@demo.com',
    playedAt: Date.now() - 3600000 * 24 * 2, // 2 days ago
    totalPlayers: 4,
    totalQuestions: 5,
    topPlayers: [
      { rank: 1, nickname: 'AtlasPro', score: 4850, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AtlasPro' },
      { rank: 2, nickname: 'Globetrotter', score: 4210, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Globetrotter' },
      { rank: 3, nickname: 'Voyager', score: 3600, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Voyager' },
    ],
    questionStats: [
      { questionId: 'cap-1', questionTitle: 'What is the capital of Australia?', correctCount: 4, totalAnswered: 4, accuracy: 100 },
      { questionId: 'cap-2', questionTitle: 'What is the national capital of Canada?', correctCount: 3, totalAnswered: 4, accuracy: 75 },
      { questionId: 'cap-3', questionTitle: 'Official capitals of South Africa', correctCount: 2, totalAnswered: 4, accuracy: 50 },
      { questionId: 'cap-4', questionTitle: 'What is the capital of Turkey?', correctCount: 3, totalAnswered: 4, accuracy: 75 },
      { questionId: 'cap-5', questionTitle: 'Capitals in South America', correctCount: 3, totalAnswered: 4, accuracy: 75 },
    ],
    players: [],
  },
  {
    id: 'hist_sample_2',
    pin: 'X9M2',
    quizId: 'quiz-tech-innovators',
    quizTitle: '⚡ Ultimate Tech & Coding Challenge',
    hostId: 'official-quizrush',
    hostEmail: 'organizer@demo.com',
    playedAt: Date.now() - 3600000 * 12, // 12 hours ago
    totalPlayers: 6,
    totalQuestions: 5,
    topPlayers: [
      { rank: 1, nickname: 'ByteWizard', score: 5320, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ByteWizard' },
      { rank: 2, nickname: 'FullStackDev', score: 4940, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=FullStackDev' },
      { rank: 3, nickname: 'CyberNinja', score: 4120, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja' },
    ],
    questionStats: [
      { questionId: 'tech-1', questionTitle: 'Created by Brendan Eich in 1995?', correctCount: 6, totalAnswered: 6, accuracy: 100 },
      { questionId: 'tech-2', questionTitle: 'JavaScript frontend frameworks/libraries', correctCount: 5, totalAnswered: 6, accuracy: 83 },
      { questionId: 'tech-3', questionTitle: 'What does CSS stand for?', correctCount: 6, totalAnswered: 6, accuracy: 100 },
      { questionId: 'tech-4', questionTitle: 'Port 443 protocol?', correctCount: 5, totalAnswered: 6, accuracy: 83 },
      { questionId: 'tech-5', questionTitle: 'Hyperscale cloud service providers', correctCount: 4, totalAnswered: 6, accuracy: 67 },
    ],
    players: [],
  },
];

export const recordGameHistory = async (session: GameSession): Promise<void> => {
  const playersList = Object.values(session.players || {});
  const sortedPlayers = [...playersList].sort((a, b) => b.score - a.score);

  const topPlayers = sortedPlayers.slice(0, 3).map((p, idx) => ({
    rank: idx + 1,
    nickname: p.nickname,
    score: p.score,
    avatar: p.avatar,
  }));

  const questionStats: QuestionStat[] = session.quiz.questions.map((q) => {
    let correctCount = 0;
    let totalAnswered = 0;

    playersList.forEach((p) => {
      const ans = p.answers?.[q.id];
      if (ans) {
        totalAnswered++;
        if (ans.isCorrect) correctCount++;
      }
    });

    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    return {
      questionId: q.id,
      questionTitle: q.title,
      correctCount,
      totalAnswered,
      accuracy,
    };
  });

  const historyRecord: GameHistory = {
    id: `hist_${session.pin}_${Date.now()}`,
    pin: session.pin,
    quizId: session.quizId,
    quizTitle: session.quiz.title,
    hostId: session.hostId,
    playedAt: Date.now(),
    totalPlayers: playersList.length,
    totalQuestions: session.quiz.questions.length,
    topPlayers,
    questionStats,
    players: playersList,
  };

  // Save to local storage
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('quizrush_game_history');
    let list: GameHistory[] = raw ? JSON.parse(raw) : [];
    // Avoid duplicate logs for the same session pin
    list = list.filter((h) => h.pin !== session.pin);
    list.unshift(historyRecord);
    localStorage.setItem('quizrush_game_history', JSON.stringify(list));
  }

  // Save to Firestore if available
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'history', historyRecord.id), historyRecord);
    } catch (err) {
      console.warn('Failed to save history to Firestore:', err);
    }
  }
};

export const getGameHistory = async (): Promise<GameHistory[]> => {
  let localList: GameHistory[] = [];

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('quizrush_game_history');
    if (raw) {
      try {
        localList = JSON.parse(raw);
      } catch (e) {
        console.error(e);
      }
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(query(collection(db, 'history'), orderBy('playedAt', 'desc')));
      const remoteList: GameHistory[] = [];
      snap.forEach((d) => remoteList.push(d.data() as GameHistory));
      if (remoteList.length > 0) {
        return remoteList;
      }
    } catch (e) {
      console.warn('Failed to read history from Firestore:', e);
    }
  }

  if (localList.length === 0) {
    // Seed with realistic demo history so admin dashboard has immediate data
    if (typeof window !== 'undefined') {
      localStorage.setItem('quizrush_game_history', JSON.stringify(SEED_SAMPLE_HISTORY));
    }
    return SEED_SAMPLE_HISTORY;
  }

  return localList;
};

export const deleteHistoryRecord = async (id: string): Promise<void> => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('quizrush_game_history');
    if (raw) {
      let list: GameHistory[] = JSON.parse(raw);
      list = list.filter((h) => h.id !== id);
      localStorage.setItem('quizrush_game_history', JSON.stringify(list));
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'history', id));
    } catch (e) {
      console.error(e);
    }
  }
};
