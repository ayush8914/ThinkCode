"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  Terminal,
  Zap,
  Trophy,
  Users,
  ChevronRight,
  Braces,
  Code,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  Activity,
} from "lucide-react";

const PROBLEMS = [
  { tag: "Array", title: "Two Sum", diff: "Easy", color: "text-emerald-400" },
  { tag: "DP", title: "Climbing Stairs", diff: "Easy", color: "text-emerald-400" },
  { tag: "Graph", title: "Course Schedule", diff: "Medium", color: "text-amber-400" },
  { tag: "Tree", title: "Binary Tree Max Path", diff: "Hard", color: "text-rose-400" },
  { tag: "String", title: "Longest Palindrome", diff: "Medium", color: "text-amber-400" },
];

const STATS = [
  { label: "Problems", value: "800+" },
  { label: "Developers", value: "12K+" },
  { label: "Contests", value: "50+" },
];

const FEATURES = [
  {
    icon: <Terminal className="h-5 w-5" />,
    title: "In-browser IDE",
    desc: "Write, run and debug code right in your browser. Supports 10+ languages.",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Instant feedback",
    desc: "Test cases run in milliseconds. See exactly where your logic breaks.",
  },
  {
    icon: <Trophy className="h-5 w-5" />,
    title: "Weekly contests",
    desc: "Compete live against peers and climb the global leaderboard.",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Community",
    desc: "Discuss approaches, share solutions, and learn from others.",
  },
];

interface RecentSubmission {
  id: string;
  problem: {
    title: string;
    slug: string;
  };
  status: string;
  language: string;
  createdAt: string;
  executionTimeMs: number | null;
}

const RECOMMENDED_PROBLEMS = [
  { title: "Longest Substring", difficulty: "Medium", tag: "String", solved: "45%" },
  { title: "Binary Tree Level Order", difficulty: "Medium", tag: "Tree", solved: "38%" },
  { title: "Coin Change", difficulty: "Medium", tag: "DP", solved: "52%" },
];

