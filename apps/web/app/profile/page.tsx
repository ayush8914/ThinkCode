import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@repo/db';
import { ActivityHeatMap } from '@/components/ActivityHeatMap';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import {
  Trophy,
  Code2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Award,
  GitBranch,
  Star,
  Settings,
  Edit,
  Mail,
  ExternalLink,
} from 'lucide-react';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      submissions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          problem: {
            select: { id: true, title: true, slug: true, difficulty: true },
          },
        },
      },
    },
  });
  
  if (!user) {
    redirect('/auth/signin');
  }
  
  // Calculate stats
  const totalSubmissions = user.submissions.length;
  const acceptedSubmissions = user.submissions.filter(s => s.status === 'ACCEPTED').length;
  const uniqueProblemsSolved = new Set(
    user.submissions.filter(s => s.status === 'ACCEPTED').map(s => s.problemId)
  ).size;
  
  const submissionsByDifficulty = {
    EASY: user.submissions.filter(s => s.problem.difficulty === 'EASY' && s.status === 'ACCEPTED').length,
    MEDIUM: user.submissions.filter(s => s.problem.difficulty === 'MEDIUM' && s.status === 'ACCEPTED').length,
    HARD: user.submissions.filter(s => s.problem.difficulty === 'HARD' && s.status === 'ACCEPTED').length,
  };
  
  const languageStats = user.submissions.reduce((acc, sub) => {
    acc[sub.language] = (acc[sub.language] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostUsedLanguage = Object.entries(languageStats).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  
  return (
    <main className="relative min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden font-mono">
      {/* Background Grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      
      {/* Gradient Overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[420px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(ellipse at center, #7c3aed 0%, transparent 70%)",
        }}
      />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="rounded-sm border border-white/10 bg-white/[0.02] p-6 mb-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24 border-2 border-violet-500/30">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="bg-violet-500/20 text-2xl">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-1">{user.name || 'Coder'}</h1>
                  <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
                    <Mail className="h-3 w-3" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                      {user.role}
                    </Badge>
                    {user.provider && (
                      <Badge variant="outline" className="border-white/20 text-white/50">
                        {user.provider}
                      </Badge>
                    )}
                    <span className="text-white/30 text-sm">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-sm border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/50 text-sm">Problems Solved</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold">{uniqueProblemsSolved}</p>
            <div className="flex gap-3 mt-2 text-xs">
              <span className="text-emerald-400">Easy: {submissionsByDifficulty.EASY}</span>
              <span className="text-amber-400">Med: {submissionsByDifficulty.MEDIUM}</span>
              <span className="text-rose-400">Hard: {submissionsByDifficulty.HARD}</span>
            </div>
          </div>
          
          <div className="rounded-sm border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/50 text-sm">Acceptance Rate</span>
              <TrendingUp className="h-4 w-4 text-violet-400" />
            </div>
            <p className="text-3xl font-bold">
              {totalSubmissions > 0 
                ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(1) 
                : '0.0'}%
            </p>
            <p className="text-xs text-white/40 mt-2">
              {acceptedSubmissions} accepted / {totalSubmissions} total
            </p>
          </div>
          
          <div className="rounded-sm border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/50 text-sm">Contest Rating</span>
              <Trophy className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-3xl font-bold">
              {user.contestRating || '—'}
            </p>
            <p className="text-xs text-amber-400 mt-2">Max: {user.maxContestRating || '—'}</p>
          </div>
          
          <div className="rounded-sm border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/50 text-sm">Primary Language</span>
              <Code2 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold">{mostUsedLanguage}</p>
            <p className="text-xs text-white/40 mt-2">
              {Object.keys(languageStats).length} languages used
            </p>
          </div>
        </div>
        
        {/* Activity Heat Map */}
        <div className="mb-6">
          <ActivityHeatMap userId={session.user.id} />
        </div>
        
        {/* Tabs Section */}
        <Tabs defaultValue="submissions" className="w-full">
          <TabsList className="bg-transparent border-b border-white/10 w-full justify-start rounded-none h-auto p-0 mb-6">
            <TabsTrigger 
              value="submissions"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-violet-400 rounded-none px-6 py-3 text-white/60 data-[state=active]:text-white"
            >
              Recent Submissions
            </TabsTrigger>
            <TabsTrigger 
              value="statistics"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-violet-400 rounded-none px-6 py-3 text-white/60 data-[state=active]:text-white"
            >
              Statistics
            </TabsTrigger>
            <TabsTrigger 
              value="achievements"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-violet-400 rounded-none px-6 py-3 text-white/60 data-[state=active]:text-white"
            >
              Achievements
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="submissions">
            <div className="rounded-sm border border-white/10 bg-white/[0.02]">
              {user.submissions.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {user.submissions.map((submission) => (
                    <Link
                      key={submission.id}
                      href={`/problems/${submission.problem.slug}`}
                      className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-2 w-2 rounded-full ${
                          submission.status === 'ACCEPTED' ? 'bg-emerald-400' :
                          submission.status === 'WRONG_ANSWER' ? 'bg-rose-400' :
                          submission.status === 'TIME_LIMIT_EXCEEDED' ? 'bg-amber-400' :
                          submission.status === 'COMPILATION_ERROR' ? 'bg-orange-400' :
                          'bg-gray-400'
                        }`} />
                        <div>
                          <p className="font-medium group-hover:text-violet-400 transition-colors">
                            {submission.problem.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge className={`
                              ${submission.problem.difficulty === 'EASY' ? 'bg-emerald-500/20 text-emerald-300' :
                                submission.problem.difficulty === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' :
                                'bg-rose-500/20 text-rose-300'}
                            `}>
                              {submission.problem.difficulty}
                            </Badge>
                            <span className="text-white/40 text-xs">{submission.language}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm ${
                          submission.status === 'ACCEPTED' ? 'text-emerald-400' :
                          submission.status === 'WRONG_ANSWER' ? 'text-rose-400' :
                          'text-amber-400'
                        }`}>
                          {submission.status.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                        </p>
                        <p className="text-white/30 text-xs mt-1">
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Code2 className="h-12 w-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">No submissions yet.</p>
                  <Button asChild className="mt-4 bg-violet-600 hover:bg-violet-500">
                    <Link href="/problems">Start Coding</Link>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="statistics">
            <div className="rounded-sm border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-lg font-semibold mb-4">Language Distribution</h3>
              <div className="space-y-3">
                {Object.entries(languageStats).map(([lang, count]) => (
                  <div key={lang}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/70">{lang}</span>
                      <span className="text-white/50">{count} submissions</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${(count / totalSubmissions) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="achievements">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {uniqueProblemsSolved >= 1 && (
                <div className="rounded-sm border border-white/10 bg-white/[0.02] p-4">
                  <Award className="h-8 w-8 text-amber-400 mb-3" />
                  <h4 className="font-semibold mb-1">First Blood</h4>
                  <p className="text-white/40 text-sm">Solved your first problem</p>
                </div>
              )}
              {uniqueProblemsSolved >= 10 && (
                <div className="rounded-sm border border-white/10 bg-white/[0.02] p-4">
                  <Star className="h-8 w-8 text-violet-400 mb-3" />
                  <h4 className="font-semibold mb-1">Problem Solver</h4>
                  <p className="text-white/40 text-sm">Solved 10+ problems</p>
                </div>
              )}
              {uniqueProblemsSolved >= 50 && (
                <div className="rounded-sm border border-white/10 bg-white/[0.02] p-4">
                  <Trophy className="h-8 w-8 text-emerald-400 mb-3" />
                  <h4 className="font-semibold mb-1">Code Master</h4>
                  <p className="text-white/40 text-sm">Solved 50+ problems</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}