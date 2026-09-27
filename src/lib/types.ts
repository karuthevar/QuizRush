export type QuestionType = 'single' | 'multiple';

export type ShapeType = 'triangle' | 'diamond' | 'circle' | 'square';
export type ColorTheme = 'red' | 'blue' | 'yellow' | 'green';

export interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
  color: ColorTheme;
  shape: ShapeType;
}

export interface Question {
  id: string;
  title: string;
  type: QuestionType; // 'single' (1 of 4) or 'multiple'
  timeLimit: number; // in seconds, e.g., 20
  points: number; // base points, e.g., 1000
  imageUrl?: string;
  options: AnswerOption[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  creatorId: string;
  creatorName: string;
  creatorEmail?: string;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  questions: Question[];
}

export type GameStatus =
  | 'lobby'
  | 'countdown'
  | 'question'
  | 'result'
  | 'leaderboard'
  | 'podium'
  | 'ended';

export interface PlayerAnswer {
  questionId: string;
  selectedOptionIds: string[];
  answeredAt: number;
  isCorrect: boolean;
  pointsEarned: number;
  timeToAnswerMs: number;
}

export interface Player {
  id: string;
  nickname: string;
  avatar: string;
  score: number;
  streak: number;
  answers: Record<string, PlayerAnswer>;
  lastAnswerCorrect?: boolean;
  lastPointsEarned?: number;
  connected: boolean;
  joinedAt: number;
}

export interface GameSession {
  pin: string;
  quizId: string;
  quiz: Quiz;
  hostId: string;
  status: GameStatus;
  currentQuestionIndex: number;
  questionStartTime?: number;
  questionEndTime?: number;
  createdAt: number;
  updatedAt: number;
  players?: Record<string, Player>;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export interface QuestionStat {
  questionId: string;
  questionTitle: string;
  correctCount: number;
  totalAnswered: number;
  accuracy: number;
}

export interface GameHistory {
  id: string;
  pin: string;
  quizId: string;
  quizTitle: string;
  hostId: string;
  hostEmail?: string;
  playedAt: number;
  totalPlayers: number;
  totalQuestions: number;
  topPlayers: {
    rank: number;
    nickname: string;
    score: number;
    avatar: string;
  }[];
  questionStats: QuestionStat[];
  players: Player[];
}

export interface PaymentTransaction {
  id: string;
  amount: number; // in cents, e.g., 499 for $4.99
  currency: string;
  date: number;
  status: 'paid' | 'simulated';
  creditsAdded: number;
  receiptUrl?: string;
}

export interface HostBillingProfile {
  userId: string;
  freeTrialsTotal: number; // 1 free trial
  freeTrialsUsed: number;
  paidCredits: number; // credits bought at $4.99 each
  totalQuizzesHosted: number;
  paymentHistory: PaymentTransaction[];
}
