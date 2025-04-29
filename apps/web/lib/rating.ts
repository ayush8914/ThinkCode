interface Participant {
  userId: string;
  oldRating: number;
  rank: number;
  score: number;
}

export function calculateRatingChanges(participants: Participant[]): Map<string, number> {
  const changes = new Map<string, number>();
  const n = participants.length;
  
  const sorted = [...participants].sort((a, b) => a.rank - b.rank);
  
  for (let i = 0; i < n; i++) {
    const user = sorted[i];
    const oldRating = user.oldRating;
    
    let expectedRank = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const opponent = sorted[j];
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

export function getContestBonus(rank: number, totalParticipants: number): number {
  const percentile = (rank / totalParticipants) * 100;
  
  if (percentile <= 1) return 25;   // Top 1%
  if (percentile <= 5) return 15;   // Top 5%
  if (percentile <= 10) return 10;  // Top 10%
  if (percentile <= 25) return 5;   // Top 25%
  return 0;
}