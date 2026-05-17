'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Edit3, MessageSquare } from 'lucide-react';
import { formatUomType } from '@/lib/utils';

interface Goal {
  id: string;
  title: string;
  thrust_area: string;
  description: string;
  uom_type: string;
  target_value: number | null;
  target_date: string | null;
  weightage: number;
  is_shared: number;
}

interface Sheet {
  id: string;
  status: string;
  employee_name: string;
  employee_email: string;
  department: string;
  submitted_at: string;
  goals: Goal[];
}

interface TeamMember {
  id: string;
  name: string;
  goalSheet: { id: string; status: string } | null;
}

export default function ApprovalsPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [pendingSheets, setPendingSheets] = useState<Sheet[]>([]);
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null);
  const [editingGoals, setEditingGoals] = useState<Record<string, Goal[]>>({});
  const [returnComment, setReturnComment] = useState('');
  const [showReturnModal, setShowReturnModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const teamRes = await fetch('/api/team');
      const teamData = await teamRes.json();
      setTeam(teamData.team || []);

      // Fetch goals for each submitted team member
      const submitted = (teamData.team || []).filter((m: TeamMember) => m.goalSheet?.status === 'submitted');
      const sheets: Sheet[] = [];

      for (const member of submitted) {
        const goalsRes = await fetch(`/api/goals?employeeId=${member.id}`);
        const goalsData = await goalsRes.json();
        if (goalsData.sheets?.[0]) {
          sheets.push({
            ...goalsData.sheets[0],
            employee_name: member.name,
            employee_email: (member as Record<string, unknown>).email as string,
            department: (member as Record<string, unknown>).department as string,
          });
        }
      }

      setPendingSheets(sheets);
      if (sheets.length > 0) setExpandedSheet(sheets[0].id);
    } catch { console.error('Failed to fetch'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const startEditing = (sheetId: string, goals: Goal[]) => {
    setEditingGoals({ ...editingGoals, [sheetId]: JSON.parse(JSON.stringify(goals)) });
  };

  const updateEditGoal = (sheetId: string, goalId: string, field: 'target_value' | 'weightage', value: number) => {
    const goals = editingGoals[sheetId] || [];
    const updated = goals.map(g => g.id === goalId ? { ...g, [field]: value } : g);
    setEditingGoals({ ...editingGoals, [sheetId]: updated });
  };

  const approveSheet = async (sheetId: string) => {
    const goalsToSend = editingGoals[sheetId];
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          sheetId,
          goals: goalsToSend?.map(g => ({ id: g.id, target_value: g.target_value, weightage: g.weightage })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast('error', data.error); return; }
      showToast('success', 'Goals approved successfully!');
      await fetchData();
    } catch { showToast('error', 'Failed to approve'); }
  };

  const returnSheet = async (sheetId: string) => {
    if (!returnComment.trim()) { showToast('error', 'Please add a comment'); return; }
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'return', sheetId, comment: returnComment }),
      });
      const data = await res.json();
      if (!res.ok) { showToast('error', data.error); return; }
      showToast('success', 'Goals returned for rework');
      setShowReturnModal(null);
      setReturnComment('');
      await fetchData();
    } catch { showToast('error', 'Failed to return'); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold">Goal Approvals</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {pendingSheets.length} pending approval{pendingSheets.length !== 1 ? 's' : ''}
        </p>
      </div>

      {pendingSheets.length === 0 && (
        <div className="glass-card p-12 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#10b981' }} />
          <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No pending goal approvals.</p>
        </div>
      )}

      {pendingSheets.map(sheet => {
        const isExpanded = expandedSheet === sheet.id;
        const isEditing = !!editingGoals[sheet.id];
        const displayGoals = isEditing ? editingGoals[sheet.id] : sheet.goals;
        const totalWeightage = displayGoals.reduce((sum, g) => sum + g.weightage, 0);

        return (
          <div key={sheet.id} className="glass-card overflow-hidden animate-fade-in">
            {/* Header */}
            <button
              onClick={() => setExpandedSheet(isExpanded ? null : sheet.id)}
              className="w-full p-5 flex items-center justify-between text-left"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: '#8b5cf6' }}>
                  {sheet.employee_name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{sheet.employee_name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sheet.department} • {sheet.goals.length} goals • Submitted: {new Date(sheet.submitted_at).toLocaleDateString()}</p>
                </div>
              </div>
              {isExpanded ? <ChevronUp className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /> : <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />}
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid var(--border-primary)' }}>
                {/* Action bar */}
                <div className="p-4 flex items-center justify-between flex-wrap gap-3" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Weightage:</span>
                    <span className={`text-sm font-bold ${totalWeightage === 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {totalWeightage}%
                    </span>
                    {!isEditing && (
                      <button onClick={() => startEditing(sheet.id, sheet.goals)} className="btn btn-secondary ml-2" style={{ padding: '4px 10px', fontSize: '12px' }}>
                        <Edit3 className="w-3 h-3" /> Inline Edit
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowReturnModal(sheet.id)} className="btn btn-danger" style={{ padding: '8px 16px' }}>
                      <XCircle className="w-4 h-4" /> Return for Rework
                    </button>
                    <button onClick={() => approveSheet(sheet.id)} className="btn btn-success" style={{ padding: '8px 16px' }} disabled={totalWeightage !== 100}>
                      <CheckCircle2 className="w-4 h-4" /> Approve All
                    </button>
                  </div>
                </div>

                {/* Goals table */}
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Goal</th>
                      <th>Thrust Area</th>
                      <th>UoM</th>
                      <th>Target</th>
                      <th>Weightage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayGoals.map((goal, i) => (
                      <tr key={goal.id}>
                        <td className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td>
                          <p className="font-medium text-sm">{goal.title}</p>
                          {goal.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{goal.description}</p>}
                        </td>
                        <td className="text-sm">{goal.thrust_area}</td>
                        <td><span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>{formatUomType(goal.uom_type)}</span></td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              value={goal.target_value ?? ''}
                              onChange={(e) => updateEditGoal(sheet.id, goal.id, 'target_value', parseFloat(e.target.value) || 0)}
                              style={{ width: '100px', padding: '6px 10px', fontSize: '13px' }}
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {goal.uom_type === 'timeline' ? goal.target_date : goal.target_value}
                            </span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              min={10}
                              max={100}
                              value={goal.weightage}
                              onChange={(e) => updateEditGoal(sheet.id, goal.id, 'weightage', Math.max(10, parseInt(e.target.value) || 10))}
                              style={{ width: '70px', padding: '6px 10px', fontSize: '13px' }}
                            />
                          ) : (
                            <span className="text-sm font-bold" style={{ color: 'var(--accent-secondary)' }}>{goal.weightage}%</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="modal-overlay" onClick={() => setShowReturnModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5" style={{ color: '#ef4444' }} />
              <h3 className="text-lg font-semibold">Return for Rework</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Provide feedback to the employee about what needs to be changed.
            </p>
            <textarea
              value={returnComment}
              onChange={(e) => setReturnComment(e.target.value)}
              placeholder="Enter your feedback..."
              rows={4}
              style={{ resize: 'vertical' }}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowReturnModal(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={() => returnSheet(showReturnModal)} className="btn btn-danger">
                <XCircle className="w-4 h-4" /> Return
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
