'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Eye, EyeOff, ArrowRight, Shield, Users, BarChart3, Sparkles, Zap, Globe } from 'lucide-react';

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  size: Math.random() * 4 + 2,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 5,
  duration: Math.random() * 10 + 15,
}));

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      router.push(`/${data.user.role}`);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email: string, pw: string) => {
    setEmail(email);
    setPassword(pw);
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #06060b 0%, #150d25 40%, #0d0a18 100%)' }}>

        {/* Animated particles */}
        {mounted && PARTICLES.map(p => (
          <div key={p.id} className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: `hsla(${250 + Math.random() * 30}, 70%, 60%, ${0.15 + Math.random() * 0.2})`,
              animation: `float ${p.duration}s ease-in-out infinite ${p.delay}s`,
            }}
          />
        ))}

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-96 h-96 rounded-full opacity-10 animate-float"
            style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-20 right-8 w-[500px] h-[500px] rounded-full opacity-8"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent)', filter: 'blur(80px)', animation: 'float 20s ease-in-out infinite reverse' }} />
          <div className="absolute top-1/3 left-1/2 w-64 h-64 rounded-full opacity-6"
            style={{ background: 'radial-gradient(circle, #ec4899, transparent)', filter: 'blur(70px)', animation: 'float 15s ease-in-out infinite 3s' }} />
          {/* Grid lines */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center animate-pulse-glow"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold gradient-text-animated">Orvion</span>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Goal Setting & Tracking Portal
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-5xl font-bold mb-6" style={{ lineHeight: '1.15' }}>
            <span className="gradient-text-animated">Align. Track.</span>
            <br />
            <span className="text-white">Achieve.</span>
          </h1>
          <p className="text-lg mb-12" style={{ color: 'var(--text-secondary)', maxWidth: '420px' }}>
            Streamline your organization&apos;s goal management with intelligent insights,
            quarterly check-ins, and real-time analytics.
          </p>

          <div className="space-y-5">
            {[
              { icon: Users, label: 'Team Alignment', desc: 'Connect individual goals to org priorities' },
              { icon: BarChart3, label: 'Real-time Visibility', desc: 'Track progress across all quarters' },
              { icon: Shield, label: 'Audit Ready', desc: 'Complete trail of all goal changes' },
              { icon: Sparkles, label: 'Smart Insights', desc: 'Goal suggestions & performance coaching' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 animate-fade-in" style={{ animationDelay: `${i * 150 + 200}ms` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--accent-glow)', border: '1px solid rgba(124,58,237,0.15)' }}>
                  <item.icon className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{item.label}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 flex items-center gap-6 pt-4" style={{ borderTop: '1px solid var(--border-primary)' }}>
          {[
            { icon: Globe, label: 'Multi-role Access', value: '3 Dashboards' },
            { icon: Zap, label: 'Smart Scoring', value: '4 UoM Types' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <s.icon className="w-3.5 h-3.5" style={{ color: 'var(--accent-secondary)' }} />
              <div>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{s.value}</p>
              </div>
            </div>
          ))}
          <p className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
            © 2026 Orvion • AtomQuest
          </p>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative"
        style={{ background: 'var(--bg-primary)' }}>
        
        {/* Subtle background orb */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.04), transparent)', filter: 'blur(60px)' }} />
        
        <div className="w-full max-w-md animate-slide-up relative z-10" style={{ animationDelay: '100ms' }}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text-animated">Orvion</span>
          </div>

          <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Sign in to your account to continue
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl text-sm animate-fade-in"
              style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@orvion.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
              style={{ padding: '13px 20px', fontSize: '15px' }}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick login cards */}
          <div className="mt-8">
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Quick Demo Access
            </p>
            <div className="space-y-2">
              {[
                { name: 'Rahul Sharma', role: 'Employee', email: 'rahul@orvion.com', pw: 'demo123', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)' },
                { name: 'Priya Mehta', role: 'Manager', email: 'priya@orvion.com', pw: 'demo123', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
                { name: 'Admin User', role: 'Admin', email: 'admin@orvion.com', pw: 'admin123', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)' },
              ].map((user, i) => (
                <button
                  key={user.email}
                  onClick={() => quickLogin(user.email, user.pw)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all animate-fade-in"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    animationDelay: `${400 + i * 100}ms`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${user.color}40`;
                    e.currentTarget.style.background = `${user.color}08`;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-primary)';
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: user.gradient }}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.role} • {user.email}</p>
                  </div>
                  <ArrowRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
