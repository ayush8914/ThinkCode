'use client';

import { useEffect, useState } from 'react';
import { Users, Code2, Activity, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalProblems: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  todaySubmissions: number;
  usersByRole: Array<{ role: string; _count: number }>;
  submissionsByStatus: Array<{ status: string; _count: number }>;
  recentActivity: Array<{
    id: string;
    status: string;
    createdAt: string;
    user: { name: string | null; email: string };
    problem: { title: string };
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-sm border border-white/10 bg-white/[0.02] p-4 md:p-5 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
            <div className="h-6 md:h-8 bg-white/10 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }
  
  if (!stats) {
    return <div className="text-white/50 text-sm md:text-base">Failed to load stats</div>;
  }
  
  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-violet-400', href: '/admin/users' },
    { label: 'Total Problems', value: stats.totalProblems, icon: Code2, color: 'text-emerald-400', href: '/admin/problems' },
    { label: 'Total Submissions', value: stats.totalSubmissions, icon: Activity, color: 'text-amber-400', href: '/admin/submissions' },
    { label: 'Today\'s Submissions', value: stats.todaySubmissions, icon: TrendingUp, color: 'text-blue-400', href: '#' },
  ];
  
  const roleColors: Record<string, string> = {
    ADMIN: 'text-rose-400',
    PROBLEM_SETTER: 'text-amber-400',
    USER: 'text-emerald-400',
  };
  
  const statusColors: Record<string, string> = {
    ACCEPTED: 'text-emerald-400',
    WRONG_ANSWER: 'text-rose-400',
    TIME_LIMIT_EXCEEDED: 'text-amber-400',
    RUNTIME_ERROR: 'text-orange-400',
    COMPILATION_ERROR: 'text-purple-400',
    PENDING: 'text-gray-400',
    PROCESSING: 'text-blue-400',
  };
  
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stat Cards - Mobile: 2 columns, Tablet: 2 columns, Desktop: 4 columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href || '#'}>
            <div className="rounded-sm border border-white/10 bg-white/[0.02] p-3 md:p-5 hover:bg-white/[0.04] hover:border-violet-500/30 transition-all cursor-pointer group h-full">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <span className="text-white/50 text-xs md:text-sm font-mono truncate">{stat.label}</span>
                <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${stat.color} opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1`} />
              </div>
              <p className="text-xl md:text-3xl font-bold text-white tracking-tight">{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Stats Grid - Mobile: 1 column, Desktop: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Users by Role */}
        <div className="rounded-sm border border-white/10 bg-white/[0.02] p-4 md:p-5">
          <h3 className="text-xs md:text-sm text-white/50 mb-3 md:mb-4 font-mono">Users by Role</h3>
          <div className="space-y-2 md:space-y-3">
            {stats.usersByRole.length > 0 ? (
              stats.usersByRole.map((item) => (
                <div key={item.role} className="flex items-center justify-between">
                  <span className={`${roleColors[item.role] || 'text-white/70'} text-xs md:text-sm`}>
                    {item.role.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                  </span>
                  <span className="text-white font-mono text-sm md:text-base">{item._count}</span>
                </div>
              ))
            ) : (
              <div className="text-white/30 text-sm py-4 text-center">No data available</div>
            )}
          </div>
        </div>
        
        {/* Submissions by Status */}
        <div className="rounded-sm border border-white/10 bg-white/[0.02] p-4 md:p-5">
          <h3 className="text-xs md:text-sm text-white/50 mb-3 md:mb-4 font-mono">Submissions by Status</h3>
          <div className="space-y-1.5 md:space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
            {stats.submissionsByStatus.length > 0 ? (
              stats.submissionsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className={`${statusColors[item.status] || 'text-white/70'} text-xs md:text-sm truncate mr-2`}>
                    {item.status.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                  </span>
                  <span className="text-white font-mono text-sm md:text-base flex-shrink-0">{item._count}</span>
                </div>
              ))
            ) : (
              <div className="text-white/30 text-sm py-4 text-center">No data available</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="rounded-sm border border-white/10 bg-white/[0.02] p-4 md:p-5">
        <h3 className="text-xs md:text-sm text-white/50 mb-3 md:mb-4 font-mono">Recent Activity</h3>
        <div className="space-y-1">
          {stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 hover:bg-white/5 rounded-sm transition-colors gap-1 sm:gap-0">
                <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                  <span className="text-white/70 text-xs md:text-sm truncate max-w-[120px] md:max-w-none">
                    {activity.user.name || activity.user.email}
                  </span>
                  <span className="text-white/30 text-xs hidden sm:inline">→</span>
                  <span className="text-violet-400 text-xs md:text-sm truncate max-w-[150px] md:max-w-none">
                    {activity.problem.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${statusColors[activity.status] || 'text-white/40'}`}>
                    {activity.status === 'ACCEPTED' ? '✓' : activity.status === 'PENDING' ? '⌛' : '✗'}
                  </span>
                  <span className="text-white/30 text-xs">
                    {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-white/30 text-sm py-8 text-center">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
}