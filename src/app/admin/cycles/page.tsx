'use client';

import { useEffect, useState } from 'react';
import { Plus, Calendar } from 'lucide-react';

interface Cycle {
  id: string;
  name: string;
  year: number;
  status: string;
  goal_window_start: string;
  goal_window_end: string;
  q1_start: string; q1_end: string;
  q2_start: string; q2_end: string;
  q3_start: string; q3_end: string;
  q4_start: string; q4_end: string;
}

export default function CyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '', year: new Date().getFullYear(),
    goalWindowStart: '', goalWindowEnd: '',
    q1Start: '', q1End: '', q2Start: '', q2End: '', q3Start: '', q3End: '', q4Start: '', q4End: '',
  });
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/cycles').then(r => r.json()).then(d => { setCycles(d.cycles || []); setLoading(false); });
  }, []);

  const createCycle = async () => {
    const res = await fetch('/api/cycles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...form }),
    });
    if (res.ok) {
      setToast({ type: 'success', message: 'Cycle created!' });
      setShowCreate(false);
      const d = await fetch('/api/cycles').then(r => r.json());
      setCycles(d.cycles || []);
    }
    setTimeout(() => setToast(null), 3000);
  };

  const toggleStatus = async (cycleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    await fetch('/api/cycles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', cycleId, status: newStatus }),
    });
    const d = await fetch('/api/cycles').then(r => r.json());
    setCycles(d.cycles || []);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Goal Cycles</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Configure quarterly windows and cycle management</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary"><Plus className="w-4 h-4" /> New Cycle</button>
      </div>

      {cycles.map(cycle => (
        <div key={cycle.id} className="glass-card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
              <div>
                <h3 className="font-semibold">{cycle.name}</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Year: {cycle.year}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge" style={{
                background: cycle.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(136,136,136,0.15)',
                color: cycle.status === 'active' ? '#10b981' : '#888',
                borderColor: cycle.status === 'active' ? 'rgba(16,185,129,0.3)' : 'rgba(136,136,136,0.3)',
              }}>
                {cycle.status}
              </span>
              <button onClick={() => toggleStatus(cycle.id, cycle.status)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>
                {cycle.status === 'active' ? 'Close' : 'Activate'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            {[
              { label: 'Goal Setting', start: cycle.goal_window_start, end: cycle.goal_window_end },
              { label: 'Q1', start: cycle.q1_start, end: cycle.q1_end },
              { label: 'Q2', start: cycle.q2_start, end: cycle.q2_end },
              { label: 'Q3', start: cycle.q3_start, end: cycle.q3_end },
              { label: 'Q4', start: cycle.q4_start, end: cycle.q4_end },
            ].map(w => (
              <div key={w.label} className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <p className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{w.label}</p>
                <p style={{ color: 'var(--text-muted)' }}>{w.start || '-'}</p>
                <p style={{ color: 'var(--text-muted)' }}>{w.end || '-'}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <h3 className="text-lg font-semibold mb-4">Create Goal Cycle</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Cycle Name</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="FY 2026-27" /></div>
                <div><label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Year</label><input type="number" value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })} /></div>
              </div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Goal Setting Window</p>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Opens</label><input type="date" value={form.goalWindowStart} onChange={e => setForm({ ...form, goalWindowStart: e.target.value })} /></div>
                <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Closes</label><input type="date" value={form.goalWindowEnd} onChange={e => setForm({ ...form, goalWindowEnd: e.target.value })} /></div>
              </div>
              {(['q1', 'q2', 'q3', 'q4'] as const).map(q => (
                <div key={q}>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{q.toUpperCase()} Check-in Window</p>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" value={form[`${q}Start`]} onChange={e => setForm({ ...form, [`${q}Start`]: e.target.value })} />
                    <input type="date" value={form[`${q}End`]} onChange={e => setForm({ ...form, [`${q}End`]: e.target.value })} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={createCycle} className="btn btn-primary">Create Cycle</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
