'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Quiz, Question, AnswerOption, QuestionType } from '@/lib/types';
import { saveQuiz } from '@/lib/gameEngine';
import { ShapeIcon } from './ShapeIcon';
import {
  Plus,
  Trash2,
  Copy,
  Save,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { sounds } from '@/lib/soundEngine';

interface QuizEditorFormProps {
  initialQuiz?: Quiz;
  user?: any;
}

const DEFAULT_OPTIONS: AnswerOption[] = [
  { id: 'opt-1', text: '', isCorrect: true, color: 'red', shape: 'triangle' },
  { id: 'opt-2', text: '', isCorrect: false, color: 'blue', shape: 'diamond' },
  { id: 'opt-3', text: '', isCorrect: false, color: 'yellow', shape: 'circle' },
  { id: 'opt-4', text: '', isCorrect: false, color: 'green', shape: 'square' },
];

export const QuizEditorForm: React.FC<QuizEditorFormProps> = ({ initialQuiz, user }) => {
  const router = useRouter();

  const [title, setTitle] = useState(initialQuiz?.title || '');
  const [description, setDescription] = useState(initialQuiz?.description || '');
  const [coverImage, setCoverImage] = useState(
    initialQuiz?.coverImage ||
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
  );

  const [questions, setQuestions] = useState<Question[]>(
    initialQuiz?.questions || [
      {
        id: 'q_' + Date.now(),
        title: '',
        type: 'single',
        timeLimit: 20,
        points: 1000,
        options: JSON.parse(JSON.stringify(DEFAULT_OPTIONS)),
      },
    ]
  );

  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeQuestion = questions[activeQuestionIdx] || questions[0];

  const handleAddQuestion = () => {
    sounds.playPop();
    const newQ: Question = {
      id: 'q_' + Date.now() + Math.random().toString(36).substring(2, 5),
      title: '',
      type: 'single',
      timeLimit: 20,
      points: 1000,
      options: [
        { id: 'opt-1-' + Date.now(), text: '', isCorrect: true, color: 'red', shape: 'triangle' },
        { id: 'opt-2-' + Date.now(), text: '', isCorrect: false, color: 'blue', shape: 'diamond' },
        { id: 'opt-3-' + Date.now(), text: '', isCorrect: false, color: 'yellow', shape: 'circle' },
        { id: 'opt-4-' + Date.now(), text: '', isCorrect: false, color: 'green', shape: 'square' },
      ],
    };

    setQuestions([...questions, newQ]);
    setActiveQuestionIdx(questions.length);
  };

  const handleDuplicateQuestion = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playPop();
    const source = questions[idx];
    const cloned: Question = {
      ...source,
      id: 'q_' + Date.now() + Math.random().toString(36).substring(2, 5),
      title: `${source.title} (Copy)`,
      options: source.options.map((opt) => ({
        ...opt,
        id: 'opt_' + Math.random().toString(36).substring(2, 8),
      })),
    };
    const updated = [...questions];
    updated.splice(idx + 1, 0, cloned);
    setQuestions(updated);
    setActiveQuestionIdx(idx + 1);
  };

  const handleDeleteQuestion = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (questions.length <= 1) {
      setError('A quiz must have at least one question.');
      return;
    }
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    setActiveQuestionIdx(Math.max(0, idx - 1));
  };

  const updateActiveQuestion = (field: Partial<Question>) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[activeQuestionIdx] = { ...copy[activeQuestionIdx], ...field };
      return copy;
    });
  };

  const handleTypeChange = (type: QuestionType) => {
    sounds.playPop();
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[activeQuestionIdx], type };

      // If switching to single choice, ensure only one answer is marked correct
      if (type === 'single') {
        let foundOne = false;
        q.options = q.options.map((opt) => {
          if (opt.isCorrect && !foundOne) {
            foundOne = true;
            return opt;
          }
          return { ...opt, isCorrect: false };
        });
        if (!foundOne && q.options.length > 0) {
          q.options[0].isCorrect = true;
        }
      }
      copy[activeQuestionIdx] = q;
      return copy;
    });
  };

  const handleOptionTextChange = (optIdx: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[activeQuestionIdx] };
      const opts = [...q.options];
      opts[optIdx] = { ...opts[optIdx], text };
      q.options = opts;
      copy[activeQuestionIdx] = q;
      return copy;
    });
  };

  const toggleOptionCorrect = (optIdx: number) => {
    sounds.playPop();
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[activeQuestionIdx] };
      const opts = [...q.options];

      if (q.type === 'single') {
        // Only one can be correct
        opts.forEach((o, i) => {
          o.isCorrect = i === optIdx;
        });
      } else {
        // Multiple choices: toggle
        opts[optIdx] = { ...opts[optIdx], isCorrect: !opts[optIdx].isCorrect };
      }

      q.options = opts;
      copy[activeQuestionIdx] = q;
      return copy;
    });
  };

  const handleSave = async () => {
    setError(null);

    if (!title.trim()) {
      setError('Please provide a title for your quiz.');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.title.trim()) {
        setError(`Question #${i + 1} has an empty question title.`);
        setActiveQuestionIdx(i);
        return;
      }

      const emptyOpt = q.options.find((o) => !o.text.trim());
      if (emptyOpt) {
        setError(`Question #${i + 1} has empty answer choices. Please fill in all 4 choices.`);
        setActiveQuestionIdx(i);
        return;
      }

      const hasCorrect = q.options.some((o) => o.isCorrect);
      if (!hasCorrect) {
        setError(`Question #${i + 1} must have at least one correct answer marked.`);
        setActiveQuestionIdx(i);
        return;
      }
    }

    try {
      setSaving(true);
      const quizId = initialQuiz?.id || 'quiz_' + Date.now();
      const quizData: Quiz = {
        id: quizId,
        title: title.trim(),
        description: description.trim(),
        coverImage,
        creatorId: user?.uid || 'guest-host',
        creatorName: user?.displayName || 'Quiz Host',
        creatorEmail: user?.email || '',
        isPublic: true,
        createdAt: initialQuiz?.createdAt || Date.now(),
        updatedAt: Date.now(),
        questions,
      };

      await saveQuiz(quizData);
      sounds.playCorrect();
      router.push('/host/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Failed to save quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {initialQuiz ? 'Edit Quiz' : 'Quiz Authoring Studio'}
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-0.5">
            Configure questions, time limits, and single or multiple choice answers
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/host/dashboard')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition transform hover:scale-105 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save & Finish'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="my-6 p-4 rounded-2xl bg-rush-red/20 border border-rush-red/40 flex items-center space-x-3 text-red-200 text-sm font-bold">
          <AlertCircle className="w-5 h-5 text-rush-red shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8">
        {/* Left Sidebar: Questions list & metadata */}
        <div className="lg:col-span-4 space-y-6">
          {/* Metadata Card */}
          <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-300">
              Quiz Info
            </h3>

            <div>
              <label className="block text-xs uppercase font-extrabold text-white/70 mb-1">
                Quiz Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Science & Space Odyssey"
                className="w-full text-sm font-bold bg-rush-navy/80 border border-white/20 focus:border-amber-400 focus:outline-none rounded-xl p-3 text-white transition"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-extrabold text-white/70 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief summary for your players..."
                className="w-full text-xs font-medium bg-rush-navy/80 border border-white/20 focus:border-amber-400 focus:outline-none rounded-xl p-3 text-white transition"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-extrabold text-white/70 mb-1">
                Cover Image URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs bg-rush-navy/80 border border-white/20 focus:border-amber-400 focus:outline-none rounded-xl p-3 text-white transition pl-8"
                />
                <ImageIcon className="w-4 h-4 text-white/40 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="glass-card p-5 rounded-3xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-300">
                Questions ({questions.length})
              </h3>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center space-x-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isActive = idx === activeQuestionIdx;
                return (
                  <div
                    key={q.id}
                    onClick={() => setActiveQuestionIdx(idx)}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between group ${
                      isActive
                        ? 'bg-rush-purple/40 border-amber-400 text-white shadow-md'
                        : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-amber-400 text-rush-dark' : 'bg-white/10 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold truncate">
                        {q.title || `Untitled Question #${idx + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => handleDuplicateQuestion(idx, e)}
                        title="Duplicate"
                        className="p-1 rounded text-white/60 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {questions.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteQuestion(idx, e)}
                          title="Delete"
                          className="p-1 rounded text-white/60 hover:text-rush-red"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Area: Active Question Editor */}
        <div className="lg:col-span-8">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl space-y-6">
            {/* Header / Type / Time / Points Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                Question {activeQuestionIdx + 1} of {questions.length}
              </span>

              <div className="flex flex-wrap items-center gap-3">
                {/* Single vs Multiple Choice Toggle */}
                <div className="flex items-center bg-rush-navy/80 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('single')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition ${
                      activeQuestion.type === 'single'
                        ? 'bg-rush-blue text-white shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    1 of 4 (Single)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('multiple')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition ${
                      activeQuestion.type === 'multiple'
                        ? 'bg-rush-purple text-white shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Multi-Choice ✨
                  </button>
                </div>

                {/* Time Limit */}
                <div className="flex items-center space-x-1.5 bg-rush-navy/80 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <select
                    value={activeQuestion.timeLimit}
                    onChange={(e) => updateActiveQuestion({ timeLimit: Number(e.target.value) })}
                    className="bg-transparent text-white focus:outline-none cursor-pointer"
                  >
                    <option value={10} className="bg-rush-dark">10 sec</option>
                    <option value={20} className="bg-rush-dark">20 sec</option>
                    <option value={30} className="bg-rush-dark">30 sec</option>
                    <option value={60} className="bg-rush-dark">60 sec</option>
                    <option value={90} className="bg-rush-dark">90 sec</option>
                  </select>
                </div>

                {/* Points */}
                <div className="flex items-center space-x-1.5 bg-rush-navy/80 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <select
                    value={activeQuestion.points}
                    onChange={(e) => updateActiveQuestion({ points: Number(e.target.value) })}
                    className="bg-transparent text-white focus:outline-none cursor-pointer"
                  >
                    <option value={1000} className="bg-rush-dark">1000 pts</option>
                    <option value={2000} className="bg-rush-dark">2000 pts (2x)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Question Title Input */}
            <div>
              <label className="block text-xs uppercase font-extrabold text-white/70 mb-2">
                Question Prompt
              </label>
              <textarea
                value={activeQuestion.title}
                onChange={(e) => updateActiveQuestion({ title: e.target.value })}
                rows={3}
                placeholder="Type your question here (e.g., Which planet is known as the Red Planet?)..."
                className="w-full text-lg sm:text-xl font-bold bg-rush-navy/90 border-2 border-white/20 focus:border-amber-400 focus:outline-none rounded-2xl p-4 text-white placeholder:text-white/30 transition shadow-inner"
              />
            </div>

            {/* Answer Choices (Kahoot 4-block grid) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs uppercase font-extrabold text-white/70">
                  Answer Choices & Correctness
                </label>
                <span className="text-xs font-semibold text-amber-300">
                  {activeQuestion.type === 'single'
                    ? 'Pick 1 correct answer'
                    : 'Check ALL correct answers'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeQuestion.options.map((opt, optIdx) => {
                  const isCorrect = opt.isCorrect;

                  let borderColor = 'border-white/20';
                  let shapeBg = 'bg-white/10';
                  if (opt.color === 'red') shapeBg = 'bg-rush-red';
                  if (opt.color === 'blue') shapeBg = 'bg-rush-blue';
                  if (opt.color === 'yellow') shapeBg = 'bg-rush-yellow';
                  if (opt.color === 'green') shapeBg = 'bg-rush-green';

                  return (
                    <div
                      key={opt.id}
                      className={`relative p-4 rounded-2xl border-2 transition bg-rush-navy/90 flex flex-col justify-between ${
                        isCorrect
                          ? 'border-emerald-400 ring-2 ring-emerald-400/40 bg-emerald-950/20'
                          : 'border-white/15'
                      }`}
                    >
                      <div className="flex items-start space-x-3 mb-3">
                        <div
                          className={`w-9 h-9 rounded-xl ${shapeBg} flex items-center justify-center shrink-0 shadow`}
                        >
                          <ShapeIcon shape={opt.shape} size={20} className="text-white drop-shadow" />
                        </div>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionTextChange(optIdx, e.target.value)}
                          placeholder={`Answer Choice #${optIdx + 1}...`}
                          className="w-full text-sm font-bold bg-transparent border-b border-white/20 focus:border-amber-400 focus:outline-none py-1 text-white placeholder:text-white/30 transition"
                        />
                      </div>

                      {/* Correct Toggle Button */}
                      <button
                        type="button"
                        onClick={() => toggleOptionCorrect(optIdx)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 transition ${
                          isCorrect
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                            : 'bg-white/5 hover:bg-white/10 text-white/50 border border-white/10'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isCorrect ? 'Correct Answer' : 'Mark as Correct'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
