import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@repo/db';
import { notFound, redirect } from 'next/navigation';
import ContestProblemClient from './ContestProblemClient';

export default async function ContestProblemPage({ 
  params 
}: { 
  params: Promise<{ slug: string; problemSlug: string }> 
}) {
  const { slug, problemSlug } = await params;
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }
  
  const contest = await prisma.contest.findUnique({
    where: { slug },
    include: {
      problems: {
        include: { problem: { include: { tags: { include: { tag: true } } } } },
        orderBy: { orderIndex: 'asc' },
      },
      participants: {
        where: { userId: session.user.id },
      },
    },
  });
  
  if (!contest) notFound();
  
  const participant = contest.participants[0];
  if (!participant) {
    redirect(`/contests/${slug}`);
  }
  
  const now = new Date();
  if (now < contest.startTime) {
    redirect(`/contests/${slug}`);
  }
  
  const isEnded = now > contest.endTime;
  
  const contestProblem = contest.problems.find(
    cp => cp.problem.slug === problemSlug
  );
  
  if (!contestProblem) notFound();
  
  if (!contestProblem.visibleToDivisions.includes(participant.division)) {
    redirect(`/contests/${slug}`);
  }
  
  const problem = await prisma.problem.findUnique({
    where: { id: contestProblem.problemId },
    include: {
      testCases: {
        where: { isSample: true },
        orderBy: { orderIndex: 'asc' },
      },
      tags: {
        include: { tag: true },
      },
    },
  });
  
  if (!problem) notFound();
  
  return (
    <ContestProblemClient
      contest={contest}
      problem={problem}
      contestProblem={contestProblem}
      isEnded={isEnded}
      userDivision={participant.division}
    />
  );
}