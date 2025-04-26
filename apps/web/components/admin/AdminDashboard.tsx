'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, Code2, Activity, TrendingUp, 
} from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalProblems: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  todaySubmissions: number;
  usersByRole: Array<{ role: string; _count: number }>;
  submissionsByStatus: Array<{ status: string; _count: number }>;
  recentActivity: Array<any>;
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
    return <div className="text-white/50">Loading...</div>;
  }
  
  if (!stats) {
    return <div className="text-white/50">Failed to load stats</div>;
  }
  
  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-violet-400', href: '/admin/users' },
    { label: 'Total Problems', value: stats.totalProblems, icon: Code2, color: 'text-emerald-400', href: '/admin/problems' },
    { label: 'Total Submissions', value: stats.totalSubmissions, icon: Activity, color: 'text-amber-400', href: '/admin/submissions' },
    { label: 'Today\'s Submissions', value: stats.todaySubmissions, icon: TrendingUp, color: 'text-blue-400' },
  ];
  
  const statusColors: Record<string, string> = {
    ACCEPTED: 'text-emerald-400',
    WRONG_ANSWER: 'text-rose-400',
    TIME_LIMIT_EXCEEDED: 'text-amber-400',
    RUNTIME_ERROR: 'text-orange-400',
    COMPILATION_ERROR: 'text-purple-400',
    PENDING: 'text-gray-400',
  };
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href || '#'}>
            <Card className="border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white/50 flex items-center justify-between">
                  {stat.label}
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="text-white">Users by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.usersByRole.map((item) => (
                <div key={item.role} className="flex items-center justify-between">
                  <span className="text-white/70">{item.role}</span>
                  <span className="text-white font-medium">{item._count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="text-white">Submissions by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.submissionsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className={`${statusColors[item.status] || 'text-white/70'}`}>
                    {item.status.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                  </span>
                  <span className="text-white font-medium">{item._count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-sm">
                <div className="flex items-center gap-3">
                  <span className="text-white/70">{activity.user.name || activity.user.email}</span>
                  <span className="text-white/30">solved</span>
                  <span className="text-violet-400">{activity.problem.title}</span>
                </div>
                <span className="text-white/40 text-sm">
                  {new Date(activity.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}