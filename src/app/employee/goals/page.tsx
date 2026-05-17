'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Save, Send, AlertCircle, CheckCircle2, Lock, Share2, Sparkles } from 'lucide-react';
import { formatUomType } from '@/lib/utils';
import AIPanel from '@/components/AIPanel';

interface Goal {
  id: string;
  thrust_area: string;
  title: string;
  description: string;
  uom_type: string;
  target_value: number | null;
  target_date: string | null;
  weightage: number;
  is_shared: number;
  shared_owner_name?: string;
}

interface GoalSheet {
  id: string;
  status: string;
  cycle_name?: string;
  return_comment?: string;
  goals: Goal[];
}

interface Cycle {
  id: string;
  name: string;
  status: string;
}

const THRUST_AREAS = [
  'Revenue Growth', 'Customer Success', 'Product Delivery', 'Operational Excellence',
  'Team Development', 'Brand Awareness', 'Lead Generation', 'Content Strategy',
  'Cost Optimization', 'Innovation', 'Quality Assurance', 'Compliance'
];

const UOM_TYPES = [
  { value: 'numeric_min', label: 'Numeric (Higher is better)', hint: 'e.g., Revenue, Units sold' },
  { value: 'numeric_max', label: 'Numeric (Lower is better)', hint: 'e.g., TAT, Cost, Errors' },
  { value: 'percentage_min', label: '% (Higher is better)', hint: 'e.g., Completion rate' },
  { value: 'percentage_max', label: '% (Lower is better)', hint: 'e.g., Churn rate' },
  { value: 'timeline', label: 'Timeline', hint: 'Date-based completion' },
  { value: 'zero', label: 'Zero-based', hint: 'Zero = Success (e.g., Incidents)' },
];

const emptyGoal = (): Goal => ({
  id: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  thrust_area: '',
  title: '',
  description: '',
  uom_type: 'numeric_min',
  target_value: null,
  target_date: null,
  weightage: 10,
  is_shared: 0,
});

