'use client';

import { useEffect, useState } from 'react';
import { Share2, Send, Users } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  department: string;
}

const THRUST_AREAS = ['Revenue Growth', 'Customer Success', 'Product Delivery', 'Operational Excellence', 'Team Development', 'Brand Awareness', 'Lead Generation', 'Content Strategy', 'Cost Optimization', 'Innovation'];
const UOM_TYPES = [
  { value: 'numeric_min', label: 'Numeric (Higher is better)' },
  { value: 'numeric_max', label: 'Numeric (Lower is better)' },
  { value: 'percentage_min', label: '% (Higher is better)' },
  { value: 'percentage_max', label: '% (Lower is better)' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'zero', label: 'Zero-based' },
];

export default function SharedGoalsPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [form, setForm] = useState({ thrustArea: '', title: '', description: '', uomType: 'numeric_min', targetValue: '', targetDate: '', weightage: 10 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/team').then(r => r.json()).then(d => { setTeam(d.team || []); setLoading(false); });
  }, []);

  const toggleEmployee = (id: string) => {
    setSelectedEmployees(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const pushGoal = async () => {
    if (!form.title || !form.thrustArea || selectedEmployees.length === 0) {
      setToast({ type: 'error', message: 'Fill all fields and select employees' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    try {
      const res = await fetch('/api/shared-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thrustArea: form.thrustArea,
          title: form.title,
          description: form.description,
          uomType: form.uomType,
          targetValue: form.targetValue ? parseFloat(form.targetValue) : null,
          targetDate: form.targetDate || null,
          weightage: form.weightage,
          employeeIds: selectedEmployees,
        }),
      });
      if (res.ok) {
        setToast({ type: 'success', message: `Goal pushed to ${selectedEmployees.length} employee(s)!` });
        setForm({ thrustArea: '', title: '', description: '', uomType: 'numeric_min', targetValue: '', targetDate: '', weightage: 10 });
        setSelectedEmployees([]);
      }
    } catch { setToast({ type: 'error', message: 'Failed to push goal' }); }
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Push Shared Goal</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Push a departmental KPI to multiple team members</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goal form */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
            <h3 className="font-semibold">Goal Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Thrust Area *</label>
              <select value={form.thrustArea} onChange={e => setForm({ ...form, thrustArea: e.target.value })}>
                <option value="">Select...</option>
                {THRUST_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>UoM Type *</label>
              <select value={form.uomType} onChange={e => setForm({ ...form, uomType: e.target.value })}>
                {UOM_TYPES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Goal Title *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Enter KPI title..." />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the goal..." rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {form.uomType === 'timeline' ? 'Target Date' : 'Target Value'}
              </label>
              {form.uomType === 'timeline' ? (
                <input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} />
              ) : (
                <input type="number" value={form.targetValue} onChange={e => setForm({ ...form, targetValue: e.target.value })} placeholder="Enter target..." />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Default Weightage (%)</label>
              <input type="number" min={10} max={100} value={form.weightage} onChange={e => setForm({ ...form, weightage: Math.max(10, parseInt(e.target.value) || 10) })} />
            </div>
          </div>

          <button onClick={pushGoal} disabled={selectedEmployees.length === 0} className="btn btn-primary w-full mt-2">
            <Send className="w-4 h-4" /> Push to {selectedEmployees.length} Employee{selectedEmployees.length !== 1 ? 's' : ''}
          </button>
        </div>

        {/* Employee selector */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-primary)' }}>
            <Users className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
            <h3 className="font-semibold text-sm">Select Recipients</h3>
          </div>
          <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
            {team.map(member => (
              <label key={member.id} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={selectedEmployees.includes(member.id)}
                  onChange={() => toggleEmployee(member.id)}
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{member.department}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
