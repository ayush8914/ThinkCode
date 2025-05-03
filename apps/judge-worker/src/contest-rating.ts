import { prisma } from '@repo/db';

interface Participant {
  userId: string;
  oldRating: number;
  rank: number;
  score: number;
}

export async function processContestResults(contestId: string) {
  console.log(`🏁 Processing results for contest ${contestId}`);
  
  // 1. Get all participants with their current ratings
  const participants = await prisma.contestParticipant.findMany({
    where: { contestId },
    include: {
      user: { select: { id: true, contestRating: true } },
    },
    orderBy: [
      { score: 'desc' },
      { solvedCount: 'desc' },
      { penalty: 'asc' },
    ],
  });
  
  if (participants.length === 0) {
    console.log('No participants in this contest');
    return;
  }
  
  // 2. Assign ranks based on sorted order
  const rankedParticipants = assignRanks(participants);
  
  // 3. Convert to Participant format for rating calculation
  const ratingParticipants: Participant[] = rankedParticipants.map(p => ({
    userId: p.userId,
    oldRating: p.user.contestRating || 800,
    rank: p.rank,
    score: p.score,
  }));
  
  // 4. Calculate rating changes
  const ratingChanges = calculateRatingChanges(ratingParticipants);
  
  // 5. Calculate bonuses for top performers
  const bonuses = calculateBonuses(rankedParticipants);
  
  // 6. Save everything to database
  await saveRatingChanges(contestId, ratingChanges, bonuses, rankedParticipants);
  
  console.log(`✅ Contest ${contestId} results processed`);
}

function assignRanks(participants: any[]): any[] {
  let rank = 1;
  let prevScore = -1;
  let prevSolved = -1;
  let prevPenalty = -1;
  
  return participants.map((p, index) => {
    // Same score and solved count = same rank (tie)
    if (p.score !== prevScore || p.solvedCount !== prevSolved || p.penalty !== prevPenalty) {
      rank = index + 1;
    }
    prevScore = p.score;
    prevSolved = p.solvedCount;
    prevPenalty = p.penalty;
    
    return { ...p, rank };
  });
}

export function calculateRatingChanges(participants: Participant[]): Map<string, number> {
  const changes = new Map<string, number>();
  const n = participants.length;
  
  const sorted = [...participants].sort((a, b) => a.rank - b.rank);
  
  for (let i = 0; i < n; i++) {
    const user :any = sorted[i];
    const oldRating  = user.oldRating;
    
    let expectedRank = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const opponent :any = sorted[j];
      const expectedScore = 1 / (1 + Math.pow(10, (opponent.oldRating - oldRating) / 400));
      expectedRank += expectedScore;
    }
    
    const actualRank = n - i;
    const K = getKFactor(oldRating);
    const change = Math.round(K * (actualRank - expectedRank) / (n - 1));
    const cappedChange = Math.max(-100, Math.min(100, change));
    
    changes.set(user.userId, cappedChange);
  }
  
  return changes;
}

function getKFactor(rating: number): number {
  if (rating < 1400) return 64;
  if (rating < 1800) return 48;
  if (rating < 2200) return 32;
  return 24;
}

function calculateBonuses(participants: any[]): Map<string, number> {
  const bonuses = new Map<string, number>();
  const n = participants.length;
  
  for (const p of participants) {
    const bonus = getContestBonus(p.rank, n);
    if (bonus > 0) {
      bonuses.set(p.userId, bonus);
    }
  }
  
  return bonuses;
}

export function getContestBonus(rank: number, totalParticipants: number): number {
  const percentile = (rank / totalParticipants) * 100;
  
  if (percentile <= 1) return 25;   // Top 1%
  if (percentile <= 5) return 15;   // Top 5%
  if (percentile <= 10) return 10;  // Top 10%
  if (percentile <= 25) return 5;   // Top 25%
  return 0;
}


async function saveRatingChanges(
  contestId: string,
  changes: Map<string, number>,
  bonuses: Map<string, number>,
  participants: any[]
) {
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: { contestType: true },
  });
  
  if (contest?.contestType !== 'RATED') {
    console.log(`Contest ${contestId} is UNRATED - skipping rating updates`);
    return;
  }
  
  for (const p of participants) {
    const change = changes.get(p.userId) || 0;
    const bonus = bonuses.get(p.userId) || 0;
    const totalChange = change + bonus;
    
    const oldRating = p.user.contestRating || 800;
    const newRating = Math.max(100, oldRating + totalChange);
    
    const currentUser = await prisma.user.findUnique({
      where: { id: p.userId },
      select: { maxContestRating: true },
    });
    
    await prisma.ratingChange.upsert({
      where: {
        contestId_userId: {
          contestId,
          userId: p.userId,
        },
      },
      update: {
        oldRating,
        newRating,
        change: totalChange,
        rank: p.rank,
        division: p.division,
      },
      create: {
        contestId,
        userId: p.userId,
        oldRating,
        newRating,
        change: totalChange,
        rank: p.rank,
        division: p.division,
      },
    });
    
    const alreadyUpdated = await prisma.ratingChange.findUnique({
      where: {
        contestId_userId: {
          contestId,
          userId: p.userId,
        },
      },
      select: { createdAt: true },
    });
    
    // If created more than 10 seconds ago, skip user update
    const isNew = !alreadyUpdated || (Date.now() - alreadyUpdated.createdAt.getTime() < 10000);
    
    if (isNew) {
      await prisma.user.update({
        where: { id: p.userId },
        data: {
          contestRating: newRating,
          maxContestRating: Math.max(currentUser?.maxContestRating || 0, newRating),
        },
      });
      
      console.log(`User ${p.userId}: ${oldRating} → ${newRating} (${totalChange > 0 ? '+' : ''}${totalChange}) Rank: #${p.rank}`);
    } else {
      console.log(`⏭️ User ${p.userId} already processed for contest ${contestId} - skipping`);
    }
  }
}