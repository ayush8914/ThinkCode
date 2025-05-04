'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import CodeEditor from '@/components/CodeEditor';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Clock, HardDrive, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

const difficultyColors = {
  EASY: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  MEDIUM: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  HARD: 'text-rose-400 border-rose-500/30 bg-rose-500/5',
};

interface ContestProblemClientProps {
  contest: any;
  problem: any;
  contestProblem: any;
  isEnded: boolean;
  userDivision: string;
}

export default function ContestProblemClient({
  contest,
  problem,
  contestProblem,
  isEnded,
  userDivision,
}: ContestProblemClientProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState('');
  
  const problems = contest.problems
    .filter((cp: any) => cp.visibleToDivisions.includes(userDivision))
    .sort((a: any, b: any) => a.orderIndex - b.orderIndex);
  
  const currentIndex = problems.findIndex((cp: any) => cp.id === contestProblem.id);
  const prevProblem = currentIndex > 0 ? problems[currentIndex - 1] : null;
  const nextProblem = currentIndex < problems.length - 1 ? problems[currentIndex + 1] : null;
  
  useEffect(() => {
    if (!isEnded) {
      const updateTimer = () => {
        const now = new Date();
        const end = new Date(contest.endTime);
        const diff = end.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeLeft('Contest ended');
          return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [contest.endTime, isEnded]);
  
  return (
    <main className="min-h-screen bg-[#06060e] text-white font-mono relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative z-10 h-screen flex flex-col">
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/contests/${contest.slug}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Contest</span>
              </Link>

              <div className="h-6 w-px bg-white/10" />

              <h1 className="text-xl font-bold">
                {String.fromCharCode(65 + currentIndex)}. {problem.title}
              </h1>
              <span className={`px-3 py-1 text-xs font-medium rounded-md border `}>
                {problem.difficulty}
              </span>
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <Clock className="h-4 w-4" />
                <span>{problem.timeLimitMs}ms</span>
                <HardDrive className="h-4 w-4 ml-2" />
                <span>{Math.round(problem.memoryLimitKb / 1024)}MB</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {!isEnded && timeLeft && timeLeft !== 'Contest ended' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-400 font-mono text-sm">{timeLeft}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                {prevProblem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/contests/${contest.slug}/problems/${prevProblem.problem.slug}`)}
                    className="text-white/60 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <span className="text-white/40 text-sm px-2">
                  {currentIndex + 1}/{problems.length}
                </span>
                {nextProblem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/contests/${contest.slug}/problems/${nextProblem.problem.slug}`)}
                    className="text-white/60 hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/2 overflow-y-auto border-r border-white/10">
            <div className="p-6">
              <div className="flex gap-2 mb-6">
                {problem.tags.map(({ tag }: any) => (
                  <span 
                    key={tag.id}
                    className="px-3 py-1 text-xs rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>

              <MarkdownRenderer content={problem.description} />

              {problem.testCases.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Examples</h3>
                  <div className="space-y-4">
                    {problem.testCases.map((tc: any, idx: number) => (
                      <div key={tc.id} className="rounded-lg border border-white/10 overflow-hidden">
                        <div className="px-4 py-2 bg-white/[0.02] border-b border-white/10">
                          <span className="text-sm font-medium text-white/60">Example {idx + 1}</span>
                        </div>
                        <div className="p-4 space-y-3">
                          <div>
                            <span className="text-xs text-white/40 uppercase tracking-wider">Input</span>
                            <pre className="mt-1 p-3 rounded bg-black/30 text-sm text-white/70 font-mono border border-white/5">
                              {tc.input}
                            </pre>
                          </div>
                          <div>
                            <span className="text-xs text-white/40 uppercase tracking-wider">Output</span>
                            <pre className="mt-1 p-3 rounded bg-black/30 text-sm text-white/70 font-mono border border-white/5">
                              {tc.output}
                            </pre>
                          </div>
                          {tc.explanation && (
                            <div>
                              <span className="text-xs text-white/40 uppercase tracking-wider">Explanation</span>
                              <p className="mt-1 text-sm text-white/60 font-sans">{tc.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-1/2 flex flex-col">
            <CodeEditor 
              problemId={problem.id} 
              contestId={contest.id}
              isContest={true}
              isEnded={isEnded}
            />
          </div>
        </div>
      </div>
    </main>
  );
}