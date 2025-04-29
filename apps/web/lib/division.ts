import { ContestProblem, Division } from "@repo/db";

export const DIVISION_BOUNDARIES = {
  DIV1: { min: 2000, max: Infinity },
  DIV2: { min: 1600, max: 1999 },
  DIV3: { min: 1400, max: 1599 },
  DIV4: { min: 0, max: 1399 },
};


export function getDivisionFromRating(rating: number): Division {
  if (rating >= 2000) return 'DIV1';
  if (rating >= 1600) return 'DIV2';
  if (rating >= 1400) return 'DIV3';
  return 'DIV4';
}

export function getDivisionLabel(division: Division): string {
  const labels: Record<Division, string> = {
    DIV1: 'Division 1',
    DIV2: 'Division 2',
    DIV3: 'Division 3',
    DIV4: 'Division 4',
  };
  return labels[division];
}


export function getDivisionColor(division: Division): string {
  const colors: Record<Division, string> = {
    DIV1: 'text-red-400',
    DIV2: 'text-orange-400',
    DIV3: 'text-blue-400',
    DIV4: 'text-green-400',
  };
  return colors[division];
}



export const PROBLEM_DISTRIBUTION = {
  // 7 problems total
  ALL_DIVS: [
    { orderIndex: 1, visibleTo: ['DIV1', 'DIV2', 'DIV3', 'DIV4'] }, // Easy
    { orderIndex: 2, visibleTo: ['DIV1', 'DIV2', 'DIV3'] },
    { orderIndex: 3, visibleTo: ['DIV1', 'DIV2', 'DIV3'] },
    { orderIndex: 4, visibleTo: ['DIV1', 'DIV2'] },
    { orderIndex: 5, visibleTo: ['DIV1', 'DIV2'] },
    { orderIndex: 6, visibleTo: ['DIV1'] },
    { orderIndex: 7, visibleTo: ['DIV1'] }, // Hard
  ],
  THREE_DIVS: [
    { orderIndex: 1, visibleTo: ['DIV1', 'DIV2', 'DIV3'] },
    { orderIndex: 2, visibleTo: ['DIV1', 'DIV2', 'DIV3'] },
    { orderIndex: 3, visibleTo: ['DIV1', 'DIV2'] },
    { orderIndex: 4, visibleTo: ['DIV1', 'DIV2'] },
    { orderIndex: 5, visibleTo: ['DIV1'] },
    { orderIndex: 6, visibleTo: ['DIV1'] },
  ],
  TWO_DIVS: [
    { orderIndex: 1, visibleTo: ['DIV1', 'DIV2'] },
    { orderIndex: 2, visibleTo: ['DIV1', 'DIV2'] },
    { orderIndex: 3, visibleTo: ['DIV1', 'DIV2'] },
    { orderIndex: 4, visibleTo: ['DIV1'] },
    { orderIndex: 5, visibleTo: ['DIV1'] },
  ],
  ONE_DIV: [
    { orderIndex: 1, visibleTo: ['DIV1'] },
    { orderIndex: 2, visibleTo: ['DIV1'] },
    { orderIndex: 3, visibleTo: ['DIV1'] },
    { orderIndex: 4, visibleTo: ['DIV1'] },
  ],
};

export function getProblemsForDivision(problems: any[], division: string): any[] {
  return problems
    .filter(p => {
      if (!p.visibleToDivisions || p.visibleToDivisions.length === 0) return true;
      return p.visibleToDivisions.includes(division);
    })
    .sort((a, b) => a.orderIndex - b.orderIndex);
}
