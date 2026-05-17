'use client';

import { useEffect, useState } from 'react';
import { Users, TrendingUp } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: string;
  goalSheet: { id: string; status: string; goal_count: number; total_weightage: number } | null;
  achievements: { quarter: string; avg_score: number; entries: number }[];
  checkins: { quarter: string; is_completed: number }[];
}

export default function TeamGoalsPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [memberGoals, setMemberGoals] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch('/api/team').then(r => r.json()).then(d => { setTeam(d.team || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const viewMemberGoals = async (memberId: string) => {
    setSelectedMember(memberId);
    const res = await fetch(`/api/goals?employeeId=${memberId}`);
    const data = await res.json();
    setMemberGoals(data.sheets?.[0] || null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  }

  const selectedMemberData = team.find(m => m.id === selectedMember);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Team Goals</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{team.length} team members</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team list */}
        <div className="glass-card overflow-hidden">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
            <h3 className="font-semibold text-sm">Team Members</h3>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(42,42,58,0.3)' }}>
            {team.map(member => {
              const status = member.goalSheet?.status || 'no_sheet';
              const colors: Record<string, string> = { approved: '#10b981', submitted: '#f59e0b', draft: '#888', returned: '#ef4444', no_sheet: '#555' };
              const isSelected = selectedMember === member.id;

              return (
                <button
                  key={member.id}
                  onClick={() => viewMemberGoals(member.id)}
                  className="w-full p-4 flex items-center gap-3 text-left transition-all"
                  style={{
                    background: isSelected ? 'var(--accent-glow)' : 'transparent',
                    border: 'none', cursor: 'pointer', color: 'inherit',
                    borderBottom: '1px solid rgba(42,42,58,0.3)',
                  }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: '#6366f1' }}>
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{member.department}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full" style={{ background: colors[status] }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Goal details */}
        <div className="lg:col-span-2">
          {!selectedMember && (
            <div className="glass-card p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Select a team member to view their goals</p>
            </div>
          )}

          {selectedMember && memberGoals && (
            <div className="space-y-4">
              {/* Member header */}
              <div className="glass-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white" style={{ background: '#6366f1' }}>
                  {selectedMemberData?.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{selectedMemberData?.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {selectedMemberData?.department} • {(memberGoals as { goals?: unknown[] }).goals?.length || 0} goals • Status: {(memberGoals as { status?: string }).status || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Goals */}
              {((memberGoals as { goals?: Record<string, unknown>[] }).goals || []).map((goal: Record<string, unknown>, i: number) => {
                const achievements = (goal.achievements as Record<string, unknown>[]) || [];
                const latestAch = achievements[achievements.length - 1];
                const score = (latestAch?.progress_score as number) || 0;
                const scoreColor = score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : score > 0 ? '#ef4444' : '#555';

                return (
                  <div key={goal.id as string} className="glass-card p-4 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'var(--accent-glow)', color: 'var(--accent-secondary)' }}>
                            {goal.weightage as number}%
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{goal.thrust_area as string}</span>
                        </div>
                        <p className="font-medium text-sm">{goal.title as string}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold" style={{ color: scoreColor }}>{score}%</div>
                      </div>
                    </div>
                    <div className="progress-bar mt-3 h-2">
                      <div className="progress-fill" style={{ width: `${Math.min(score, 100)}%`, background: scoreColor }} />
                    </div>
                    {/* Quarter scores */}
                    {achievements.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {achievements.map((a: Record<string, unknown>) => (
                          <span key={a.quarter as string} className="text-[11px] px-2 py-0.5 rounded" style={{ background: `${scoreColor}15`, color: scoreColor }}>
                            {a.quarter as string}: {a.progress_score as number}%
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {selectedMember && !memberGoals && (
            <div className="glass-card p-12 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No goal sheet created yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
