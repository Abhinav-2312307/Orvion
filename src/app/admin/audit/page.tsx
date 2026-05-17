'use client';

import { useEffect, useState } from 'react';
import { Shield, Filter } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_by_name: string;
  changed_by_email: string;
  changed_at: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit?limit=100').then(r => r.json()).then(d => {
      setLogs(d.logs || []);
      setTotal(d.total || 0);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  const actionColors: Record<string, string> = {
    status_change: '#f59e0b',
    update: '#3b82f6',
    unlock: '#ef4444',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Trail</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{total} total entries — All post-lock changes logged</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table>
          <thead>
            <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Table</th><th>Field</th><th>Old Value</th><th>New Value</th></tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={log.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(log.changed_at)}</td>
                <td>
                  <p className="text-sm font-medium">{log.changed_by_name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{log.changed_by_email}</p>
                </td>
                <td>
                  <span className="badge text-xs" style={{
                    background: `${actionColors[log.action] || '#888'}15`,
                    color: actionColors[log.action] || '#888',
                    borderColor: `${actionColors[log.action] || '#888'}30`,
                  }}>
                    {log.action}
                  </span>
                </td>
                <td className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{log.table_name}</td>
                <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>{log.field_name || '-'}</td>
                <td className="text-xs font-mono" style={{ color: '#ef4444' }}>{log.old_value || '-'}</td>
                <td className="text-xs font-mono" style={{ color: '#10b981' }}>{log.new_value || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="p-12 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No audit entries yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
