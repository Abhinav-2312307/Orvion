'use client';

import { useEffect, useState } from 'react';
import { Users, Unlock } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  manager_name?: string;
  goalSheet: { id: string; status: string } | null;
}

export default function UsersPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/team').then(r => r.json()).then(d => { setTeam(d.team || []); setLoading(false); });
  }, []);

  const unlockSheet = async (sheetId: string) => {
    const res = await fetch('/api/goals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unlock', sheetId }),
    });
    if (res.ok) {
      setToast({ type: 'success', message: 'Goal sheet unlocked!' });
      const d = await fetch('/api/team').then(r => r.json());
      setTeam(d.team || []);
    } else {
      setToast({ type: 'error', message: 'Failed to unlock' });
    }
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage org hierarchy and goal sheet access</p>
      </div>

      <div className="glass-card overflow-hidden">
        <table>
          <thead>
            <tr><th>User</th><th>Email</th><th>Role</th><th>Department</th><th>Reports To</th><th>Sheet Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {team.map(member => {
              const status = member.goalSheet?.status || 'no_sheet';
              const colors: Record<string, string> = { approved: '#10b981', submitted: '#f59e0b', draft: '#888', returned: '#ef4444', no_sheet: '#555' };

              return (
                <tr key={member.id} className="animate-fade-in">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: member.role === 'manager' ? '#8b5cf6' : '#6366f1' }}>
                        {member.name.charAt(0)}
                      </div>
                      <span className="font-medium text-sm">{member.name}</span>
                    </div>
                  </td>
                  <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{member.email}</td>
                  <td><span className="badge capitalize text-xs" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}>{member.role}</span></td>
                  <td className="text-sm">{member.department}</td>
                  <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{member.manager_name || '-'}</td>
                  <td>
                    <span className="badge text-xs capitalize" style={{ background: `${colors[status]}15`, color: colors[status], borderColor: `${colors[status]}30` }}>
                      {status === 'no_sheet' ? 'Not Started' : status}
                    </span>
                  </td>
                  <td>
                    {(member.goalSheet?.status === 'approved' || member.goalSheet?.status === 'locked') && (
                      <button onClick={() => unlockSheet(member.goalSheet!.id)} className="btn btn-secondary flex items-center gap-1" style={{ padding: '4px 10px', fontSize: '11px' }}>
                        <Unlock className="w-3 h-3" /> Unlock
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
