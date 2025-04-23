'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity } from 'lucide-react';

interface ActivityData {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface ActivityHeatMapProps {
  userId: string;
  className?: string;
}

export function ActivityHeatMap({ userId, className }: ActivityHeatMapProps) {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchActivities();
  }, [userId]);
  
  const fetchActivities = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/activity`);
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
    
    rawActivities.forEach(activity => {
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
      'bg-gray-100 dark:bg-gray-800',
      'bg-emerald-200 dark:bg-emerald-900',
      'bg-emerald-300 dark:bg-emerald-700',
      'bg-emerald-400 dark:bg-emerald-500',
      'bg-emerald-500 dark:bg-emerald-400',
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
  
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="grid grid-cols-53 gap-1">
              {[...Array(53)].map((_, i) => (
                <div key={i} className="h-3 w-3 bg-gray-200 dark:bg-gray-700 rounded-sm" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity
          </CardTitle>
          {stats && (
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total:</span>{' '}
                <span className="font-medium">{stats.totalSubmissions}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Streak:</span>{' '}
                <span className="font-medium">{stats.currentStreak} days</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-53 gap-1">
                {activities.map((activity, index) => (
                  <Tooltip key={activity.date}>
                    <TooltipTrigger asChild>
                      <div
                        className={`h-3 w-3 rounded-sm transition-all hover:ring-2 hover:ring-offset-1 ${getLevelColor(
                          activity.level
                        )}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{activity.count} submissions</p>
                      <p className="text-xs text-muted-foreground">{formatDate(activity.date)}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              
              {/* Month Labels */}
              <div className="mt-2 flex text-xs text-muted-foreground">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
                  (month, i) => (
                    <div key={month} className="flex-1">
                      {month}
                    </div>
                  )
                )}
              </div>
              
              {/* Legend */}
              <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}