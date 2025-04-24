import { prisma } from '@repo/db';

export async function getUserActivity(userId: string, days: number = 365) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  const activities = await prisma.userActivity.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
  });
  
  return activities;
}

export async function getActivityStats(userId: string) {
  const stats = await prisma.userActivity.aggregate({
    where: { userId },
    _sum: {
      submissions: true,
      accepted: true,
    },
  });
  
  const currentStreak = await calculateCurrentStreak(userId);
  const longestStreak = await calculateLongestStreak(userId);
  
  return {
    totalSubmissions: stats._sum.submissions || 0,
    totalAccepted: stats._sum.accepted || 0,
    acceptanceRate: stats._sum.submissions 
      ? ((stats._sum.accepted || 0) / stats._sum.submissions * 100).toFixed(1)
      : 0,
    currentStreak,
    longestStreak,
  };
}

async function calculateCurrentStreak(userId: string): Promise<number> {
  const activities = await prisma.userActivity.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  });
  
  if (activities.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let currentDate = today;
  
  for (const activity of activities) {
    const activityDate = new Date(activity.date);
    activityDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (diffDays === 1) {
      streak++;
      currentDate = activityDate;
    } else {
      break;
    }
  }
  
  return streak;
}

async function calculateLongestStreak(userId: string): Promise<number> {
  const activities = await prisma.userActivity.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  });
  
  if (activities.length === 0) return 0;
  
  let longestStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < activities.length; i++) {
    const prevDate = new Date(activities[i - 1].date);
    const currDate = new Date(activities[i].date);
    
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }
  
  return longestStreak;
}