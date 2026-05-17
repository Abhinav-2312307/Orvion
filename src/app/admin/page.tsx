'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Target, BarChart3, Shield, Settings, Download, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, sheets: 0, approved: 0, submitted: 0, draft: 0, cycles: 0, auditLogs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/team').then(r => r.json()),
      fetch('/api/cycles').then(r => r.json()),
      fetch('/api/audit').then(r => r.json()),
    ]).then(([teamData, cyclesData, auditData]) => {
      const team = teamData.team || [];
      const approved = team.filter((m: Record<string, unknown>) => (m.goalSheet as Record<string, unknown>)?.status === 'approved').length;
      const submitted = team.filter((m: Record<string, unknown>) => (m.goalSheet as Record<string, unknown>)?.status === 'submitted').length;
      const draft = team.filter((m: Record<string, unknown>) => (m.goalSheet as Record<string, unknown>)?.status === 'draft' || !(m.goalSheet as Record<string, unknown>)).length;
      setStats({
        users: team.length,
        sheets: team.filter((m: Record<string, unknown>) => m.goalSheet).length,
        approved,
        submitted,
        draft,
        cycles: (cyclesData.cycles || []).length,
        auditLogs: auditData.total || 0,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  }

  const cards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: '#6366f1', href: '/admin/users' },
    { label: 'Goal Sheets', value: stats.sheets, icon: Target, color: '#8b5cf6', href: '/admin/reports' },
    { label: 'Pending Approval', value: stats.submitted, icon: TrendingUp, color: '#f59e0b', href: '/admin/reports' },
    { label: 'Approved', value: stats.approved, icon: BarChart3, color: '#10b981', href: '/admin/reports' },
    { label: 'Goal Cycles', value: stats.cycles, icon: Settings, color: '#3b82f6', href: '/admin/cycles' },
    { label: 'Audit Entries', value: stats.auditLogs, icon: Shield, color: '#ef4444', href: '/admin/audit' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Organization-wide goal management overview</p>
        </div>
        <Link href="/admin/reports" className="btn btn-primary">
          <Download className="w-4 h-4" /> Export Reports
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <Link key={i} href={card.href} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 80}ms`, textDecoration: 'none', color: 'inherit' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{card.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${card.color}15` }}>
                <card.icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: card.color }}>{card.value}</p>
          </Link>
        ))}
      </div>

      {/* Completion overview */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Goal Sheet Completion</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Draft / Not Started', value: stats.draft, color: '#888', pct: stats.users ? Math.round((stats.draft / stats.users) * 100) : 0 },
            { label: 'Submitted (Pending)', value: stats.submitted, color: '#f59e0b', pct: stats.users ? Math.round((stats.submitted / stats.users) * 100) : 0 },
            { label: 'Approved', value: stats.approved, color: '#10b981', pct: stats.users ? Math.round((stats.approved / stats.users) * 100) : 0 },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: item.color }}>{item.value}</div>
              <div className="progress-bar mb-2">
                <div className="progress-fill" style={{ width: `${item.pct}%`, background: item.color }} />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label} ({item.pct}%)</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
