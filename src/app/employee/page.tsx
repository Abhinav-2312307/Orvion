'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Target, TrendingUp, Clock, CheckCircle2, AlertCircle, ArrowRight, FileText, Sparkles } from 'lucide-react';
import AIPanel from '@/components/AIPanel';

interface GoalSheet {
  id: string;
  status: string;
  cycle_name?: string;
  year?: number;
  goals: Goal[];
}

interface Goal {
  id: string;
  title: string;
  thrust_area: string;
  weightage: number;
  uom_type: string;
  target_value: number;
  achievements: Achievement[];
}

interface Achievement {
  quarter: string;
  actual_value: number;
  progress_score: number;
  status: string;
}

export default function EmployeeDashboard() {
  const [sheets, setSheets] = useState<GoalSheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then(d => { setSheets(d.sheets || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const activeSheet = sheets[0];
  const totalGoals = activeSheet?.goals?.length || 0;
  const avgScore = activeSheet?.goals?.length
    ? Math.round(
        activeSheet.goals.reduce((sum, g) => {
          const latestAch = g.achievements?.[g.achievements.length - 1];
          return sum + (latestAch?.progress_score || 0);
        }, 0) / activeSheet.goals.length
      )
    : 0;
  const completedGoals = activeSheet?.goals?.filter(g => g.achievements?.some(a => a.status === 'completed')).length || 0;

  const statusConfig: Record<string, { color: string; bg: string; label: string; icon: React.ElementType }> = {
    draft: { color: '#888', bg: 'rgba(136,136,136,0.1)', label: 'Draft', icon: FileText },
    submitted: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Pending Approval', icon: Clock },
    approved: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Approved', icon: CheckCircle2 },
    returned: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Returned for Rework', icon: AlertCircle },
    locked: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Locked', icon: CheckCircle2 },
  };

  const sheetStatus = statusConfig[activeSheet?.status || 'draft'] || statusConfig.draft;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Employee Dashboard</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Track your goals and quarterly progress
          </p>
        </div>
        <Link href="/employee/goals" className="btn btn-primary">
          <Target className="w-4 h-4" />
          My Goals
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Status Banner */}
      {activeSheet && (
        <div className="glass-card p-5 flex items-center gap-4" style={{ borderColor: `${sheetStatus.color}40` }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: sheetStatus.bg }}>
            <sheetStatus.icon className="w-6 h-6" style={{ color: sheetStatus.color }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{activeSheet.cycle_name || 'Current Cycle'}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Goal Sheet Status: <span style={{ color: sheetStatus.color }} className="font-medium">{sheetStatus.label}</span>
            </p>
          </div>
          {activeSheet.status === 'returned' && activeSheet && (
            <div className="text-sm max-w-md" style={{ color: '#ef4444' }}>
              <p className="font-medium">Manager Feedback:</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Please review and resubmit your goals.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Goals', value: totalGoals, max: 8, icon: Target, color: '#6366f1', desc: `out of 8 max` },
          { label: 'Avg Progress', value: `${avgScore}%`, icon: TrendingUp, color: avgScore >= 70 ? '#10b981' : '#f59e0b', desc: 'across all goals' },
          { label: 'Completed', value: completedGoals, icon: CheckCircle2, color: '#10b981', desc: `of ${totalGoals} goals` },
          { label: 'Sheet Status', value: sheetStatus.label, icon: sheetStatus.icon, color: sheetStatus.color, desc: activeSheet?.cycle_name || '-' },
        ].map((stat, i) => (
          <div key={i} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                {stat.label}
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Goals Overview */}
      {activeSheet?.goals && activeSheet.goals.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-primary)' }}>
            <h3 className="font-semibold">Goal Progress Overview</h3>
            <Link href="/employee/achievements" className="text-sm font-medium" style={{ color: 'var(--accent-secondary)' }}>
              Log Achievements →
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(42,42,58,0.5)' }}>
            {activeSheet.goals.map((goal, i) => {
              const latestAch = goal.achievements?.[goal.achievements.length - 1];
              const score = latestAch?.progress_score || 0;
              const scoreColor = score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : score > 0 ? '#ef4444' : '#555';

              return (
                <div key={goal.id} className="p-4 flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${i * 50}ms`, borderBottom: '1px solid rgba(42,42,58,0.3)' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ background: 'var(--accent-glow)', color: 'var(--accent-secondary)' }}>
                    {goal.weightage}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{goal.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{goal.thrust_area}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min(score, 100)}%`, background: scoreColor }} />
                      </div>
                    </div>
                    <span className="text-sm font-semibold w-12 text-right" style={{ color: scoreColor }}>
                      {score}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {activeSheet?.goals && activeSheet.goals.length > 0 && activeSheet.status === 'approved' && (
        <AIPanel
          type="insights"
          context={{ employeeName: 'Employee', goals: activeSheet.goals }}
        />
      )}

      {/* Empty state */}
      {(!activeSheet || !activeSheet.goals || activeSheet.goals.length === 0) && (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--accent-glow)' }}>
            <Target className="w-8 h-8" style={{ color: 'var(--accent-secondary)' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Goals Yet</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Start by creating your goal sheet for the current cycle.
          </p>
          <Link href="/employee/goals" className="btn btn-primary">
            Create Goal Sheet
          </Link>
        </div>
      )}
    </div>
  );
}
