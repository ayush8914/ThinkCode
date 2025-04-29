'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, useTransition } from 'react';
import { Circle, ArrowLeft, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSession } from 'next-auth/react';

const difficultyColors = {
  EASY: 'text-emerald-400',
  MEDIUM: 'text-amber-400',
  HARD: 'text-rose-400',
};

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: { id: string; name: string }[];
  _count: { submissions: number };
  userStatus?: 'SOLVED' | 'ATTEMPTED' | 'NONE';
}

interface Tag {
  id: string;
  name: string;
}

const PAGE_SIZE = 8;

export default function ProblemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();


  const [problems, setProblems] = useState<Problem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProblems, setTotalProblems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const currentPage = parseInt(searchParams.get('page') || '1');
  const selectedDifficulty = searchParams.get('difficulty') || '';
  const selectedTag = searchParams.get('tag') || '';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [currentPage, selectedDifficulty, selectedTag, search]);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      const data = await response.json();
      if (data.success) {
        setTags(data.tags);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const fetchProblems = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedDifficulty) params.set('difficulty', selectedDifficulty);
      if (selectedTag) params.set('tag', selectedTag);
      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', ((currentPage - 1) * PAGE_SIZE).toString());
      
      const response = await fetch(`/api/problems?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      
      if (!text) {
        console.error('Empty response from API');
        setProblems([]);
        setTotalProblems(0);
        setTotalPages(1);
        return;
      }
      
      const data = JSON.parse(text);
      
      if (data.success) {
        setProblems(data.problems || []);
        setTotalProblems(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / PAGE_SIZE));
      } else {
        console.error('API error:', data.error);
        setProblems([]);
        setTotalProblems(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Failed to fetch problems:', error);
      setProblems([]);
      setTotalProblems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    if (updates.difficulty !== undefined || updates.tag !== undefined || updates.search !== undefined) {
      params.set('page', '1');
    }
    
    startTransition(() => {
      router.push(`/problems?${params.toString()}`);
    });
  }, [router, searchParams]);

  const handleDifficultyChange = (difficulty: string) => {
    updateFilters({ difficulty: difficulty || null });
  };

  const handleTagChange = (tag: string) => {
    updateFilters({ tag: tag || null });
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const timeoutId = setTimeout(() => {
      updateFilters({ search: value || null });
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page: page.toString() });
  };

  const getStatusIcon = (status?: string) => {
    if (status === 'SOLVED') {
      return <Circle className="h-4 w-4 text-emerald-400 fill-emerald-400" />;
    }
    if (status === 'ATTEMPTED') {
      return <Circle className="h-4 w-4 text-amber-400 fill-amber-400/50" />;
    }
    return <Circle className="h-4 w-4 text-white/20 group-hover:text-violet-400/50 transition-colors" />;
  };

  if (isLoading && problems.length === 0) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] text-white font-mono relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="relative z-10 px-6 md:px-12 py-12 max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white font-mono relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative z-10 px-6 md:px-12 py-12 max-w-6xl mx-auto">
        <Link
          href={session?.user?.role === 'ADMIN' ? '/admin' : '/'}
          className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-md text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Problems</h1>
          <p className="text-white/40 font-sans">
            Practice coding challenges and improve your skills
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedDifficulty}
              onChange={(e) => handleDifficultyChange(e.target.value)}
              disabled={isPending}
              className="px-4 py-2 rounded-md text-sm bg-white/5 border border-white/10 text-white/70 font-mono cursor-pointer hover:bg-white/10 transition-colors appearance-none pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>

            <select
              value={selectedTag}
              onChange={(e) => handleTagChange(e.target.value)}
              disabled={isPending}
              className="px-4 py-2 rounded-md text-sm bg-white/5 border border-white/10 text-white/70 font-mono cursor-pointer hover:bg-white/10 transition-colors appearance-none pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All Tags</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.name}>
                  {tag.name}
                </option>
              ))}
            </select>

            {(selectedDifficulty || selectedTag || search) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleDifficultyChange('');
                  handleTagChange('');
                  updateFilters({ difficulty: null, tag: null, search: null });
                }}
                className="px-3 py-1.5 text-xs text-white/50 hover:text-white/70 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/[0.02] border-b border-white/10 text-xs text-white/40 uppercase tracking-wider">
            <div className="col-span-1">Status</div>
            <div className="col-span-5">Title</div>
            <div className="col-span-2">Difficulty</div>
            <div className="col-span-2">Tags</div>
            <div className="col-span-2 text-right">Submissions</div>
          </div>

          <div className="divide-y divide-white/5 relative">
            {isPending && problems.length > 0 && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-10">
                <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
              </div>
            )}
            
            {problems.map((problem) => (
              <Link
                key={problem.id}
                href={`/problems/${problem.slug}`}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="col-span-1 flex items-center">
                  {getStatusIcon(problem.userStatus)}
                </div>

                <div className="col-span-5 flex items-center">
                  <span className="text-white/90 group-hover:text-violet-400 transition-colors">
                    {problem.title}
                  </span>
                </div>

                <div className="col-span-2 flex items-center">
                  <span className={`text-sm font-medium ${difficultyColors[problem.difficulty]}`}>
                    {problem.difficulty}
                  </span>
                </div>

                <div className="col-span-2 flex items-center gap-1 flex-wrap">
                  {problem.tags.slice(0, 2).map((tag) => (
                    <span 
                      key={tag.id}
                      className="px-2 py-0.5 text-[10px] rounded bg-white/5 text-white/50 group-hover:bg-violet-500/10 group-hover:text-violet-400 transition-colors"
                    >
                      {tag.name}
                    </span>
                  ))}
                  {problem.tags.length > 2 && (
                    <span className="text-[10px] text-white/30">+{problem.tags.length - 2}</span>
                  )}
                </div>

                <div className="col-span-2 flex items-center justify-end">
                  <span className="text-sm text-white/40 font-mono">
                    {problem._count.submissions.toLocaleString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-white/40">
              Showing {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, totalProblems)} of {totalProblems} problems
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isPending}
                className="p-2 rounded-md border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isPending}
                      className={`h-8 w-8 rounded-md text-sm font-mono transition-colors ${
                        pageNum === currentPage
                          ? 'bg-violet-600 text-white'
                          : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isPending}
                className="p-2 rounded-md border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {problems.length === 0 && !isPending && (
          <div className="text-center py-20">
            <p className="text-white/40 font-mono">No problems found.</p>
            {(selectedDifficulty || selectedTag || search) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  updateFilters({ difficulty: null, tag: null, search: null });
                }}
                className="inline-block mt-4 text-violet-400 hover:text-violet-300 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}