export default function GoalsPage() {
  const [sheet, setSheet] = useState<GoalSheet | null>(null);
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/goals');
      const data = await res.json();
      setActiveCycle(data.activeCycle);
      if (data.sheets && data.sheets.length > 0) {
        setSheet(data.sheets[0]);
        setGoals(data.sheets[0].goals || []);
      }
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const createSheet = async () => {
    if (!activeCycle) return;
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_sheet', cycleId: activeCycle.id }),
      });
      if (res.ok) {
        await fetchGoals();
        showToast('success', 'Goal sheet created!');
      }
    } catch { showToast('error', 'Failed to create goal sheet'); }
  };

  const addGoal = () => {
    if (goals.length >= 8) {
      showToast('error', 'Maximum 8 goals allowed');
      return;
    }
    setGoals([...goals, emptyGoal()]);
  };

  const updateGoal = (index: number, field: keyof Goal, value: string | number | null) => {
    const updated = [...goals];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[index] as any)[field] = value;
    setGoals(updated);
  };

  const removeGoal = (index: number) => {
    if (goals[index].is_shared) {
      showToast('error', 'Cannot remove shared goals');
      return;
    }
    setGoals(goals.filter((_, i) => i !== index));
  };

  const totalWeightage = goals.reduce((sum, g) => sum + (g.weightage || 0), 0);
  const isWeightageValid = totalWeightage === 100;
  const canEdit = sheet?.status === 'draft' || sheet?.status === 'returned';

  const saveGoals = async () => {
    if (!sheet) return;
    setSaving(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_goals', sheetId: sheet.id, goals }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error);
      } else {
        showToast('success', 'Goals saved as draft');
        await fetchGoals();
      }
    } catch { showToast('error', 'Failed to save'); }
    finally { setSaving(false); }
  };

  const submitGoals = async () => {
    if (!sheet) return;
    if (!isWeightageValid) {
      showToast('error', `Total weightage must be 100%. Currently: ${totalWeightage}%`);
      return;
    }
    if (goals.length === 0) {
      showToast('error', 'Add at least one goal before submitting');
      return;
    }
    // Validate all fields filled
    for (const g of goals) {
      if (!g.title.trim() || !g.thrust_area) {
        showToast('error', 'All goals must have a title and thrust area');
        return;
      }
    }

    setSaving(true);
    try {
      // First save
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_goals', sheetId: sheet.id, goals }),
      });

      // Then submit
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', sheetId: sheet.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error);
      } else {
        showToast('success', 'Goals submitted for approval!');
        await fetchGoals();
      }
    } catch { showToast('error', 'Failed to submit'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">My Goals</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {activeCycle?.name || 'No active cycle'} • {goals.length}/8 goals
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-3">
            <button onClick={saveGoals} disabled={saving} className="btn btn-secondary">
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button onClick={submitGoals} disabled={saving || !isWeightageValid} className="btn btn-primary">
              <Send className="w-4 h-4" /> Submit for Approval
            </button>
          </div>
        )}
      </div>

      {/* Return comment banner */}
      {sheet?.status === 'returned' && sheet.return_comment && (
        <div className="glass-card p-4 flex items-start gap-3" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
          <div>
            <p className="font-medium text-sm" style={{ color: '#ef4444' }}>Returned for Rework</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{sheet.return_comment}</p>
          </div>
        </div>
      )}

      {/* Locked banner */}
      {(sheet?.status === 'approved' || sheet?.status === 'locked') && (
        <div className="glass-card p-4 flex items-center gap-3" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
          <Lock className="w-5 h-5" style={{ color: '#10b981' }} />
          <p className="font-medium text-sm" style={{ color: '#10b981' }}>
            Goals are approved and locked. Contact your admin to request changes.
          </p>
        </div>
      )}

      {/* Submitted banner */}
      {sheet?.status === 'submitted' && (
        <div className="glass-card p-4 flex items-center gap-3" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
          <CheckCircle2 className="w-5 h-5" style={{ color: '#f59e0b' }} />
          <p className="font-medium text-sm" style={{ color: '#f59e0b' }}>
            Goals submitted and waiting for manager approval.
          </p>
        </div>
      )}

      {/* Weightage indicator */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Total Weightage</span>
          <span className={`text-lg font-bold ${isWeightageValid ? 'text-emerald-400' : totalWeightage > 100 ? 'text-red-400' : 'text-amber-400'}`}>
            {totalWeightage}%
          </span>
        </div>
        <div className="progress-bar h-3">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(totalWeightage, 100)}%`,
              background: isWeightageValid ? '#10b981' : totalWeightage > 100 ? '#ef4444' : '#f59e0b',
            }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          {isWeightageValid ? '✓ Weightage is valid' : `${100 - totalWeightage > 0 ? `${100 - totalWeightage}% remaining` : `${totalWeightage - 100}% over limit`}`}
        </p>
      </div>

      {/* AI Tools */}
      {sheet && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {canEdit && (
            <AIPanel
              type="suggest"
              context={{ department: 'Engineering', role: 'employee', existingGoals: goals.filter(g => g.title) }}
              onApply={(suggestion) => {
                if (goals.length >= 8) { showToast('error', 'Max 8 goals'); return; }
                const s = suggestion as Record<string, unknown>;
                setGoals([...goals, {
                  ...emptyGoal(),
                  thrust_area: s.thrust_area as string || '',
                  title: s.title as string || '',
                  description: s.description as string || '',
                  uom_type: s.uom_type as string || 'numeric_min',
                  target_value: s.target_value as number || null,
                  weightage: s.weightage as number || 10,
                }]);
                showToast('success', 'AI suggestion added!');
              }}
            />
          )}
          {goals.length > 0 && (
            <AIPanel
              type="analyze"
              context={{ goals: goals.filter(g => g.title) }}
            />
          )}
        </div>
      )}

      {/* No sheet - create one */}
      {!sheet && activeCycle && (
        <div className="glass-card p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">Start Your Goal Sheet</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Create a goal sheet for {activeCycle.name} to begin setting your objectives.
          </p>
          <button onClick={createSheet} className="btn btn-primary">Create Goal Sheet</button>
        </div>
      )}

      {/* Goals list */}
      {sheet && goals.map((goal, index) => (
        <div key={goal.id} className="glass-card p-5 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-1 rounded-md" style={{ background: 'var(--accent-glow)', color: 'var(--accent-secondary)' }}>
                Goal {index + 1}
              </span>
              {goal.is_shared ? (
                <span className="text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <Share2 className="w-3 h-3" /> Shared
                </span>
              ) : null}
            </div>
            {canEdit && !goal.is_shared && (
              <button onClick={() => removeGoal(index)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Thrust Area */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Thrust Area *</label>
              <select
                value={goal.thrust_area}
                onChange={(e) => updateGoal(index, 'thrust_area', e.target.value)}
                disabled={!canEdit || !!goal.is_shared}>
                <option value="">Select thrust area...</option>
                {THRUST_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
              </select>
            </div>

            {/* UoM Type */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Unit of Measurement *</label>
              <select
                value={goal.uom_type}
                onChange={(e) => updateGoal(index, 'uom_type', e.target.value)}
                disabled={!canEdit || !!goal.is_shared}>
                {UOM_TYPES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {UOM_TYPES.find(u => u.value === goal.uom_type)?.hint}
              </p>
            </div>

            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Goal Title *</label>
              <input
                type="text"
                value={goal.title}
                onChange={(e) => updateGoal(index, 'title', e.target.value)}
                placeholder="Enter goal title..."
                disabled={!canEdit || !!goal.is_shared}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
              <textarea
                value={goal.description}
                onChange={(e) => updateGoal(index, 'description', e.target.value)}
                placeholder="Describe the goal..."
                rows={2}
                disabled={!canEdit || !!goal.is_shared}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Target */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {goal.uom_type === 'timeline' ? 'Target Date *' : 'Target Value *'}
              </label>
              {goal.uom_type === 'timeline' ? (
                <input
                  type="date"
                  value={goal.target_date || ''}
                  onChange={(e) => updateGoal(index, 'target_date', e.target.value)}
                  disabled={!canEdit || !!goal.is_shared}
                />
              ) : goal.uom_type === 'zero' ? (
                <input
                  type="number"
                  value={0}
                  disabled={true}
                  style={{ opacity: 0.5 }}
                />
              ) : (
                <input
                  type="number"
                  value={goal.target_value ?? ''}
                  onChange={(e) => updateGoal(index, 'target_value', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Enter target..."
                  disabled={!canEdit || !!goal.is_shared}
                />
              )}
            </div>

            {/* Weightage */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Weightage (%) *</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={goal.weightage}
                  onChange={(e) => updateGoal(index, 'weightage', Math.max(10, parseInt(e.target.value) || 10))}
                  disabled={!canEdit}
                  style={{ width: '100px' }}
                />
                <span className="text-sm" style={{ color: goal.weightage < 10 ? '#ef4444' : 'var(--text-muted)' }}>
                  min 10%
                </span>
              </div>
            </div>
          </div>

          {/* UoM info */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
              {formatUomType(goal.uom_type)}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>•</span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Weight: {goal.weightage}%
            </span>
          </div>
        </div>
      ))}

      {/* Add goal button */}
      {canEdit && goals.length < 8 && sheet && (
        <button
          onClick={addGoal}
          className="w-full p-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-all hover:border-indigo-500/50"
          style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)', background: 'transparent', cursor: 'pointer' }}>
          <Plus className="w-4 h-4" />
          Add Goal ({goals.length}/8)
        </button>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
