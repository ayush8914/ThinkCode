export interface ProblemWithRating {
  id: string;
  title: string;
  difficulty: string;
  rating: number;
}

export const PROBLEM_LIMITS = {
  ALL_DIVS: 7,  // DIV1 + DIV2 + DIV3 + DIV4
  THREE_DIVS: 6, // DIV1 + DIV2 + DIV3
  TWO_DIVS: 5,   // DIV1 + DIV2
  ONE_DIV: 4,    // Single division
};

export function getProblemLimit(divisions: string[]): number {
  const count = divisions.length;
  if (count === 4) return PROBLEM_LIMITS.ALL_DIVS;
  if (count === 3) return PROBLEM_LIMITS.THREE_DIVS;
  if (count === 2) return PROBLEM_LIMITS.TWO_DIVS;
  return PROBLEM_LIMITS.ONE_DIV;
}

export function getDivisionOrder(): string[] {
  return ['DIV4', 'DIV3', 'DIV2', 'DIV1']; // Lowest to highest rating
}

export function calculateVisibleToDivisions(
  problemIndex: number,
  totalProblems: number,
  contestDivisions: string[]
): string[] {
  const divisionOrder = getDivisionOrder();
  const availableDivisions = divisionOrder.filter(d => contestDivisions.includes(d));
  const numDivisions = availableDivisions.length;
  
  // For 4 divisions (7 problems): DIV4 gets 1-4, DIV3 gets 2-5, DIV2 gets 3-6, DIV1 gets 4-7
  // For 3 divisions (6 problems): lowest gets 1-4, middle gets 2-5, highest gets 3-6
  // For 2 divisions (5 problems): lower gets 1-4, higher gets 2-5
  // For 1 division (4 problems): gets 1-4
  
  const visibleTo: string[] = [];
  const zeroIndexed = problemIndex; // 0-based index
  
  for (let i = 0; i < numDivisions; i++) {
    const divStart = i;
    const divEnd = i + 4;
    
    if (zeroIndexed >= divStart && zeroIndexed < divEnd) {
      visibleTo.push(availableDivisions[i]);
    }
  }
  
  return visibleTo;
}

export function sortProblemsByDifficulty(problems: any[]): any[] {
  return [...problems].sort((a, b) => {
    // Sort by difficulty first, then by rating
    const diffOrder: Record<string, number> = { EASY: 1, MEDIUM: 2, HARD: 3 };
    const diffA = diffOrder[a.problem?.difficulty || a.difficulty] || 2;
    const diffB = diffOrder[b.problem?.difficulty || b.difficulty] || 2;
    
    if (diffA !== diffB) return diffA - diffB;
    
    // Then by rating (lower rating = easier)
    const ratingA = a.problem?.rating || a.rating || 10;
    const ratingB = b.problem?.rating || b.rating || 10;
    return ratingA - ratingB;
  });
}

export function autoAssignVisibleDivisions(
  problems: any[],
  contestDivisions: string[]
): any[] {
  // First sort problems by difficulty/rating
  const sortedProblems = sortProblemsByDifficulty(problems);
  
  // Then assign visible divisions based on position
  return sortedProblems.map((problem, index) => ({
    ...problem,
    orderIndex: index + 1,
    visibleToDivisions: calculateVisibleToDivisions(index, sortedProblems.length, contestDivisions),
  }));
}