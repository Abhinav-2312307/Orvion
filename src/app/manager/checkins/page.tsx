'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, CheckCircle2, Send, Sparkles, Loader2 } from 'lucide-react';
import { formatUomType } from '@/lib/utils';

interface TeamMember {
  id: string;
  name: string;
  department: string;
  goalSheet: { id: string; status: string } | null;
}

interface GoalSheet {
  id: string;
  goals: {
    id: string;
    title: string;
    thrust_area: string;
    uom_type: string;
    target_value: number | null;
    weightage: number;
    achievements: { quarter: string; actual_value: number | null; progress_score: number; status: string }[];
  }[];
}

interface CheckIn {
  id: string;
  quarter: string;
  comment: string;
  manager_name: string;
  created_at: string;
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export default function CheckInsPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [memberSheet, setMemberSheet] = useState<GoalSheet | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/team').then(r => r.json()).then(d => {
      const approved = (d.team || []).filter((m: TeamMember) => m.goalSheet?.status === 'approved');
      setTeam(approved);
      setLoading(false);
    });
  }, []);

  const loadMemberData = useCallback(async (memberId: string) => {
    setSelectedMember(memberId);
    const [goalsRes, checkinsRes] = await Promise.all([
      fetch(`/api/goals?employeeId=${memberId}`),
      fetch(`/api/checkins?sheetId=${team.find(m => m.id === memberId)?.goalSheet?.id}`),
    ]);
    const goalsData = await goalsRes.json();
    const checkinsData = await checkinsRes.json();
    setMemberSheet(goalsData.sheets?.[0] || null);
    setCheckIns(checkinsData.checkins || []);
  }, [team]);

  const submitCheckIn = async () => {
    if (!memberSheet || !comment.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: memberSheet.id, quarter: selectedQuarter, comment }),
      });
      if (res.ok) {
        setToast({ type: 'success', message: `${selectedQuarter} check-in saved!` });
        setTimeout(() => setToast(null), 3000);
        setComment('');
        if (selectedMember) loadMemberData(selectedMember);
      }
    } catch { setToast({ type: 'error', message: 'Failed to save' }); setTimeout(() => setToast(null), 3000); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  }

  const selectedMemberData = team.find(m => m.id === selectedMember);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quarterly Check-ins</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Review progress and provide feedback</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team list */}
        <div className="glass-card overflow-hidden">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
            <h3 className="font-semibold text-sm">Approved Team Members</h3>
          </div>
          {team.length === 0 ? (
            <p className="p-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No approved sheets yet</p>
          ) : (
            team.map(member => (
              <button key={member.id} onClick={() => loadMemberData(member.id)}
                className="w-full p-4 flex items-center gap-3 text-left transition-all"
                style={{ background: selectedMember === member.id ? 'var(--accent-glow)' : 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', borderBottom: '1px solid rgba(42,42,58,0.3)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: '#6366f1' }}>
                  {member.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{member.department}</p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Check-in area */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedMember && (
            <div className="glass-card p-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Select a team member to begin check-in</p>
            </div>
          )}

          {selectedMember && memberSheet && (
            <>
              {/* Quarter selector */}
              <div className="flex gap-2">
                {QUARTERS.map(q => {
                  const hasCheckIn = checkIns.some(ci => ci.quarter === q);
                  return (
                    <button key={q} onClick={() => setSelectedQuarter(q)}
                      className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                      style={{
                        background: selectedQuarter === q ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                        color: selectedQuarter === q ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                        border: `1px solid ${selectedQuarter === q ? 'rgba(99,102,241,0.3)' : 'var(--border-primary)'}`,
                        cursor: 'pointer',
                      }}>
                      {q}
                      {hasCheckIn && <CheckCircle2 className="w-3 h-3" style={{ color: '#10b981' }} />}
                    </button>
                  );
                })}
              </div>

              {/* Planned vs Actual table */}
              <div className="glass-card overflow-hidden">
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                  <h3 className="font-semibold text-sm">{selectedMemberData?.name} — {selectedQuarter} Review</h3>
                </div>
                <table>
                  <thead>
                    <tr><th>Goal</th><th>UoM</th><th>Target</th><th>Actual</th><th>Score</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {memberSheet.goals.map(goal => {
                      const ach = goal.achievements?.find(a => a.quarter === selectedQuarter);
                      const score = ach?.progress_score || 0;
                      const scoreColor = score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : score > 0 ? '#ef4444' : '#555';
                      const statusLabels: Record<string, string> = { not_started: 'Not Started', on_track: 'On Track', completed: 'Completed' };

                      return (
                        <tr key={goal.id}>
                          <td>
                            <p className="font-medium text-sm">{goal.title}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{goal.thrust_area} • {goal.weightage}%</p>
                          </td>
                          <td className="text-xs">{formatUomType(goal.uom_type)}</td>
                          <td className="text-sm font-medium">{goal.target_value ?? '-'}</td>
                          <td className="text-sm font-medium" style={{ color: scoreColor }}>{ach?.actual_value ?? '-'}</td>
                          <td><span className="text-sm font-bold" style={{ color: scoreColor }}>{score}%</span></td>
                          <td>
                            <span className="badge text-xs" style={{
                              background: ach?.status === 'completed' ? 'rgba(16,185,129,0.15)' : ach?.status === 'on_track' ? 'rgba(59,130,246,0.15)' : 'rgba(136,136,136,0.15)',
                              color: ach?.status === 'completed' ? '#10b981' : ach?.status === 'on_track' ? '#3b82f6' : '#888',
                              borderColor: 'transparent',
                            }}>
                              {statusLabels[ach?.status || 'not_started']}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Check-in comment form */}
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">Add Check-in Comment</h4>
                  <button
                    onClick={async () => {
                      if (!memberSheet || !selectedMemberData) return;
                      setAiLoading(true);
                      try {
                        const res = await fetch('/api/ai', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'checkin_summary',
                            employeeName: selectedMemberData.name,
                            goals: memberSheet.goals,
                            quarter: selectedQuarter,
                          }),
                        });
                        const data = await res.json();
                        if (data.comment) setComment(data.comment);
                      } catch { /* ignore */ }
                      finally { setAiLoading(false); }
                    }}
                    disabled={aiLoading}
                    className="ai-trigger-btn"
                    style={{ padding: '6px 12px', fontSize: '11px' }}>
                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {aiLoading ? 'Drafting...' : 'AI Draft'}
                  </button>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Document your discussion points, feedback, and action items..."
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
                <div className="flex justify-end mt-3">
                  <button onClick={submitCheckIn} disabled={saving || !comment.trim()} className="btn btn-primary">
                    <Send className="w-4 h-4" /> Submit Check-in
                  </button>
                </div>
              </div>

              {/* Previous check-ins */}
              {checkIns.length > 0 && (
                <div className="glass-card overflow-hidden">
                  <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <h4 className="font-semibold text-sm">Previous Check-ins</h4>
                  </div>
                  {checkIns.map(ci => (
                    <div key={ci.id} className="p-4" style={{ borderBottom: '1px solid rgba(42,42,58,0.3)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'var(--accent-glow)', color: 'var(--accent-secondary)' }}>{ci.quarter}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{ci.manager_name} • {new Date(ci.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{ci.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
