import { prisma } from '@repo/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CodeEditor from '@/components/CodeEditor';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Clock, HardDrive, ArrowLeft } from 'lucide-react';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

const difficultyColors = {
  EASY: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  MEDIUM: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  HARD: 'text-rose-400 border-rose-500/30 bg-rose-500/5',
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProblemPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);

  const problem = await prisma.problem.findUnique({
    where: { slug },
    include: {
      testCases: {
        where: { isSample: true },
        orderBy: { orderIndex: 'asc' }
      },
      tags: {
        include: { tag: true }
      }
    }
  });

  if (!problem) {
    notFound();
  }

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
          <div className="flex items-center gap-4">
            <Link
              href={session?.user?.role === 'ADMIN' ? '/admin/problems' : '/'}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Problems</span>
            </Link>

            <div className="h-6 w-px bg-white/10" />

            <h1 className="text-xl font-bold">{problem.title}</h1>
            <span className={`px-3 py-1 text-xs font-medium rounded-md border ${difficultyColors[problem.difficulty]}`}>
              {problem.difficulty}
            </span>
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Clock className="h-4 w-4" />
              <span>{problem.timeLimitMs}ms</span>
              <HardDrive className="h-4 w-4 ml-2" />
              <span>{Math.round(problem.memoryLimitKb / 1024)}MB</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/2 overflow-y-auto border-r border-white/10">
            <div className="p-6">
              <div className="flex gap-2 mb-6">
                {problem.tags.map(({ tag }) => (
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
                    {problem.testCases.map((tc, idx) => (
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
            <CodeEditor problemId={problem.id} />
          </div>
        </div>
      </div>
    </main>
  );
}