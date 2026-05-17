'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, CheckSquare, ClipboardList, TrendingUp, ArrowRight, AlertCircle } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: string;
  goalSheet: { id: string; status: string; goal_count: number } | null;
  achievements: { quarter: string; avg_score: number }[];
  checkins: { quarter: string; is_completed: number }[];
}

export default function ManagerDashboard() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/team')
      .then(r => r.json())
      .then(d => { setTeam(d.team || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  }

  const pendingApprovals = team.filter(m => m.goalSheet?.status === 'submitted').length;
  const approvedCount = team.filter(m => m.goalSheet?.status === 'approved').length;
  const avgTeamScore = team.length > 0
    ? Math.round(team.reduce((sum, m) => {
        const latest = m.achievements?.[m.achievements.length - 1];
        return sum + (latest?.avg_score || 0);
      }, 0) / team.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manager Dashboard</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Overview of your team&apos;s goal progress</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Team Members', value: team.length, icon: Users, color: '#6366f1' },
          { label: 'Pending Approvals', value: pendingApprovals, icon: AlertCircle, color: pendingApprovals > 0 ? '#f59e0b' : '#10b981' },
          { label: 'Goals Approved', value: approvedCount, icon: CheckSquare, color: '#10b981' },
          { label: 'Team Avg Score', value: `${avgTeamScore}%`, icon: TrendingUp, color: avgTeamScore >= 70 ? '#10b981' : '#f59e0b' },
        ].map((stat, i) => (
          <div key={i} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{stat.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {pendingApprovals > 0 && (
        <Link href="/manager/approvals" className="glass-card p-4 flex items-center gap-4 group" style={{ borderColor: 'rgba(245,158,11,0.3)', cursor: 'pointer', textDecoration: 'none' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <AlertCircle className="w-5 h-5" style={{ color: '#f59e0b' }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{pendingApprovals} goal sheet{pendingApprovals > 1 ? 's' : ''} waiting for approval</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Review and approve submitted goals</p>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-muted)' }} />
        </Link>
      )}

      {/* Team Overview */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <h3 className="font-semibold">Team Overview</h3>
          <Link href="/manager/team" className="text-sm font-medium" style={{ color: 'var(--accent-secondary)' }}>View All →</Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Sheet Status</th>
              <th>Goals</th>
              <th>Latest Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {team.map((member, i) => {
              const status = member.goalSheet?.status || 'no_sheet';
              const statusColors: Record<string, string> = {
                draft: '#888', submitted: '#f59e0b', approved: '#10b981', returned: '#ef4444', no_sheet: '#555'
              };
              const latestScore = member.achievements?.[member.achievements.length - 1]?.avg_score;

              return (
                <tr key={member.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: '#6366f1' }}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm">{member.department}</td>
                  <td>
                    <span className="badge capitalize" style={{ background: `${statusColors[status]}15`, color: statusColors[status], borderColor: `${statusColors[status]}30` }}>
                      {status === 'no_sheet' ? 'Not Started' : status}
                    </span>
                  </td>
                  <td className="text-sm">{member.goalSheet?.goal_count || 0}</td>
                  <td>
                    {latestScore !== undefined ? (
                      <span className="font-semibold text-sm" style={{ color: latestScore >= 70 ? '#10b981' : '#f59e0b' }}>
                        {Math.round(latestScore)}%
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td>
                    {status === 'submitted' && (
                      <Link href="/manager/approvals" className="text-xs font-medium" style={{ color: 'var(--accent-secondary)' }}>Review</Link>
                    )}
                    {status === 'approved' && (
                      <Link href={`/manager/checkins?employee=${member.id}`} className="text-xs font-medium" style={{ color: 'var(--accent-secondary)' }}>Check-in</Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
