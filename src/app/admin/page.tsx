'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  History,
  Mail,
  Download,
  Users,
  Trophy,
  BarChart3,
  Calendar,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Send,
  Sparkles,
  ArrowRight,
  ExternalLink,
  X,
} from 'lucide-react';
import { getGameHistory, deleteHistoryRecord } from '@/lib/gameEngine';
import { GameHistory } from '@/lib/types';
import { subscribeToAuth } from '@/lib/firebase';
import { sounds } from '@/lib/soundEngine';

export default function AdminDashboardPage() {
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Modals state
  const [selectedSession, setSelectedSession] = useState<GameHistory | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailSession, setEmailSession] = useState<GameHistory | null>(null);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailType, setEmailType] = useState<'game_report' | 'quiz_invite'>('game_report');
  const [invitePin, setInvitePin] = useState('');
  const [inviteQuizTitle, setInviteQuizTitle] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; message: string; previewHtml?: string } | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAuth((u) => setUser(u));
    return () => unsub();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getGameHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDeleteRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this game history record?')) {
      await deleteHistoryRecord(id);
      loadHistory();
    }
  };

  const handleOpenEmailModal = (session: GameHistory) => {
    sounds.playPop();
    setEmailSession(session);
    setEmailType('game_report');
    setEmailRecipients(user?.email ? `${user.email}` : '');
    setEmailStatus(null);
    setEmailModalOpen(true);
  };

  const handleOpenInviteModal = () => {
    sounds.playPop();
    setEmailSession(null);
    setEmailType('quiz_invite');
    setInvitePin('K8R4');
    setInviteQuizTitle('World Capitals Showdown');
    setEmailRecipients('');
    setEmailStatus(null);
    setEmailModalOpen(true);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRecipients.trim()) return;

    setSendingEmail(true);
    setEmailStatus(null);

    const recipientsList = emailRecipients
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    try {
      const payload: any = {
        type: emailType,
        recipients: recipientsList,
        data:
          emailType === 'game_report' && emailSession
            ? {
                pin: emailSession.pin,
                quizTitle: emailSession.quizTitle,
                playedAt: emailSession.playedAt,
                totalPlayers: emailSession.totalPlayers,
                topPlayers: emailSession.topPlayers,
                questionStats: emailSession.questionStats,
              }
            : {
                pin: invitePin,
                quizTitle: inviteQuizTitle,
                senderName: user?.displayName || 'Quiz Host',
                joinUrl: `${window.location.origin}/join?pin=${invitePin}`,
              },
      };

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to send email.');
      }

      sounds.playCorrect();
      setEmailStatus({
        success: true,
        message: json.message,
        previewHtml: json.previewHtml,
      });
    } catch (err: any) {
      console.error(err);
      sounds.playWrong();
      setEmailStatus({
        success: false,
        message: err.message || 'Error occurred while sending email.',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const exportSessionCSV = (session: GameHistory) => {
    sounds.playPop();
    const headers = ['Rank', 'Player Nickname', 'Final Score', 'Game PIN', 'Quiz Title', 'Played At'];
    const rows = (session.players?.length ? session.players : session.topPlayers).map((p: any, idx: number) => [
      idx + 1,
      `"${p.nickname}"`,
      p.score,
      session.pin,
      `"${session.quizTitle}"`,
      new Date(session.playedAt).toISOString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `QuizRush_Session_${session.pin}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Aggregated Stats
  const totalGamesHosted = history.length;
  const totalPlayersEngaged = history.reduce((sum, h) => sum + (h.totalPlayers || 0), 0);
  const avgAccuracy =
    history.length > 0
      ? Math.round(
          history.reduce((sum, h) => {
            const accSum = h.questionStats?.reduce((a, q) => a + (q.accuracy || 0), 0) || 0;
            const qCount = h.questionStats?.length || 1;
            return sum + accSum / qCount;
          }, 0) / history.length
        )
      : 85;

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-white/10 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin & Analytics Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Session History & Email Center</h1>
          <p className="text-white/60 text-sm mt-1">
            Review past games, drill down into player results, dispatch email scorecards, and export reports
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleOpenInviteModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition"
          >
            <Mail className="w-4 h-4 text-amber-400" />
            <span>Send Quiz Invites</span>
          </button>
          <Link
            href="/host/dashboard"
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rush-purple to-rush-red hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-lg transition"
          >
            <span>Host Arena</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 my-8">
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rush-blue/20 border border-rush-blue/40 flex items-center justify-center text-rush-blue">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{totalGamesHosted}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-white/50">Games Hosted</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{totalPlayersEngaged}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-white/50">Players Participated</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{avgAccuracy}%</div>
            <div className="text-xs font-bold uppercase tracking-wider text-white/50">Avg Answer Accuracy</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">Active</div>
            <div className="text-xs font-bold uppercase tracking-wider text-white/50">Email Service Ready</div>
          </div>
        </div>
      </div>

      {/* History Table Container */}
      <div className="glass-card rounded-3xl border border-white/15 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black text-white">Past Hosted Matches & Leaderboard Logs</h3>
          </div>
          <span className="text-xs font-bold text-white/50">{history.length} Session Records</span>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-sm font-semibold text-white/60">Loading session history...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="p-16 text-center text-white/60 text-sm">
            No game sessions logged yet. Host your first game to generate history logs!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-rush-navy/60 text-white/60 uppercase text-[11px] font-extrabold tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-4 px-6">Date & PIN</th>
                  <th className="py-4 px-6">Quiz Title</th>
                  <th className="py-4 px-6">Players</th>
                  <th className="py-4 px-6">🥇 Winner</th>
                  <th className="py-4 px-6">Avg Accuracy</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {history.map((record) => {
                  const winner = record.topPlayers?.[0];
                  const avgRecordAcc = record.questionStats?.length
                    ? Math.round(
                        record.questionStats.reduce((a, b) => a + b.accuracy, 0) / record.questionStats.length
                      )
                    : 80;

                  return (
                    <tr key={record.id} className="hover:bg-white/5 transition">
                      <td className="py-4 px-6">
                        <div className="font-black text-amber-300 tracking-wider">{record.pin}</div>
                        <div className="text-xs text-white/40 flex items-center space-x-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(record.playedAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-bold text-white max-w-xs truncate">
                        {record.quizTitle}
                      </td>

                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full bg-rush-blue/20 text-blue-300 border border-rush-blue/40 text-xs font-bold">
                          {record.totalPlayers} Players
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {winner ? (
                          <div className="flex items-center space-x-2">
                            <img
                              src={winner.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${winner.nickname}`}
                              alt={winner.nickname}
                              className="w-6 h-6 rounded-full bg-rush-dark border border-amber-400"
                            />
                            <div>
                              <span className="font-extrabold text-white text-xs">{winner.nickname}</span>
                              <span className="text-[10px] text-amber-300 ml-1.5 font-black">
                                ({winner.score.toLocaleString()} pts)
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-white/40 text-xs">None</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-white/10 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${avgRecordAcc}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-white/80">{avgRecordAcc}%</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setSelectedSession(record)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                            title="View Full Breakdown"
                          >
                            <Eye className="w-4 h-4 text-cyan-300" />
                          </button>

                          <button
                            onClick={() => handleOpenEmailModal(record)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                            title="Send Email Report"
                          >
                            <Mail className="w-4 h-4 text-amber-300" />
                          </button>

                          <button
                            onClick={() => exportSessionCSV(record)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                            title="Export CSV"
                          >
                            <Download className="w-4 h-4 text-emerald-300" />
                          </button>

                          <button
                            onClick={(e) => handleDeleteRecord(record.id, e)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-rush-red/20 text-white/50 hover:text-rush-red transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. DRILLDOWN REPORT MODAL                                 */}
      {/* ========================================================= */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card max-w-2xl w-full rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <div className="text-xs uppercase font-extrabold tracking-wider text-amber-300">
                  Game Session Report
                </div>
                <h3 className="text-2xl font-black text-white">{selectedSession.quizTitle}</h3>
                <span className="text-xs text-white/60">
                  PIN: {selectedSession.pin} &bull; Played on{' '}
                  {new Date(selectedSession.playedAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Podium Top 3 */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-3">
                🏆 Top Finishers
              </h4>
              <div className="space-y-2">
                {selectedSession.topPlayers?.map((tp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                          idx === 0 ? 'bg-amber-400 text-rush-dark' : idx === 1 ? 'bg-slate-300 text-rush-dark' : 'bg-amber-700 text-white'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <img src={tp.avatar} alt={tp.nickname} className="w-7 h-7 rounded-full bg-rush-dark" />
                      <span className="font-bold text-white text-sm">{tp.nickname}</span>
                    </div>
                    <span className="text-sm font-black text-amber-300">{tp.score.toLocaleString()} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Question by Question Accuracy */}
            {selectedSession.questionStats?.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-3">
                  📊 Question Accuracy Breakdown
                </h4>
                <div className="space-y-3">
                  {selectedSession.questionStats.map((q, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-rush-navy/60 border border-white/10">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-white truncate max-w-sm">
                          Q{idx + 1}: {q.questionTitle}
                        </span>
                        <span className="font-extrabold text-amber-300 shrink-0 ml-2">
                          {q.correctCount} / {q.totalAnswered} Correct ({q.accuracy}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            q.accuracy >= 75 ? 'bg-emerald-500' : q.accuracy >= 40 ? 'bg-amber-400' : 'bg-rush-red'
                          }`}
                          style={{ width: `${q.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => exportSessionCSV(selectedSession)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => {
                  setSelectedSession(null);
                  handleOpenEmailModal(selectedSession);
                }}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rush-blue to-cyan-500 text-xs font-black text-white shadow-lg transition"
              >
                <Mail className="w-4 h-4" />
                <span>Send via Email</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SEND EMAIL MODAL                                       */}
      {/* ========================================================= */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card max-w-lg w-full rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-amber-400" />
                <h3 className="text-xl font-black text-white">
                  {emailType === 'game_report' ? 'Email Session Report' : 'Send Quiz Invitations'}
                </h3>
              </div>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {emailStatus && (
              <div
                className={`mb-6 p-4 rounded-2xl border text-xs font-bold flex flex-col space-y-2 ${
                  emailStatus.success
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-rush-red/20 border-rush-red/40 text-red-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {emailStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rush-red shrink-0" />
                  )}
                  <span>{emailStatus.message}</span>
                </div>
                {emailStatus.previewHtml && (
                  <button
                    type="button"
                    onClick={() => setShowEmailPreview(!showEmailPreview)}
                    className="text-amber-300 hover:underline text-[11px] text-left mt-1"
                  >
                    {showEmailPreview ? 'Hide HTML Email Preview' : '👁️ View Formatted HTML Email Preview'}
                  </button>
                )}
              </div>
            )}

            {showEmailPreview && emailStatus?.previewHtml && (
              <div className="mb-6 p-3 rounded-2xl bg-white text-black text-xs max-h-56 overflow-y-auto shadow-inner">
                <div dangerouslySetInnerHTML={{ __html: emailStatus.previewHtml }} />
              </div>
            )}

            <form onSubmit={handleSendEmail} className="space-y-4">
              {emailType === 'quiz_invite' && (
                <>
                  <div>
                    <label className="block text-xs uppercase font-extrabold text-white/70 mb-1">
                      Game PIN to Invite
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={invitePin}
                      onChange={(e) => setInvitePin(e.target.value.toUpperCase())}
                      className="w-full text-center text-xl font-black uppercase tracking-widest bg-rush-navy/80 border border-white/20 focus:border-amber-400 rounded-xl p-2.5 text-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-extrabold text-white/70 mb-1">
                      Quiz Topic Title
                    </label>
                    <input
                      type="text"
                      value={inviteQuizTitle}
                      onChange={(e) => setInviteQuizTitle(e.target.value)}
                      className="w-full text-xs font-bold bg-rush-navy/80 border border-white/20 focus:border-amber-400 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </>
              )}

              {emailType === 'game_report' && emailSession && (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
                  <div className="font-black text-white">{emailSession.quizTitle}</div>
                  <div className="text-white/60 mt-0.5">
                    PIN: {emailSession.pin} &bull; {emailSession.totalPlayers} Players &bull;{' '}
                    Winner: {emailSession.topPlayers?.[0]?.nickname || 'None'}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs uppercase font-extrabold text-white/70 mb-1">
                  Recipient Email Addresses (comma-separated) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="e.g. player1@gmail.com, organizer@company.com"
                  className="w-full text-xs font-medium bg-rush-navy/90 border border-white/20 focus:border-amber-400 rounded-xl p-3 text-white placeholder:text-white/30"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail || !emailRecipients.trim()}
                  className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-xl transition ${
                    sendingEmail || !emailRecipients.trim()
                      ? 'bg-white/10 text-white/40 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 active:scale-95'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingEmail ? 'Dispatching...' : 'Send Email'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
