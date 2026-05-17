'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Save, AlertCircle } from 'lucide-react';
import { formatUomType, getScoreColor } from '@/lib/utils';

interface Achievement {
  quarter: string;
  actual_value: number | null;
  actual_date: string | null;
  status: string;
  progress_score: number;
}

interface Goal {
  id: string;
  title: string;
  thrust_area: string;
  uom_type: string;
  target_value: number | null;
  target_date: string | null;
  weightage: number;
  is_shared: number;
  achievements: Achievement[];
}

interface GoalSheet {
  id: string;
  status: string;
  goals: Goal[];
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export default function AchievementsPage() {
  const [sheet, setSheet] = useState<GoalSheet | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [formData, setFormData] = useState<Record<string, { actualValue: number | null; actualDate: string | null; status: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/goals');
      const data = await res.json();
      if (data.sheets?.[0]) {
        setSheet(data.sheets[0]);
        // Initialize form data from existing achievements
        const fd: Record<string, { actualValue: number | null; actualDate: string | null; status: string }> = {};
        for (const goal of data.sheets[0].goals) {
          const ach = goal.achievements?.find((a: Achievement) => a.quarter === selectedQuarter);
          fd[goal.id] = {
            actualValue: ach?.actual_value ?? null,
            actualDate: ach?.actual_date ?? null,
            status: ach?.status || 'not_started',
          };
        }
        setFormData(fd);
      }
    } catch { console.error('Failed to fetch'); }
    finally { setLoading(false); }
  }, [selectedQuarter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Re-init form when quarter changes
  useEffect(() => {
    if (!sheet) return;
    const fd: Record<string, { actualValue: number | null; actualDate: string | null; status: string }> = {};
    for (const goal of sheet.goals) {
      const ach = goal.achievements?.find((a: Achievement) => a.quarter === selectedQuarter);
      fd[goal.id] = {
        actualValue: ach?.actual_value ?? null,
        actualDate: ach?.actual_date ?? null,
        status: ach?.status || 'not_started',
      };
    }
    setFormData(fd);
  }, [selectedQuarter, sheet]);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const saveAchievement = async (goalId: string) => {
    setSaving(true);
    try {
      const fd = formData[goalId];
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          goalId,
          quarter: selectedQuarter,
          actualValue: fd.actualValue,
          actualDate: fd.actualDate,
          status: fd.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error);
      } else {
        showToast('success', `${selectedQuarter} achievement saved! Score: ${data.progressScore}%`);
        await fetchData();
      }
    } catch { showToast('error', 'Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!sheet || sheet.status !== 'approved') {
    return (
      <div className="glass-card p-12 text-center max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#f59e0b' }} />
        <h3 className="text-lg font-semibold mb-2">Goals Not Approved</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Your goal sheet must be approved by your manager before you can log achievements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Achievement Tracking</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Log your quarterly progress against planned targets
        </p>
      </div>

      {/* Quarter tabs */}
      <div className="flex gap-2">
        {QUARTERS.map(q => (
          <button
            key={q}
            onClick={() => setSelectedQuarter(q)}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: selectedQuarter === q ? 'var(--accent-glow)' : 'var(--bg-secondary)',
              color: selectedQuarter === q ? 'var(--accent-secondary)' : 'var(--text-secondary)',
              border: `1px solid ${selectedQuarter === q ? 'rgba(99,102,241,0.3)' : 'var(--border-primary)'}`,
              cursor: 'pointer',
            }}>
            {q}
          </button>
        ))}
      </div>

      {/* Goals with achievement inputs */}
      {sheet.goals.map((goal, i) => {
        const fd = formData[goal.id] || { actualValue: null, actualDate: null, status: 'not_started' };
        const existingAch = goal.achievements?.find(a => a.quarter === selectedQuarter);
        const score = existingAch?.progress_score || 0;
        const scoreColor = score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : score > 0 ? '#ef4444' : '#555';

        return (
          <div key={goal.id} className="glass-card p-5 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            {/* Goal header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'var(--accent-glow)', color: 'var(--accent-secondary)' }}>
                    {goal.weightage}%
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                    {formatUomType(goal.uom_type)}
                  </span>
                </div>
                <h4 className="font-semibold text-sm">{goal.title}</h4>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{goal.thrust_area}</p>
              </div>
              {/* Score display */}
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: scoreColor }}>{score}%</div>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Progress Score</p>
              </div>
            </div>

            {/* Target info */}
            <div className="p-3 rounded-xl mb-4" style={{ background: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Target: </span>
                  <span className="font-medium">
                    {goal.uom_type === 'timeline' ? goal.target_date : goal.uom_type === 'zero' ? '0' : goal.target_value}
                    {goal.uom_type.includes('percentage') ? '%' : ''}
                  </span>
                </div>
                {existingAch && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Actual: </span>
                    <span className={`font-medium ${getScoreColor(score)}`}>
                      {goal.uom_type === 'timeline' ? existingAch.actual_date : existingAch.actual_value}
                      {goal.uom_type.includes('percentage') ? '%' : ''}
                    </span>
                  </div>
                )}
              </div>
              {/* Progress bar */}
              <div className="progress-bar mt-2 h-2">
                <div className="progress-fill" style={{ width: `${Math.min(score, 100)}%`, background: scoreColor }} />
              </div>
            </div>

            {/* Input fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  {goal.uom_type === 'timeline' ? 'Completion Date' : 'Actual Value'}
                </label>
                {goal.uom_type === 'timeline' ? (
                  <input
                    type="date"
                    value={fd.actualDate || ''}
                    onChange={(e) => setFormData({ ...formData, [goal.id]: { ...fd, actualDate: e.target.value } })}
                  />
                ) : (
                  <input
                    type="number"
                    value={fd.actualValue ?? ''}
                    onChange={(e) => setFormData({ ...formData, [goal.id]: { ...fd, actualValue: e.target.value ? parseFloat(e.target.value) : null } })}
                    placeholder="Enter actual..."
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Status</label>
                <select
                  value={fd.status}
                  onChange={(e) => setFormData({ ...formData, [goal.id]: { ...fd, status: e.target.value } })}>
                  <option value="not_started">Not Started</option>
                  <option value="on_track">On Track</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => saveAchievement(goal.id)}
                  disabled={saving}
                  className="btn btn-primary w-full">
                  <Save className="w-4 h-4" />
                  Save {selectedQuarter}
                </button>
              </div>
            </div>

            {/* Previous quarters */}
            {goal.achievements && goal.achievements.length > 0 && (
              <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Quarter History</p>
                <div className="flex gap-2">
                  {QUARTERS.map(q => {
                    const a = goal.achievements.find(ach => ach.quarter === q);
                    const s = a?.progress_score || 0;
                    const c = s >= 90 ? '#10b981' : s >= 70 ? '#f59e0b' : s > 0 ? '#ef4444' : '#333';
                    return (
                      <div key={q} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: a ? `${c}15` : 'var(--bg-secondary)', color: a ? c : 'var(--text-muted)', border: `1px solid ${a ? `${c}30` : 'transparent'}` }}>
                        {q}: {a ? `${s}%` : '-'}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
