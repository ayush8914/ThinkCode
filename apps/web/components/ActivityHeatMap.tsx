'use client';

import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, Flame } from 'lucide-react';

interface ActivityData {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface ActivityStats {
  totalSubmissions: number;
  totalAccepted: number;
  acceptanceRate: string;
  currentStreak: number;
  longestStreak: number;
}

interface ActivityHeatMapProps {
  userId: string;
}

export function ActivityHeatMap({ userId }: ActivityHeatMapProps) {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchActivities();
  }, [userId]);
  
  const fetchActivities = async () => {
    try {
      const res = await fetch(`/api/user/${userId}/activity`);
      const data = await res.json();
      
      if (data.success) {
        setActivities(generateHeatMapData(data.activities));
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const generateHeatMapData = (rawActivities: any[]): ActivityData[] => {
    const activityMap = new Map<string, number>();
    
    rawActivities.forEach((activity: any) => {
      const date = new Date(activity.date).toISOString().split('T')[0];
      activityMap.set(date, activity.submissions);
    });
    
    const data: ActivityData[] = [];
    const today = new Date();
    
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = activityMap.get(dateStr) || 0;
      
      data.push({
        date: dateStr,
        count,
        level: getActivityLevel(count),
      });
    }
    
    return data;
  };
  
  const getActivityLevel = (count: number): 0 | 1 | 2 | 3 | 4 => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 10) return 3;
    return 4;
  };
  
  const getLevelColor = (level: number): string => {
    const colors = [
      'bg-white/10 border border-white/20',                          // Level 0
      'bg-emerald-500/20 border border-emerald-500/30',              // Level 1
      'bg-emerald-500/40 border border-emerald-500/50',              // Level 2
      'bg-emerald-500/60 border border-emerald-500/70',              // Level 3
      'bg-emerald-500/80 border border-emerald-500',                 // Level 4
    ];
    return colors[level] || colors[0];
  };
  
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const weeks: ActivityData[][] = [];
  for (let i = 0; i < activities.length; i += 7) {
    weeks.push(activities.slice(i, i + 7));
  }
  
  if (loading) {
    return (
      <div className="rounded-sm border border-white/10 bg-white/[0.02] p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/4" />
          <div className="flex gap-1">
            {[...Array(53)].map((_, i) => (
              <div key={i} className="h-3 w-3 bg-white/10 rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="rounded-sm border border-white/10 bg-white/[0.02] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-white">Activity</h3>
        </div>
        {stats && (
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-white/40">Submissions:</span>{' '}
              <span className="font-medium text-white">{stats.totalSubmissions}</span>
            </div>
            <div>
              <span className="text-white/40">Acceptance:</span>{' '}
              <span className="font-medium text-white">{stats.acceptanceRate}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-amber-400" />
              <span className="font-medium text-white">{stats.currentStreak} day streak</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Heat Map Grid */}
      <TooltipProvider>
        <div className="overflow-x-auto">
          <div className="min-w-[750px]">
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <Tooltip key={day.date}>
                      <TooltipTrigger asChild>
                        <div
                          className={`h-3 w-3 rounded-sm transition-all hover:ring-2 hover:ring-violet-400/50 hover:ring-offset-1 hover:ring-offset-[#0a0a0f] ${getLevelColor(
                            day.level
                          )}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#1a1a2e] border-white/10 text-white">
                        <p className="font-medium">{day.count} submissions</p>
                        <p className="text-xs text-white/60">{formatDate(day.date)}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
            
            {/* Month Labels */}
            <div className="mt-2 flex text-xs text-white/30">
              {getMonthLabels().map((month, i) => (
                <div key={i} style={{ flex: 1 }}>
                  {month}
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex items-center justify-end gap-2 text-xs text-white/40">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-3 w-3 rounded-sm ${getLevelColor(level)}`}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}

function getMonthLabels(): string[] {
  const months: string[] = [];
  const today = new Date();
  
  for (let i = 12; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(today.getMonth() - i);
    months.push(date.toLocaleDateString('en-US', { month: 'short' }));
  }
  
  return months;
}