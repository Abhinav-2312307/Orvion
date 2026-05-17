'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Target, LayoutDashboard, FileText, TrendingUp, Users, CheckSquare,
  ClipboardList, Settings, Shield, BarChart3, LogOut, Bell, Menu, X,
  ChevronDown, Share2, Download
} from 'lucide-react';
import ParticleBackground from './ParticleBackground';

interface User {
  userId: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'admin';
  department: string;
}

const roleNavItems = {
  employee: [
    { href: '/employee', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/employee/goals', label: 'My Goals', icon: Target },
    { href: '/employee/achievements', label: 'Achievements', icon: TrendingUp },
  ],
  manager: [
    { href: '/manager', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/manager/approvals', label: 'Approvals', icon: CheckSquare },
    { href: '/manager/team', label: 'Team Goals', icon: Users },
    { href: '/manager/checkins', label: 'Check-ins', icon: ClipboardList },
    { href: '/manager/shared', label: 'Shared Goals', icon: Share2 },
  ],
  admin: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/cycles', label: 'Goal Cycles', icon: Settings },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/audit', label: 'Audit Trail', icon: Shield },
    { href: '/admin/reports', label: 'Reports', icon: Download },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ],
};

const roleGradients: Record<string, string> = {
  employee: 'linear-gradient(135deg, #3b82f6, #6366f1)',
  manager: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  admin: 'linear-gradient(135deg, #f59e0b, #ea580c)',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; is_read: number }[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.user) {
        router.push('/login');
        return;
      }
      setUser(data.user);

      // Fetch notifications
      const notifRes = await fetch('/api/notifications');
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
      }
    } catch {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = roleNavItems[user.role] || roleNavItems.employee;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const roleColor = user.role === 'admin' ? '#f59e0b' : user.role === 'manager' ? '#8b5cf6' : '#3b82f6';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <ParticleBackground />
      {/* Floating orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300`}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-5 pb-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
            <Target className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold gradient-text-animated">Orvion</span>
            <div className="flex items-center gap-1">
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Goal Portal</p>
            </div>
          </div>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <p className="text-[11px] font-semibold uppercase px-6 mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            Navigation
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== `/${user.role}` && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}>
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border-primary)' }}>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-card)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white"
              style={{ background: roleColor }}>
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-[11px] capitalize" style={{ color: 'var(--text-muted)' }}>{user.role} • {user.department}</p>
            </div>
            <button onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-[260px]">
        {/* Top header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4"
          style={{ background: 'rgba(10, 10, 15, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-primary)' }}>
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold">{navItems.find(i => pathname === i.href || (i.href !== `/${user.role}` && pathname.startsWith(i.href)))?.label || 'Dashboard'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-lg transition-colors"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                    style={{ background: '#ef4444' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-12 w-80 rounded-xl overflow-hidden animate-fade-in"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
                  <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <span className="text-sm font-semibold">Notifications</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{unreadCount} new</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3 hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid rgba(42,42,58,0.3)' }}>
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium capitalize"
              style={{ background: `${roleColor}20`, color: roleColor, border: `1px solid ${roleColor}40` }}>
              <ChevronDown className="w-3 h-3" />
              {user.role}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
