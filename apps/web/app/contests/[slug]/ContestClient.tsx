'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Trophy, Clock, Users, Calendar, CheckCircle2, AlertCircle,
  ChevronRight, Code2, Loader2,
} from 'lucide-react';
import { getDivisionLabel, getDivisionColor } from '@/lib/division';

interface ContestClientProps {
  contest: any;
  isRegistered: boolean;
  userDivision: string | null;
  userProblems: any[];
  isUpcoming: boolean;
  isLive: boolean;
  isEnded: boolean;
  leaderboardByDivision: Record<string, any[]>;
  session: any;
}

export default function ContestClient({
  contest, isRegistered, userDivision, userProblems,
  isUpcoming, isLive, isEnded, leaderboardByDivision, session,
}: ContestClientProps) {
  const router = useRouter();
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDivision, setSelectedDivision] = useState(
    userDivision || Object.keys(leaderboardByDivision)[0] || 'DIV4'
  );

  const handleRegister = async () => {
    if (!session) { router.push('/auth/signin'); return; }
    setRegistering(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/contests/by-slug/${contest.slug}/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Registered in ${data.division}!`);
        setTimeout(() => router.refresh(), 1500);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch { setError('Failed to register'); }
    finally { setRegistering(false); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const getDifficultyBadge = (difficulty: string) => {
    const styles: Record<string, string> = {
      EASY: 'bg-emerald-500/20 text-emerald-300',
      MEDIUM: 'bg-amber-500/20 text-amber-300',
      HARD: 'bg-rose-500/20 text-rose-300',
    };
    return styles[difficulty] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white font-mono">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link href="/contests" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-4">
          ← Back to Contests
        </Link>
        
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">{contest.title}</h1>
            <div className="flex gap-3 mt-2">
              <Badge className="bg-violet-500/20 text-violet-300">{contest.contestName}</Badge>
              <Badge className={contest.contestType==='RATED'?'bg-amber-500/20 text-amber-300':'bg-gray-500/20 text-gray-300'}>
                {contest.contestType}
              </Badge>
              {isUpcoming && <Badge className="bg-blue-500/20 text-blue-300">Upcoming</Badge>}
              {isLive && <Badge className="bg-emerald-500/20 text-emerald-300 animate-pulse">LIVE</Badge>}
              {isEnded && <Badge className="bg-gray-500/20 text-gray-300">Ended</Badge>}
            </div>
            {contest.description && (
              <p className="text-white/50 mt-3 text-sm">{contest.description}</p>
            )}
          </div>
          {isUpcoming && !isRegistered && session && (
            <Button onClick={handleRegister} disabled={registering} className="bg-violet-600 hover:bg-violet-500">
              {registering ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Registering...</> : 'Register Now'}
            </Button>
          )}
          {isRegistered && (
            <Badge className="bg-emerald-500/20 text-emerald-300 text-base px-4 py-2">
              ✓ Registered in {userDivision}
            </Badge>
          )}
          {!session && isUpcoming && (
            <Button asChild className="bg-violet-600"><Link href="/auth/signin">Sign in to Register</Link></Button>
          )}
        </div>

        {error && (
          <Alert className="mt-4 border-rose-500/30 bg-rose-500/10">
            <AlertCircle className="h-4 w-4"/><AlertDescription className="text-rose-200">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mt-4 border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle2 className="h-4 w-4 text-emerald-400"/><AlertDescription className="text-emerald-200">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-4 gap-4 my-6">
          <Card className="border-white/10 bg-white/[0.02]">
            <CardContent className="p-4">
              <Calendar className="h-4 w-4 text-white/50 mb-1"/>
              <p className="text-xs text-white/50">Starts</p>
              <p className="text-sm text-white">{formatDate(contest.startTime)}</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/[0.02]">
            <CardContent className="p-4">
              <Clock className="h-4 w-4 text-white/50 mb-1"/>
              <p className="text-xs text-white/50">Ends</p>
              <p className="text-sm text-white">{formatDate(contest.endTime)}</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/[0.02]">
            <CardContent className="p-4">
              <Users className="h-4 w-4 text-white/50 mb-1"/>
              <p className="text-xs text-white/50">Participants</p>
              <p className="text-sm text-white">{contest.participants?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/[0.02]">
            <CardContent className="p-4">
              <Code2 className="h-4 w-4 text-white/50 mb-1"/>
              <p className="text-xs text-white/50">Problems</p>
              <p className="text-sm text-white">{contest.problems?.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="problems">
          <TabsList className="bg-transparent border-b border-white/10 w-full justify-start rounded-none p-0 mb-6">
            <TabsTrigger value="problems" className="data-[state=active]:border-b-2 hover:text-mist-100  data-[state=active]:border-violet-400 rounded-none px-6 py-3 text-white/60 data-[state=active]:text-black">
              Problems
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:border-b-2 hover:text-mist-100 data-[state=active]:border-violet-400 rounded-none px-6 py-3 text-white/60 data-[state=active]:text-black">
              Leaderboard
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="problems">
            <Card className="border-white/10 bg-white/[0.02]">
              <CardContent className="p-0">
                {isRegistered ? (
                  <div className="divide-y divide-white/10">
                    {userProblems.length > 0 ? (
                      userProblems.map((cp: any, i: number) => (
                        <Link 
                          key={cp.id} 
                          href={isLive ? `/contests/${contest.slug}/problems/${cp.problem.slug}` : '#'} 
                          className={`flex justify-between p-4 text-white ${isLive ? 'hover:bg-white/5 cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                          onClick={(e) => !isLive && e.preventDefault()}
                        >
                          <div className="flex gap-4">
                            <span className="text-white/40 w-8">{String.fromCharCode(65 + i)}</span>
                            <span>{cp.problem.title}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getDifficultyBadge(cp.problem.difficulty)}>
                              {cp.problem.difficulty}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-white/30" />
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="text-center py-12 text-white/40">
                        No problems assigned to your division yet
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-white/40">
                    <Code2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p>Register to view problems</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="leaderboard">
            <Card className="border-white/10 bg-white/[0.02]">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Leaderboard</CardTitle>
                  <div className="flex gap-2">
                    {Object.keys(leaderboardByDivision).map(d => (
                      <button
                        key={d}
                        onClick={() => setSelectedDivision(d)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          selectedDivision === d
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                            : 'text-white/50 hover:text-white'
                        }`}
                      >
                        {getDivisionLabel(d as any)}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {leaderboardByDivision[selectedDivision]?.length > 0 ? (
                  <div className="divide-y divide-white/10">
                    <div className="grid grid-cols-12 px-6 py-3 text-xs text-white/40 uppercase tracking-wider">
                      <div>Rank</div>
                      <div className="col-span-5">User</div>
                      <div className="text-center col-span-2">Rating</div>
                      <div className="text-center col-span-2">Solved</div>
                      <div className="text-right col-span-2">Score</div>
                    </div>
                    {leaderboardByDivision[selectedDivision].map((p: any, i: number) => (
                      <div key={p.id} className="grid grid-cols-12 px-6 py-3 hover:bg-white/5">
                        <div className={`font-medium ${
                          i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-white/60'
                        }`}>
                          #{i + 1}
                        </div>
                        <div className="col-span-5 text-white">{p.user?.name || 'Anonymous'}</div>
                        <div className={`text-center col-span-2 ${getDivisionColor(p.division)}`}>
                          {p.user?.contestRating || 800}
                        </div>
                        <div className="text-center col-span-2 text-white">{p.solvedCount || 0}</div>
                        <div className="text-right col-span-2 text-emerald-400 font-medium">{p.score || 0}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-white/40">
                    No participants in this division yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
