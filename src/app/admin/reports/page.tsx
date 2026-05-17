'use client';

import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';

interface ReportRow {
  employee_name: string;
  email: string;
  department: string;
  cycle_name: string;
  sheet_status: string;
  thrust_area: string;
  goal_title: string;
  uom_type: string;
  target_value: number;
  weightage: number;
  quarter: string;
  actual_value: number;
  achievement_status: string;
  progress_score: number;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports').then(r => r.json()).then(d => { setData(d.data || []); setLoading(false); });
  }, []);

  const exportCSV = () => {
    const headers = ['Employee', 'Email', 'Department', 'Cycle', 'Thrust Area', 'Goal', 'UoM', 'Target', 'Weightage', 'Quarter', 'Actual', 'Status', 'Score'];
    const rows = data.map(r => [
      r.employee_name, r.email, r.department, r.cycle_name, r.thrust_area,
      r.goal_title, r.uom_type, r.target_value, r.weightage, r.quarter || '',
      r.actual_value || '', r.achievement_status || '', r.progress_score || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orvion_achievement_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Achievement Reports</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Planned vs. Actual for all employees</p>
        </div>
        <button onClick={exportCSV} className="btn btn-primary">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="glass-card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Employee</th><th>Department</th><th>Goal</th><th>UoM</th>
              <th>Target</th><th>Weightage</th><th>Quarter</th><th>Actual</th>
              <th>Status</th><th>Score</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const score = row.progress_score || 0;
              const scoreColor = score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : score > 0 ? '#ef4444' : '#555';
              return (
                <tr key={i} className="animate-fade-in" style={{ animationDelay: `${Math.min(i, 20) * 30}ms` }}>
                  <td className="text-sm font-medium">{row.employee_name}</td>
                  <td className="text-sm">{row.department}</td>
                  <td>
                    <p className="text-sm font-medium">{row.goal_title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.thrust_area}</p>
                  </td>
                  <td className="text-xs">{row.uom_type}</td>
                  <td className="text-sm font-medium">{row.target_value ?? '-'}</td>
                  <td className="text-sm font-bold" style={{ color: 'var(--accent-secondary)' }}>{row.weightage}%</td>
                  <td className="text-sm">{row.quarter || '-'}</td>
                  <td className="text-sm font-medium" style={{ color: scoreColor }}>{row.actual_value ?? '-'}</td>
                  <td>
                    {row.achievement_status && (
                      <span className="badge text-xs capitalize" style={{
                        background: row.achievement_status === 'completed' ? 'rgba(16,185,129,0.15)' : row.achievement_status === 'on_track' ? 'rgba(59,130,246,0.15)' : 'rgba(136,136,136,0.15)',
                        color: row.achievement_status === 'completed' ? '#10b981' : row.achievement_status === 'on_track' ? '#3b82f6' : '#888',
                        borderColor: 'transparent',
                      }}>
                        {row.achievement_status?.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="text-sm font-bold" style={{ color: scoreColor }}>{score ? `${score}%` : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="p-12 text-center">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No data available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
