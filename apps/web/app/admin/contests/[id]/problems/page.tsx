'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  Wand2,
} from 'lucide-react';
import { use } from 'react';
import { 
  getProblemLimit, 
  sortProblemsByDifficulty, 
  autoAssignVisibleDivisions,
  PROBLEM_LIMITS, 
  calculateVisibleToDivisions
} from '@/lib/contest-problems';

export default function ContestProblemsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [contest, setContest] = useState<any>(null);
  const [assignedProblems, setAssignedProblems] = useState<any[]>([]);
  const [availableProblems, setAvailableProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoAssigning, setAutoAssigning] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [selectedProblemId, setSelectedProblemId] = useState('');

  // Get problem limit based on contest divisions
  const problemLimit = contest?.divisions 
    ? getProblemLimit(contest.divisions.map((d: any) => d.division))
    : 4;
  
  const canAddMore = assignedProblems.length < problemLimit;

  useEffect(() => {
    fetchContest();
  }, [id]);

  useEffect(() => {
    if (!loading) {
      fetchAvailableProblems();
    }
  }, [searchQuery, difficultyFilter, assignedProblems]);

  const fetchContest = async () => {
    try {
      const res = await fetch(`/api/contests/by-id/${id}`);
      const data = await res.json();
      if (data.success) {
        setContest(data.contest);
        // Sort assigned problems by difficulty/rating
        const sorted = sortProblemsByDifficulty(data.contest.problems || []);
        setAssignedProblems(sorted);
      }
    } catch (error) {
      console.error('Failed to fetch contest:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableProblems = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (difficultyFilter && difficultyFilter !== 'all') {
        params.set('difficulty', difficultyFilter);
      }
      params.set('limit', '50');
      
      const res = await fetch(`/api/problems?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        const assignedIds = assignedProblems.map(p => p.problemId);
        setAvailableProblems(data.problems.filter((p: any) => !assignedIds.includes(p.id)));
      }
    } catch (error) {
      console.error('Failed to fetch problems:', error);
    }
  };

  const handleAddProblem = async () => {
    if (!selectedProblemId) {
      setError('Please select a problem');
      return;
    }
    
    if (!canAddMore) {
      setError(`Cannot add more than ${problemLimit} problems for this contest`);
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      // Get the selected problem details
      const problem = availableProblems.find(p => p.id === selectedProblemId);
      
      // Calculate what divisions this problem should be visible to based on position
      const newProblems = [...assignedProblems, problem];
      const sortedProblems = sortProblemsByDifficulty(newProblems);
      const problemIndex = sortedProblems.findIndex(p => p.id === selectedProblemId);
      
      const contestDivisions = contest.divisions.map((d: any) => d.division);
      const visibleToDivisions = calculateVisibleToDivisions(
        problemIndex, 
        sortedProblems.length, 
        contestDivisions
      );
      
      const res = await fetch(`/api/contests/by-id/${id}/problems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: selectedProblemId,
          orderIndex: problemIndex + 1,
          visibleToDivisions,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('Problem added with auto-assigned divisions!');
        setSelectedProblemId('');
        await fetchContest();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to add problem');
      }
    } catch (error) {
      setError('Failed to add problem');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoAssignAll = async () => {
    if (assignedProblems.length === 0) {
      setError('No problems to assign');
      return;
    }
    
    setAutoAssigning(true);
    setError('');
    
    try {
      const contestDivisions = contest.divisions.map((d: any) => d.division);
      const updatedProblems = autoAssignVisibleDivisions(assignedProblems, contestDivisions);
      
      // Update each problem with its new visibility
      for (const problem of updatedProblems) {
        await fetch(`/api/contests/by-id/${id}/problems/${problem.problemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderIndex: problem.orderIndex,
            visibleToDivisions: problem.visibleToDivisions,
          }),
        });
      }
      
      setSuccess('Divisions auto-assigned successfully!');
      await fetchContest();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to auto-assign divisions');
    } finally {
      setAutoAssigning(false);
    }
  };

  const handleRemoveProblem = async (problemId: string) => {
    if (!confirm('Remove this problem?')) return;
    
    try {
      const res = await fetch(`/api/contests/by-id/${id}/problems/${problemId}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        setAssignedProblems(assignedProblems.filter(p => p.problemId !== problemId));
        setSuccess('Problem removed');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError('Failed to remove problem');
    }
  };

  const getDivisionInfo = () => {
    const divisions = contest?.divisions?.map((d: any) => d.division) || [];
    const count = divisions.length;
    
    if (count === 4) return { text: 'All Divisions (7 problems max)', limit: 7, mapping: 'DIV4: 1-4, DIV3: 2-5, DIV2: 3-6, DIV1: 4-7' };
    if (count === 3) return { text: '3 Divisions (6 problems max)', limit: 6, mapping: 'Lowest: 1-4, Middle: 2-5, Highest: 3-6' };
    if (count === 2) return { text: '2 Divisions (5 problems max)', limit: 5, mapping: 'Lower: 1-4, Higher: 2-5' };
    return { text: '1 Division (4 problems max)', limit: 4, mapping: 'All problems: 1-4' };
  };

  const divisionInfo = getDivisionInfo();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white font-mono">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Link href="/admin/contests" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6">
          <ChevronLeft className="h-4 w-4" />
          Back to Contests
        </Link>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{contest?.title} - Problems</h1>
          <p className="text-white/40">{divisionInfo.text}</p>
          <p className="text-violet-400 text-sm mt-1">📐 Mapping: {divisionInfo.mapping}</p>
        </div>

        {error && (
          <Alert className="mb-4 border-rose-500/30 bg-rose-500/10">
            <AlertCircle className="h-4 w-4 text-rose-400" />
            <AlertDescription className="text-rose-200">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <AlertDescription className="text-emerald-200">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Problems */}
          <Card className="border-white/10 bg-white/[0.02]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  Assigned Problems ({assignedProblems.length}/{problemLimit})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoAssignAll}
                  disabled={autoAssigning || assignedProblems.length === 0}
                  className="border-white/10  hover:bg-white/10 text-black hover:text-white"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  {autoAssigning ? 'Assigning...' : 'Auto-Assign Divisions'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {assignedProblems.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  <p>No problems assigned yet</p>
                  <p className="text-xs mt-2">Add {problemLimit} problems for this contest</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white/60 w-16">#</TableHead>
                      <TableHead className="text-white/60">Title</TableHead>
                      <TableHead className="text-white/60">Difficulty</TableHead>
                      <TableHead className="text-white/60">Rating</TableHead>
                      <TableHead className="text-white/60">Visible To</TableHead>
                      <TableHead className="text-white/60 w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedProblems.map((cp, index) => (
                      <TableRow key={cp.id} className="border-white/10">
                        <TableCell className="text-white/60">{index + 1}</TableCell>
                        <TableCell className="text-white">{cp.problem.title}</TableCell>
                        <TableCell>
                          <Badge className={
                            cp.problem.difficulty === 'EASY' ? 'bg-emerald-500/20 text-emerald-300' :
                            cp.problem.difficulty === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-rose-500/20 text-rose-300'
                          }>
                            {cp.problem.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/60">{cp.problem.rating || 10}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {cp.visibleToDivisions.map((d: string) => (
                              <Badge key={d} className="bg-white/10 text-white/60 text-xs">{d}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProblem(cp.problemId)}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Add Problem */}
          <Card className="border-white/10 bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-white">Add Problem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!canAddMore && (
                <Alert className="border-amber-500/30 bg-amber-500/10">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <AlertDescription className="text-amber-200">
                    Maximum {problemLimit} problems reached. Remove a problem to add more.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search problems..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                  disabled={!canAddMore}
                />
              </div>
              
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter} disabled={!canAddMore}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Filter by difficulty" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0f14] border-white/10">
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>

              <div>
                <Label className="text-white/70">Select Problem</Label>
                <Select 
                  value={selectedProblemId} 
                  onValueChange={setSelectedProblemId}
                  disabled={!canAddMore}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                    <SelectValue placeholder="Choose a problem..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f14] border-white/10 max-h-64">
                    {availableProblems.length === 0 ? (
                      <div className="px-2 py-6 text-center text-white/40 text-sm">
                        No problems available
                      </div>
                    ) : (
                      availableProblems.map(problem => (
                        <SelectItem key={problem.id} value={problem.id}>
                          {problem.title} ({problem.difficulty}, Rating: {problem.rating || 10})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded">
                <p className="text-xs text-violet-300">
                  💡 Divisions will be auto-assigned based on problem order!
                </p>
              </div>

              <Button
                onClick={handleAddProblem}
                disabled={saving || !selectedProblemId || !canAddMore}
                className="w-full bg-violet-600 hover:bg-violet-500"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Problem ({assignedProblems.length}/{problemLimit})
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}