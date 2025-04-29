export function calculateProblemPoints(problemRating: number): number {
  return problemRating;
}

export function getProblemLimit(divisions: string[]): number {
  const count = divisions.length;
  if (count === 4) return 7;
  if (count === 3) return 6;
  if (count === 2) return 5;
  return 4;
}