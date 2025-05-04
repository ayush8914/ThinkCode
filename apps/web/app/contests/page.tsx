import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@repo/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Clock, Users, Calendar, ChevronRight, Plus } from 'lucide-react';

export default async function ContestsPage() {
  const session = await getServerSession(authOptions);
  const now = new Date();
  
  const [upcomingContests, liveContests, pastContests] = await Promise.all([
    prisma.contest.findMany({
      where: { isPublic: true, startTime: { gt: now } },
      include: {
        divisions: true,
        _count: { select: { participants: true, problems: true } },
      },
      orderBy: { startTime: 'asc' },
    }),
    prisma.contest.findMany({
      where: { isPublic: true, startTime: { lte: now }, endTime: { gt: now } },
      include: {
        divisions: true,
        _count: { select: { participants: true, problems: true } },
      },
      orderBy: { endTime: 'asc' },
    }),
    prisma.contest.findMany({
      where: { isPublic: true, endTime: { lt: now } },
      include: {
        divisions: true,
        _count: { select: { participants: true, problems: true } },
      },
      orderBy: { endTime: 'desc' },
      take: 20,
    }),
  ]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDivisionLabel = (div: string) => {
    const labels: Record<string, string> = {
      DIV1: 'Div 1', DIV2: 'Div 2', DIV3: 'Div 3', DIV4: 'Div 4',
    };
    return labels[div] || div;
  };

  const renderContestCard = (contest: any) => (
    <Link key={contest.id} href={`/contests/${contest.slug}`}>
      <Card className="border-white/10 bg-white/[0.02] text-violet-400 hover:bg-white/[0.04] transition-all cursor-pointer group mb-3">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg group-hover:text-violet-400 transition-colors">
                {contest.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-violet-500/20 text-violet-300 text-xs">
                  {contest.contestName}
                </Badge>
                <Badge className={contest.contestType === 'RATED' 
                  ? 'bg-amber-500/20 text-amber-300 text-xs' 
                  : 'bg-gray-500/20 text-gray-300 text-xs'
                }>
                  {contest.contestType}
                </Badge>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-violet-400 transition-colors" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(contest.startTime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(contest.endTime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{contest._count.participants} registered</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              <span>{contest.divisions.map((d : any) => getDivisionLabel(d.division)).join(', ')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white font-mono">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Contests</h1>
            <p className="text-white/40 text-sm">Compete and improve your rating</p>
          </div>
          {session?.user?.role === 'ADMIN' && (
            <Link href="/admin/contests/create">
              <Button className="bg-violet-600 hover:bg-violet-500">
                <Plus className="h-4 w-4 mr-0" />
                Create Contest
              </Button>
            </Link>
          )}
        </div>

        <Tabs defaultValue={liveContests.length > 0 ? 'live' : 'upcoming'} className="w-full">
          <TabsList className="bg-transparent border border-white/10 mb-6">
            <TabsTrigger value="live" className='text-white hover:bg-white/20 hover:text-white'>
              Live <Badge className="ml-2 bg-emerald-500/20 text-black-700">{liveContests.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className='text-white hover:bg-white/20 hover:text-white'>
              Upcoming <Badge className="ml-2 bg-blue-500/20 text-black-300">{upcomingContests.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="past" className='text-white hover:bg-white/20 hover:text-white'>
              Past <Badge className="ml-2 bg-gray-500/20 text-black-300">{pastContests.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live">
            {liveContests.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>No live contests right now</p>
              </div>
            ) : (
              liveContests.map(renderContestCard)
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcomingContests.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>No upcoming contests</p>
              </div>
            ) : (
              upcomingContests.map(renderContestCard)
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastContests.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>No past contests</p>
              </div>
            ) : (
              pastContests.map(renderContestCard)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}