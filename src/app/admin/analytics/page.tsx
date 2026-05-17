'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Target } from 'lucide-react';

interface ReportRow {
  employee_name: string;
  department: string;
  thrust_area: string;
  uom_type: string;
  weightage: number;
  quarter: string;
  progress_score: number;
  achievement_status: string;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports').then(r => r.json()).then(d => { setData(d.data || []); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  // Compute analytics
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const withQuarter = data.filter(d => d.quarter);

  // QoQ trends
  const qoqData = quarters.map(q => {
    const qData = withQuarter.filter(d => d.quarter === q);
    const avgScore = qData.length > 0 ? Math.round(qData.reduce((s, d) => s + (d.progress_score || 0), 0) / qData.length) : 0;
    return { quarter: q, avgScore, count: qData.length };
  });

  // Department breakdown
  const departments = [...new Set(data.map(d => d.department))];
  const deptData = departments.map(dept => {
    const deptRows = withQuarter.filter(d => d.department === dept);
    const avgScore = deptRows.length > 0 ? Math.round(deptRows.reduce((s, d) => s + (d.progress_score || 0), 0) / deptRows.length) : 0;
    return { department: dept, avgScore, count: deptRows.length };
  });

  // Thrust area distribution
  const thrustAreas = [...new Set(data.map(d => d.thrust_area))];
  const thrustData = thrustAreas.map(area => {
    const areaRows = data.filter(d => d.thrust_area === area);
    return { area, count: areaRows.length, totalWeight: areaRows.reduce((s, d) => s + d.weightage, 0) };
  }).sort((a, b) => b.count - a.count);

  // UoM distribution
  const uomTypes = [...new Set(data.map(d => d.uom_type))];
  const uomData = uomTypes.map(uom => ({
    uom,
    count: data.filter(d => d.uom_type === uom).length,
  })).sort((a, b) => b.count - a.count);

  // Status distribution
  const statuses = ['completed', 'on_track', 'not_started'];
  const statusData = statuses.map(s => ({
    status: s,
    count: withQuarter.filter(d => d.achievement_status === s).length,
  }));

  // Employee leaderboard
  const employees = [...new Set(data.map(d => d.employee_name))];
  const leaderboard = employees.map(emp => {
    const empRows = withQuarter.filter(d => d.employee_name === emp);
    const avgScore = empRows.length > 0 ? Math.round(empRows.reduce((s, d) => s + (d.progress_score || 0), 0) / empRows.length) : 0;
    return { name: emp, avgScore, goalCount: new Set(empRows.map(d => d.thrust_area + d.quarter)).size };
  }).sort((a, b) => b.avgScore - a.avgScore);

  const maxBarValue = Math.max(...qoqData.map(d => d.avgScore), 1);
  const statusColors: Record<string, string> = { completed: '#10b981', on_track: '#3b82f6', not_started: '#888' };
  const uomColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Organization-wide goal performance insights</p>
      </div>

      {/* QoQ Trend Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
          <h3 className="font-semibold">Quarter-on-Quarter Achievement Trends</h3>
        </div>
        <div className="flex items-end gap-4 h-48">
          {qoqData.map((d, i) => {
            const height = maxBarValue > 0 ? (d.avgScore / maxBarValue) * 100 : 0;
            const color = d.avgScore >= 80 ? '#10b981' : d.avgScore >= 60 ? '#f59e0b' : d.avgScore > 0 ? '#ef4444' : '#333';
            return (
              <div key={d.quarter} className="flex-1 flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <span className="text-sm font-bold" style={{ color }}>{d.avgScore > 0 ? `${d.avgScore}%` : '-'}</span>
                <div className="w-full rounded-t-lg transition-all duration-700" style={{ height: `${Math.max(height, 4)}%`, background: `linear-gradient(180deg, ${color}, ${color}60)`, minHeight: '8px' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{d.quarter}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{d.count} entries</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Heatmap */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
            <h3 className="font-semibold">Department Performance</h3>
          </div>
          <div className="space-y-3">
            {deptData.map((d, i) => {
              const color = d.avgScore >= 80 ? '#10b981' : d.avgScore >= 60 ? '#f59e0b' : '#ef4444';
              return (
                <div key={d.department} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{d.department}</span>
                    <span className="text-sm font-bold" style={{ color }}>{d.avgScore}%</span>
                  </div>
                  <div className="progress-bar h-3">
                    <div className="progress-fill" style={{ width: `${d.avgScore}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
                  </div>
                </div>
              );
            })}
            {deptData.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data</p>}
          </div>
        </div>

        {/* Goal Status Distribution */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
            <h3 className="font-semibold">Goal Status Distribution</h3>
          </div>
          <div className="flex items-center gap-4 mb-6">
            {statusData.map(s => {
              const total = statusData.reduce((sum, sd) => sum + sd.count, 0);
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
              return (
                <div key={s.status} className="flex-1 text-center p-4 rounded-xl" style={{ background: `${statusColors[s.status]}10` }}>
                  <div className="text-2xl font-bold mb-1" style={{ color: statusColors[s.status] }}>{s.count}</div>
                  <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{s.status.replace('_', ' ')}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{pct}%</p>
                </div>
              );
            })}
          </div>
          {/* Stacked bar */}
          <div className="flex rounded-lg overflow-hidden h-4">
            {statusData.map(s => {
              const total = statusData.reduce((sum, sd) => sum + sd.count, 0);
              const pct = total > 0 ? (s.count / total) * 100 : 0;
              return <div key={s.status} style={{ width: `${pct}%`, background: statusColors[s.status] }} />;
            })}
          </div>
        </div>

        {/* Thrust Area Distribution */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
            <h3 className="font-semibold">Goal Distribution by Thrust Area</h3>
          </div>
          <div className="space-y-2">
            {thrustData.slice(0, 8).map((d, i) => (
              <div key={d.area} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="w-3 h-3 rounded-full" style={{ background: uomColors[i % uomColors.length] }} />
                <span className="flex-1 text-sm">{d.area}</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Employee Leaderboard */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
            <h3 className="font-semibold">Employee Performance</h3>
          </div>
          <div className="space-y-3">
            {leaderboard.map((emp, i) => {
              const color = emp.avgScore >= 80 ? '#10b981' : emp.avgScore >= 60 ? '#f59e0b' : '#ef4444';
              return (
                <div key={emp.name} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{
                    background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : i === 1 ? 'linear-gradient(135deg, #9ca3af, #6b7280)' : i === 2 ? 'linear-gradient(135deg, #b45309, #92400e)' : 'var(--bg-secondary)',
                    color: i < 3 ? 'white' : 'var(--text-muted)',
                  }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{emp.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold" style={{ color }}>{emp.avgScore}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