export default function Home() {
  const { data: session, status } = useSession();
  const [activeIdx, setActiveIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [stats, setStats] = useState({
    problemsSolved: 0,
    contestRating: 0,
    currentStreak: 0,
    globalRank: 0,
    weeklySolved: 0,
  });
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Carousel interval
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % PROBLEMS.length);
    }, 1800);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Fetch data ONLY when authenticated
  useEffect(() => {
    // Only fetch if we have a valid session and user ID
    if (status === 'authenticated' && session?.user?.id) {
      fetchRecentSubmissions();
      fetchUserStats();
    }
    
    // Reset state when unauthenticated (on logout)
    if (status === 'unauthenticated') {
      setRecentSubmissions([]);
      setStats({
        problemsSolved: 0,
        contestRating: 0,
        currentStreak: 0,
        globalRank: 0,
        weeklySolved: 0,
      });
      setLoadingSubmissions(false);
    }
  }, [session, status]); // Depend on both session and status

  const fetchRecentSubmissions = async () => {
    // Guard clause - don't fetch if not authenticated
    if (!session?.user?.id) return;
    
    setLoadingSubmissions(true);
    try {
      const response = await fetch(`/api/submissions/recent?userId=${session.user.id}&limit=5`);
      const data = await response.json();
      if (data.success) {
        setRecentSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent submissions:', error);
      setRecentSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const fetchUserStats = async () => {
    // Guard clause - don't fetch if not authenticated
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/user/stats?userId=${session.user.id}`);
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-emerald-400';
      case 'WRONG_ANSWER':
      case 'TIME_LIMIT_EXCEEDED':
      case 'RUNTIME_ERROR':
      case 'COMPILATION_ERROR':
        return 'bg-rose-400';
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-amber-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'text-emerald-400';
      case 'WRONG_ANSWER':
      case 'TIME_LIMIT_EXCEEDED':
      case 'RUNTIME_ERROR':
      case 'COMPILATION_ERROR':
        return 'text-rose-400';
      default:
        return 'text-amber-400';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Loading state
  if (status === 'loading') {
    return (
      <main className="relative min-h-screen bg-[#0a0a0f] text-white font-mono">
        <div className="flex items-center justify-center min-h-screen">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
        </div>
      </main>
    );
  }

  // Authenticated User Dashboard
  if (session) {
    return (
      <main className="relative min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden font-mono">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[420px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at center, #7c3aed 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 px-6 md:px-12 py-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Welcome back,{" "}
              <span className="text-violet-400">{session.user?.name || 'Coder'}</span>!
            </h1>
            <p className="text-white/50 font-sans">
              Ready to solve today's challenges?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-sm border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Problems Solved</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.problemsSolved || 0}</p>
              <p className="text-xs text-emerald-400 mt-2">+{stats.weeklySolved || 0} this week</p>
            </div>
            <div className="rounded-sm border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Contest Rating</span>
                <TrendingUp className="h-4 w-4 text-violet-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.contestRating || '—'}</p>
              <p className="text-xs text-violet-400 mt-2">Coming soon</p>
            </div>
            <div className="rounded-sm border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Current Streak</span>
                <Activity className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.currentStreak || 0} days</p>
              <p className="text-xs text-amber-400 mt-2">Best: {stats.currentStreak || 0} days</p>
            </div>
            <div className="rounded-sm border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Global Rank</span>
                <Trophy className="h-4 w-4 text-rose-400" />
              </div>
              <p className="text-3xl font-bold text-white">#{stats.globalRank || '—'}</p>
              <p className="text-xs text-rose-400 mt-2">Coming soon</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex gap-3">
                <Button
                  asChild
                  className="bg-violet-600 hover:bg-violet-500 text-white font-mono border-0"
                >
                  <Link href="/problems">
                    <Code className="mr-2 h-4 w-4" />
                    Daily Challenge
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/5 font-mono"
                >
                  <Link href="/contests">
                    <Calendar className="mr-2 h-4 w-4" />
                    Upcoming Contest
                  </Link>
                </Button>
              </div>

              <div className="rounded-sm border border-white/10 bg-white/[0.02] p-5">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-violet-400" />
                  Recommended for You
                </h3>
                <div className="space-y-2">
                  {RECOMMENDED_PROBLEMS.map((problem, i) => (
                    <Link
                      key={i}
                      href={`/problems/${problem.title.toLowerCase().replace(/\s+/g, '-')}`}
                      className="flex items-center justify-between p-3 rounded-sm border border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-white/30 text-sm w-6">{i + 1}.</span>
                        <span className="text-white/90 group-hover:text-violet-400 transition-colors">
                          {problem.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs border-white/20 text-white/50">
                          {problem.tag}
                        </Badge>
                        <span className={`text-xs ${
                          problem.difficulty === 'Easy' ? 'text-emerald-400' :
                          problem.difficulty === 'Medium' ? 'text-amber-400' :
                          'text-rose-400'
                        }`}>
                          {problem.difficulty}
                        </span>
                        <span className="text-white/30 text-xs">{problem.solved}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/problems"
                  className="inline-flex items-center gap-1 text-violet-400 text-sm mt-4 hover:text-violet-300 transition-colors"
                >
                  View all problems <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-sm border border-white/10 bg-white/[0.02] p-5">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-violet-400" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {loadingSubmissions ? (
                    <div className="text-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-400 border-t-transparent mx-auto" />
                    </div>
                  ) : recentSubmissions.length > 0 ? (
                    recentSubmissions.map((submission) => (
                      <Link
                        key={submission.id}
                        href={`/problems/${submission.problem.slug}`}
                        className="flex items-start gap-3 p-2 rounded-sm hover:bg-white/5 transition-colors group"
                      >
                        <div className={`mt-1 h-2 w-2 rounded-full ${getStatusColor(submission.status)}`} />
                        <div className="flex-1">
                          <p className="text-sm text-white/90 group-hover:text-violet-400 transition-colors">
                            {submission.problem.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs ${getStatusTextColor(submission.status)}`}>
                              {formatStatus(submission.status)}
                            </span>
                            <span className="text-white/30 text-xs">•</span>
                            <span className="text-white/40 text-xs">{submission.language}</span>
                            <span className="text-white/30 text-xs">•</span>
                            <span className="text-white/40 text-xs">{formatTimeAgo(submission.createdAt)}</span>
                            {submission.executionTimeMs && (
                              <>
                                <span className="text-white/30 text-xs">•</span>
                                <span className="text-white/40 text-xs">{submission.executionTimeMs}ms</span>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white/40 text-sm">No submissions yet.</p>
                      <Link href="/problems" className="text-violet-400 text-sm hover:text-violet-300 mt-2 inline-block">
                        Solve your first problem →
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-sm border border-white/10 bg-white/[0.02] p-5">
                <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
                <div className="flex justify-between gap-1">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} className="text-center">
                      <div className={`h-16 w-8 rounded-sm mb-1 ${
                        i < (stats.weeklySolved || 0) ? 'bg-violet-500/40' : 'bg-white/10'
                      }`} />
                      <span className="text-xs text-white/40">{day}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/40 mt-4 text-center">
                  {stats.weeklySolved || 0} problem{stats.weeklySolved !== 1 ? 's' : ''} solved this week
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Unauthenticated Landing Page (unchanged)
  return (
    <main className="relative min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden font-mono">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, #7c3aed 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 px-6 md:px-12 py-8 max-w-7xl mx-auto">

        <div className="grid lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-white/70">Platform of the year 2025</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Master <span className="text-violet-400">Data Structures</span>
              <br />
              <span className="text-white/90">& Algorithms</span>
            </h1>
            <p className="text-white/50 font-sans text-lg max-w-lg mb-8">
              ThinkCode is the ultimate platform to hone your coding skills, prepare for interviews, and compete with developers worldwide.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-500 text-white font-mono border-0">
                <Link href="/problems">
                  Start Coding <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/5 font-mono">
                <Link href="/contests">View Contests</Link>
              </Button>
            </div>

            <div className="flex gap-8 mt-12">
              {STATS.map((stat, i) => (
                <div key={i}>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-white/40 text-sm font-sans">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent rounded-xl blur-2xl" />
            <div className="relative rounded-sm border border-white/10 bg-[#0f0f14] p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="text-white/40 text-xs font-sans ml-2">terminal</span>
              </div>

              <div className="flex items-center gap-2 text-emerald-400 text-xs mb-2">
                <span className="text-white/40">$</span>
                <span>thinkcode run two-sum.py</span>
              </div>

              <div className="space-y-1.5 font-mono">
                {PROBLEMS.map((prob, i) => (
                  <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-300 ${i === activeIdx ? 'opacity-100 translate-x-0' : 'opacity-0 absolute'}`}>
                    <span className="text-white/30 w-16">{prob.tag}</span>
                    <span className="text-white/90">{prob.title}</span>
                    <span className={`ml-auto text-xs ${prob.color}`}>{prob.diff}</span>
                  </div>
                ))}
                <div className="h-[72px]"></div>
              </div>

              <div className="border-t border-white/5 mt-3 pt-3">
                <div className="flex items-center gap-2 text-white/40 text-xs">
                  <span className="text-emerald-400">✓</span>
                  <span>All test cases passed (3/3)</span>
                </div>
                <div className="flex items-center gap-2 text-white/40 text-xs mt-1">
                  <span>Runtime: 48ms (beats 89%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-16 border-t border-white/5">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Everything you need</h2>
            <p className="text-white/50 font-sans">Designed for developers who want to excel.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feat, i) => (
              <div key={i} className="rounded-sm border border-white/10 bg-white/[0.02] p-5 hover:border-violet-500/20 transition-colors">
                <div className="h-8 w-8 rounded-sm bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4">
                  {feat.icon}
                </div>
                <h3 className="font-semibold mb-2">{feat.title}</h3>
                <p className="text-white/40 text-sm font-sans leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center py-12 border-t border-white/5">
          <p className="text-white/30 text-sm font-sans">
            © 2025 ThinkCode — Built for developers.
          </p>
        </div>
      </div>
    </main>
  );
}