'use client';

import { useState } from 'react';
import { Sparkles, X, Loader2, Lightbulb, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AIPanelProps {
  type: 'suggest' | 'analyze' | 'insights';
  context: Record<string, unknown>;
  onApply?: (data: unknown) => void;
}

export default function AIPanel({ type, context, onApply }: AIPanelProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  const runAI = async () => {
    setLoading(true);
    setError('');
    try {
      const actionMap = { suggest: 'suggest_goals', analyze: 'analyze_quality', insights: 'progress_insights' };
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionMap[type], ...context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Service temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  const labels = {
    suggest: { title: 'Smart Goal Suggestions', desc: 'Get intelligent goal recommendations', icon: Lightbulb, btnText: 'Generate Suggestions' },
    analyze: { title: 'Goal Quality Score', desc: 'Automated SMART analysis', icon: CheckCircle2, btnText: 'Analyze Goals' },
    insights: { title: 'Performance Insights', desc: 'Intelligent coaching for your progress', icon: TrendingUp, btnText: 'Get Insights' },
  };

  const config = labels[type];

  if (!open) {
    return (
      <button onClick={() => { setOpen(true); if (!result) runAI(); }}
        className="ai-trigger-btn group">
        <div className="ai-trigger-glow" />
        <Sparkles className="w-4 h-4 ai-sparkle" />
        <span>{config.title}</span>
      </button>
    );
  }

  return (
    <div className="ai-panel animate-fade-in">
      <div className="ai-panel-header">
        <div className="flex items-center gap-2">
          <div className="ai-icon-badge">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">{config.title}</h4>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{config.desc}</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="ai-panel-body">
        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="ai-loader">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#a78bfa' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Analyzing...</p>
            <div className="ai-thinking-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
            <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
          </div>
        )}

        {/* Goal Suggestions */}
        {type === 'suggest' && result?.suggestions && (
          <div className="space-y-3">
            {(result.suggestions as Record<string, unknown>[]).map((s, i) => (
              <div key={i} className="ai-suggestion-card animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{s.title as string}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.thrust_area as string} • {s.weightage as number}%</p>
                  </div>
                  {onApply && (
                    <button onClick={() => onApply(s)} className="ai-apply-btn">
                      + Add
                    </button>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.description as string}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quality Analysis */}
        {type === 'analyze' && result?.analysis && (
          <div className="space-y-4">
            {/* Score */}
            <div className="text-center py-4">
              <div className="ai-score-ring">
                <span className="text-3xl font-bold" style={{ color: '#a78bfa' }}>
                  {(result.analysis as Record<string, unknown>).overall_score as number}
                </span>
              </div>
              <p className="text-sm mt-2 font-semibold" style={{ color: '#a78bfa' }}>
                Grade: {(result.analysis as Record<string, unknown>).grade as string}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {(result.analysis as Record<string, unknown>).summary as string}
              </p>
            </div>
            {/* Strengths */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#10b981' }}>✓ Strengths</p>
              {((result.analysis as Record<string, unknown>).strengths as string[])?.map((s, i) => (
                <p key={i} className="text-xs mb-1 pl-3" style={{ color: 'var(--text-secondary)' }}>• {s}</p>
              ))}
            </div>
            {/* Improvements */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#f59e0b' }}>⚡ Improvements</p>
              {((result.analysis as Record<string, unknown>).improvements as string[])?.map((s, i) => (
                <p key={i} className="text-xs mb-1 pl-3" style={{ color: 'var(--text-secondary)' }}>• {s}</p>
              ))}
            </div>
          </div>
        )}

        {/* Progress Insights */}
        {type === 'insights' && result?.insights && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {(result.insights as Record<string, unknown>).overall_assessment as string}
            </p>
            {((result.insights as Record<string, unknown>).risk_areas as string[])?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#ef4444' }}>⚠ Risk Areas</p>
                {((result.insights as Record<string, unknown>).risk_areas as string[]).map((r, i) => (
                  <p key={i} className="text-xs mb-1 pl-3" style={{ color: 'var(--text-secondary)' }}>• {typeof r === 'string' ? r : JSON.stringify(r)}</p>
                ))}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#3b82f6' }}>💡 Recommendations</p>
              {((result.insights as Record<string, unknown>).recommendations as string[])?.map((r, i) => (
                <p key={i} className="text-xs mb-1 pl-3" style={{ color: 'var(--text-secondary)' }}>• {r}</p>
              ))}
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(99,102,241,0.1))', border: '1px solid rgba(167,139,250,0.2)' }}>
              <p className="text-sm font-medium" style={{ color: '#a78bfa' }}>
                ✨ {(result.insights as Record<string, unknown>).motivation_message as string}
              </p>
            </div>
          </div>
        )}

        {!loading && !error && !result && (
          <div className="text-center py-6">
            <config.icon className="w-8 h-8 mx-auto mb-3" style={{ color: '#a78bfa', opacity: 0.5 }} />
            <button onClick={runAI} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
              <Sparkles className="w-4 h-4" /> {config.btnText}
            </button>
          </div>
        )}

        {!loading && result && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
            <button onClick={runAI} className="text-xs font-medium" style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer' }}>
              ↻ Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
