import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@repo/db';
import { notFound } from 'next/navigation';
import { getDivisionFromRating } from '@/lib/division';
import ContestClient from './ContestClient';

export default async function ContestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const session = await getServerSession(authOptions);
  
  const contest = await prisma.contest.findUnique({
    where: { slug },
    include: {
      divisions: true,
      problems: {
        include: { problem: true },
        orderBy: { orderIndex: 'asc' },
      },
      participants: {
        include: { user: { select: { id: true, name: true, contestRating: true } } },
        orderBy: [{ score: 'desc' }, { penalty: 'asc' }],
      },
    },
  });
  
  if (!contest) notFound();
  
  let isRegistered = false;
  let userDivision: string | null = null;
  let userProblems: any[] = [];
  
  if (session?.user) {
    const participant = contest.participants.find(p => p.userId === session.user.id);
    isRegistered = !!participant;
    
    if (participant) {
      userDivision = participant.division;
      userProblems = contest.problems.filter(p => 
        p.visibleToDivisions.includes(participant.division)
      );
    } else {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { contestRating: true },
      });
      userDivision = getDivisionFromRating(user?.contestRating || 800);
    }
  }
  
  const now = new Date();
  const isUpcoming = now < contest.startTime;
  const isLive = now >= contest.startTime && now <= contest.endTime;
  const isEnded = now > contest.endTime;
  
  const leaderboardByDivision: Record<string, typeof contest.participants> = {};
  contest.participants.forEach(p => {
    if (!leaderboardByDivision[p.division]) {
      leaderboardByDivision[p.division] = [];
    }
    leaderboardByDivision[p.division].push(p);
  });
  
  return (
    <ContestClient
      contest={contest}
      isRegistered={isRegistered}
      userDivision={userDivision}
      userProblems={userProblems}
      isUpcoming={isUpcoming}
      isLive={isLive}
      isEnded={isEnded}
      leaderboardByDivision={leaderboardByDivision}
      session={session}
    />
  );
}