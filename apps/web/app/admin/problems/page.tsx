'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  CheckCircle2,
  FileText,
  X,
} from 'lucide-react';

const difficultyColors = {
  EASY: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  HARD: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimitMs: number;
  memoryLimitKb: number;
  isPublic: boolean;
  createdAt: string;
  tags: { tag: { id: string; name: string } }[];
  _count: { submissions: number; testCases: number };
}

interface TestCase {
  id: string;
  input: string;
  output: string;
  isSample: boolean;
  explanation?: string;
  orderIndex: number;
}

interface Tag {
  id: string;
  name: string;
}

const PAGE_SIZE = 10;

export default function AdminProblemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [problems, setProblems] = useState<Problem[]>([]);
  const [totalProblems, setTotalProblems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [selectedDifficulty, setSelectedDifficulty] = useState(searchParams.get('difficulty') || 'all');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || 'all');
  const [tags, setTags] = useState<Tag[]>([]);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [problemToDelete, setProblemToDelete] = useState<Problem | null>(null);
  const [testCasesDialogOpen, setTestCasesDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testCasesLoading, setTestCasesLoading] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [newTestCase, setNewTestCase] = useState<Partial<TestCase>>({
    input: '',
    output: '',
    isSample: false,
    explanation: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  
  const currentPage = parseInt(searchParams.get('page') || '1');
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [currentPage, selectedDifficulty, selectedTag, searchParams.get('search')]);

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags');
      const data = await res.json();
      if (data.success) {
        setTags(data.tags);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const currentSearch = searchParams.get('search') || '';
      const currentDifficulty = searchParams.get('difficulty') || '';
      const currentTag = searchParams.get('tag') || '';
      
      if (currentSearch) params.set('search', currentSearch);
      if (currentDifficulty && currentDifficulty !== 'all') params.set('difficulty', currentDifficulty);
      if (currentTag && currentTag !== 'all') params.set('tag', currentTag);
      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', ((currentPage - 1) * PAGE_SIZE).toString());
      
      const res = await fetch(`/api/admin/problems?${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setProblems(data.problems);
        setTotalProblems(data.total);
        setTotalPages(Math.ceil(data.total / PAGE_SIZE));
      }
    } catch (error) {
      console.error('Failed to fetch problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestCases = async (problemId: string) => {
    setTestCasesLoading(true);
    try {
      const res = await fetch(`/api/admin/problems/${problemId}/testcases`);
      const data = await res.json();
      if (data.success) {
        setTestCases(data.testCases);
      }
    } catch (error) {
      console.error('Failed to fetch test cases:', error);
    } finally {
      setTestCasesLoading(false);
    }
  };

  const updateUrlParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    if (updates.difficulty !== undefined || updates.tag !== undefined || updates.search !== undefined) {
      params.set('page', '1');
    }
    
    router.push(`/admin/problems?${params.toString()}`);
  }, [router, searchParams]);

  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      updateUrlParams({ search: value || null });
    }, 400);
  };

  const handleDifficultyChange = (value: string) => {
    setSelectedDifficulty(value);
    updateUrlParams({ difficulty: value });
  };

  const handleTagChange = (value: string) => {
    setSelectedTag(value);
    updateUrlParams({ tag: value });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSelectedDifficulty('all');
    setSelectedTag('all');
    updateUrlParams({ search: null, difficulty: null, tag: null });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/admin/problems?${params.toString()}`);
  };

  const handleDeleteProblem = async () => {
    if (!problemToDelete) return;
    
    try {
      const res = await fetch(`/api/admin/problems/${problemToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        setProblems(problems.filter(p => p.id !== problemToDelete.id));
        setTotalProblems(prev => prev - 1);
        setDeleteDialogOpen(false);
        setProblemToDelete(null);
        setSuccess('Problem deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Failed to delete problem:', error);
    }
  };

  const handleSaveTestCase = async () => {
    if (!selectedProblem) return;
    
    setSaving(true);
    
    try {
      const url = editingTestCase
        ? `/api/admin/problems/${selectedProblem.id}/testcases/${editingTestCase.id}`
        : `/api/admin/problems/${selectedProblem.id}/testcases`;
      
      const method = editingTestCase ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTestCase || newTestCase),
      });
      
      const data = await res.json();
      
      if (data.success) {
        await fetchTestCases(selectedProblem.id);
        setEditingTestCase(null);
        setNewTestCase({ input: '', output: '', isSample: false, explanation: '' });
        setSuccess(editingTestCase ? 'Test case updated' : 'Test case added');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Failed to save test case:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTestCase = async (testCaseId: string) => {
    if (!selectedProblem) return;
    
    try {
      const res = await fetch(`/api/admin/problems/${selectedProblem.id}/testcases/${testCaseId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        setTestCases(testCases.filter(tc => tc.id !== testCaseId));
        setSuccess('Test case deleted');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Failed to delete test case:', error);
    }
  };

  const openTestCasesDialog = async (problem: Problem) => {
    setSelectedProblem(problem);
    setTestCasesDialogOpen(true);
    await fetchTestCases(problem.id);
  };

  const hasActiveFilters = searchInput || selectedDifficulty !== 'all' || selectedTag !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Problems Management</h1>
          <p className="text-white/50 mt-1">Manage all coding problems</p>
        </div>
        <Link href="/problems/create">
          <Button className="bg-violet-600 hover:bg-violet-500 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Problem
          </Button>
        </Link>
      </div>

      {success && (
        <Alert className="border-emerald-500/30 bg-emerald-500/10">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <AlertDescription className="text-emerald-200">{success}</AlertDescription>
        </Alert>
      )}

      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search by title..."
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>
            <Select value={selectedDifficulty} onValueChange={handleDifficultyChange}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f14] border-white/10 text-white">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTag} onValueChange={handleTagChange}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f14] border-white/10 text-white">
                <SelectItem value="all">All Tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.name}>{tag.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="border-white/10 text-black/70 hover:bg-white/10"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.02]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Title</TableHead>
                <TableHead className="text-white/60">Difficulty</TableHead>
                <TableHead className="text-white/60">Tags</TableHead>
                <TableHead className="text-white/60">Test Cases</TableHead>
                <TableHead className="text-white/60">Submissions</TableHead>
                <TableHead className="text-white/60">Public</TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-400 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : problems.length === 0 ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={7} className="text-center py-8 text-white/40">
                    No problems found
                  </TableCell>
                </TableRow>
              ) : (
                problems.map((problem) => (
                  <TableRow key={problem.id} className="border-white/10">
                    <TableCell className="font-medium text-white">
                      <Link href={`/problems/${problem.slug}`} className="hover:text-violet-400">
                        {problem.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={difficultyColors[problem.difficulty]}>
                        {problem.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {problem.tags.slice(0, 2).map(({ tag }) => (
                          <Badge key={tag.id} variant="outline" className="text-xs border-white/20 text-white/60">
                            {tag.name}
                          </Badge>
                        ))}
                        {problem.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs border-white/20 text-white/40">
                            +{problem.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-white/60">{problem._count.testCases}</TableCell>
                    <TableCell className="text-white/60">{problem._count.submissions}</TableCell>
                    <TableCell>
                      {problem.isPublic ? (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Public</Badge>
                      ) : (
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openTestCasesDialog(problem)}
                          className="text-white/60 hover:text-black"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Link href={`/problems/edit/${problem.slug}`}>
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-black">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setProblemToDelete(problem);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-rose-400 hover:text-black"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="border-white/10 text-white/70"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-white/60 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="border-white/10 text-white/70"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#0f0f14] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Problem</DialogTitle>
            <DialogDescription className="text-white/50">
              Are you sure you want to delete "{problemToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-white/10">
              Cancel
            </Button>
            <Button onClick={handleDeleteProblem} className="bg-rose-600 hover:bg-rose-500">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={testCasesDialogOpen} onOpenChange={setTestCasesDialogOpen}>
        <DialogContent className="bg-[#0f0f14] border-white/10 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test Cases - {selectedProblem?.title}</DialogTitle>
            <DialogDescription className="text-white/50">
              Manage test cases for this problem
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border border-white/10 rounded-lg p-4 bg-white/[0.02]">
              <h4 className="text-sm font-medium text-white mb-3">
                {editingTestCase ? 'Edit Test Case' : 'Add New Test Case'}
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white/60 text-xs">Input</Label>
                    <textarea
                      value={editingTestCase ? editingTestCase.input : newTestCase.input}
                      onChange={(e) => editingTestCase 
                        ? setEditingTestCase({ ...editingTestCase, input: e.target.value })
                        : setNewTestCase({ ...newTestCase, input: e.target.value })
                      }
                      className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white font-mono text-xs resize-y"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label className="text-white/60 text-xs">Output</Label>
                    <textarea
                      value={editingTestCase ? editingTestCase.output : newTestCase.output}
                      onChange={(e) => editingTestCase
                        ? setEditingTestCase({ ...editingTestCase, output: e.target.value })
                        : setNewTestCase({ ...newTestCase, output: e.target.value })
                      }
                      className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white font-mono text-xs resize-y"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTestCase ? editingTestCase.isSample : newTestCase.isSample}
                      onChange={(e) => editingTestCase
                        ? setEditingTestCase({ ...editingTestCase, isSample: e.target.checked })
                        : setNewTestCase({ ...newTestCase, isSample: e.target.checked })
                      }
                      className="rounded-sm accent-emerald-500"
                    />
                    <span className="text-xs text-white/60">Sample Test Case</span>
                  </label>
                  <Input
                    placeholder="Explanation (optional)"
                    value={editingTestCase ? editingTestCase.explanation || '' : newTestCase.explanation || ''}
                    onChange={(e) => editingTestCase
                      ? setEditingTestCase({ ...editingTestCase, explanation: e.target.value })
                      : setNewTestCase({ ...newTestCase, explanation: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white text-xs flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveTestCase} disabled={saving} className="bg-violet-600 hover:bg-violet-500">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {editingTestCase ? 'Update' : 'Add'} Test Case
                  </Button>
                  {editingTestCase && (
                    <Button variant="outline" onClick={() => setEditingTestCase(null)} className="border-white/10">
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">Existing Test Cases ({testCases.length})</h4>
              {testCasesLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-violet-400 mx-auto" />
              ) : testCases.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-4">No test cases yet</p>
              ) : (
                testCases.map((tc, index) => (
                  <div key={tc.id} className={`p-3 border rounded-lg ${tc.isSample ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02]'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50">#{index + 1}</span>
                        {tc.isSample && (
                          <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">Sample</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingTestCase(tc)} className="text-white/60 hover:text-white h-7 w-7 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTestCase(tc.id)} className="text-rose-400 hover:text-rose-300 h-7 w-7 p-0">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-white/40 text-[10px]">Input:</span>
                        <pre className="text-white/80 text-xs mt-0.5 bg-black/20 p-1.5 rounded overflow-x-auto">{tc.input}</pre>
                      </div>
                      <div>
                        <span className="text-white/40 text-[10px]">Output:</span>
                        <pre className="text-white/80 text-xs mt-0.5 bg-black/20 p-1.5 rounded overflow-x-auto">{tc.output}</pre>
                      </div>
                    </div>
                    {tc.explanation && (
                      <div className="mt-2">
                        <span className="text-white/40 text-[10px]">Explanation:</span>
                        <p className="text-white/60 text-xs">{tc.explanation}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}