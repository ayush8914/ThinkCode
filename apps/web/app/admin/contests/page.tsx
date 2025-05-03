'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Trophy,
  Clock,
  Loader2,
} from 'lucide-react';

interface Contest {
  id: string;
  title: string;
  slug: string;
  contestName: string;
  contestType: string;
  startTime: string;
  endTime: string;
  isPublic: boolean;
  divisions: { division: string }[];
  _count: { problems: number; participants: number };
}

export default function AdminContestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchContests();
  }, [session, status, router]);

  const fetchContests = async () => {
    try {
      const res = await fetch('/api/contests?admin=true');
      const data = await res.json();
      if (data.success) {
        setContests(data.contests);
      }
    } catch (error) {
      console.error('Failed to fetch contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contest?')) return;
    try {
      const res = await fetch(`/api/contests/by-id/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setContests(contests.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const now = new Date();
  const getStatus = (contest: Contest) => {
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    if (now < start) return { label: 'Upcoming', color: 'bg-blue-500/20 text-blue-300' };
    if (now > end) return { label: 'Ended', color: 'bg-gray-500/20 text-gray-300' };
    return { label: 'Live', color: 'bg-emerald-500/20 text-emerald-300' };
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#0a0a0f] text-white font-mono">
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Contests Management</h1>
            <p className="text-white/40">Create and manage coding contests</p>
          </div>
          <Link href="/admin/contests/create">
            <Button className="bg-violet-600 hover:bg-violet-500">
              <Plus className="h-4 w-4 mr-2" />
              Create Contest
            </Button>
          </Link>
        </div>

        <Card className="border-white/10 bg-white/[0.02]">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">Title</TableHead>
                  <TableHead className="text-white/60">Type</TableHead>
                  <TableHead className="text-white/60">Divisions</TableHead>
                  <TableHead className="text-white/60">Problems</TableHead>
                  <TableHead className="text-white/60">Participants</TableHead>
                  <TableHead className="text-white/60">Timing</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-white/60 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contests.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={8} className="text-center py-12 text-white/40">
                      <Trophy className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p>No contests yet. Create your first contest!</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  contests.map((contest) => {
                    const status = getStatus(contest);
                    return (
                      <TableRow key={contest.id} className="border-white/10">
                        <TableCell className="font-medium text-white">
                          <Link href={`/contests/${contest.slug}`} className="hover:text-violet-400">
                            {contest.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
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
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {contest.divisions.map(d => (
                              <Badge key={d.division} className="bg-white/10 text-white/60 text-xs">
                                {d.division}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-white/60">{contest._count.problems}</TableCell>
                        <TableCell className="text-white/60">{contest._count.participants}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div className="flex items-center gap-1 text-white/50">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(contest.startTime)}</span>
                            </div>
                            <div className="text-white/30">→</div>
                            <div className="flex items-center gap-1 text-white/50">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(contest.endTime)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/contests/${contest.slug}`}>
                              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/admin/contests/${contest.id}/problems`}>
                              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                                <Trophy className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/admin/contests/${contest.id}/edit`}>
                              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(contest.id)}
                              className="text-rose-400 hover:text-rose-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}