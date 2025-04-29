'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  X,
  Save,
  Eye,
  Code2,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  Loader2,
  Trash2,
  Copy,
} from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface TestCase {
  id: string;
  input: string;
  output: string;
  isSample: boolean;
  explanation?: string | null;
  orderIndex?: number;
}

interface Tag {
  id: string;
  name: string;
}

interface ProblemData {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimitMs: number;
  memoryLimitKb: number;
  isPublic: boolean;
  tags: { tag: Tag }[];
  testCases: TestCase[];
}

interface FormData {
  title: string;
  slug: string;
  difficulty: string;
  timeLimitMs: number;
  memoryLimitKb: number;
  isPublic: boolean;
}

export default function EditProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('write');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState<boolean>(true);
  const [problemId, setProblemId] = useState<string>('');
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    slug: '',
    difficulty: 'EASY',
    timeLimitMs: 1000,
    memoryLimitKb: 262144,
    isPublic: true,
  });
  
  const [description, setDescription] = useState<string>('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  
  useEffect(() => {
    fetchTags();
    fetchProblem();
  }, [slug]);
  
  const fetchTags = async (): Promise<void> => {
    try {
      const res = await fetch('/api/tags');
      const data = await res.json();
      if (data.success) {
        setAvailableTags(data.tags);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setTagsLoading(false);
    }
  };
  
 const fetchProblem = async (): Promise<void> => {
  try {
    const res = await fetch(`/api/problems?slug=${slug}`);
    const data = await res.json();
    
    if (data.success && data.problems?.length > 0) {
      const problem = data.problems[0];
      setProblemId(problem.id);
      setFormData({
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        timeLimitMs: problem.timeLimitMs || 1000,
        memoryLimitKb: problem.memoryLimitKb || 262144,
        isPublic: problem.isPublic ?? true,
      });
      setDescription(problem.description || '');
      setSelectedTags(problem.tags || []);
      
      // Use test cases from the main API response (already included)
      setTestCases(problem.testCases || []);
    } else {
      setError('Failed to load problem');
    }
  } catch (error) {
    console.error('Failed to fetch problem:', error);
    setError('Failed to load problem');
  } finally {
    setPageLoading(false);
  }
};
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };
  
  const handleTitleChange = (value: string): void => {
    setFormData({
      ...formData,
      title: value,
      slug: generateSlug(value),
    });
  };
  
  const addTag = (): void => {
    if (selectedTagId) {
      const tag = availableTags.find((t: Tag) => t.id === selectedTagId);
      if (tag && !selectedTags.some((t: Tag) => t.id === tag.id)) {
        setSelectedTags([...selectedTags, tag]);
      }
      setSelectedTagId('');
    }
  };
  
  const removeTag = (tagId: string): void => {
    setSelectedTags(selectedTags.filter((t: Tag) => t.id !== tagId));
  };
  
  const addTestCase = (): void => {
    const newTestCase: TestCase = {
      id: `temp-${Date.now()}`,
      input: '',
      output: '',
      isSample: false,
      explanation: '',
    };
    setTestCases([...testCases, newTestCase]);
  };
  
  const updateTestCase = (id: string, field: keyof TestCase, value: string | boolean): void => {
    setTestCases(testCases.map((tc: TestCase) => 
      tc.id === id ? { ...tc, [field]: value } : tc
    ));
  };
  
  const removeTestCase = (id: string): void => {
    setTestCases(testCases.filter((tc: TestCase) => tc.id !== id));
  };
  
  const duplicateTestCase = (tc: TestCase): void => {
    const newTestCase: TestCase = {
      ...tc,
      id: `temp-${Date.now()}`,
    };
    setTestCases([...testCases, newTestCase]);
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (!formData.title || !formData.slug) {
      setError('Title and slug are required');
      setLoading(false);
      return;
    }
    
    if (!description || description === '') {
      setError('Description is required');
      setLoading(false);
      return;
    }
    
    if (testCases.length === 0) {
      setError('At least one test case is required');
      setLoading(false);
      return;
    }
    
    const hasSample = testCases.some((tc: TestCase) => tc.isSample);
    if (!hasSample) {
      setError('At least one sample test case is required');
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/problems/${problemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          description,
          testCases: testCases.map(({ id, orderIndex, ...tc }: TestCase) => ({
            ...tc,
            id: id.startsWith('temp-') ? undefined : id,
          })),
          tags: selectedTags.map((t: Tag) => t.id),
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('Problem updated successfully!');
        setTimeout(() => {
          router.push(`/problems/${data.slug}`);
        }, 1500);
      } else {
        setError(data.error || 'Failed to update problem');
      }
    } catch (error) {
      setError('Failed to update problem');
    } finally {
      setLoading(false);
    }
  };
  
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'PROBLEM_SETTER')) {
    return (
      <main className="relative min-h-screen bg-[#0a0a0f] text-white font-mono">
        <div className="relative z-10 container mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-16 w-16 text-rose-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-white">Access Denied</h1>
          <p className="text-white/50 mb-8">You don&apos;t have permission to edit problems.</p>
          <Link href="/" className="text-violet-400 hover:text-violet-300">
            Return to Home →
          </Link>
        </div>
      </main>
    );
  }
  
  if (pageLoading) {
    return (
      <main className="relative min-h-screen bg-[#0a0a0f] text-white font-mono">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      </main>
    );
  }
  
  return (
    <main className="relative min-h-screen bg-[#0a0a0f] text-white font-mono">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin/problems"
            className="p-2 hover:bg-white/5 rounded-sm transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-white/60" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Edit <span className="text-violet-400">Problem</span>
            </h1>
            <p className="text-white/50 text-sm mt-1">Update coding challenge: {formData.title}</p>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-4 border-rose-500/30 bg-rose-500/10">
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
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <Card className="border-white/10 bg-white/[0.02]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <FileText className="h-4 w-4 text-violet-400" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-white/70 text-xs">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTitleChange(e.target.value)}
                      className="bg-white/5 border-white/10 mt-1 text-white placeholder:text-white/30"
                      placeholder="e.g., Two Sum"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="slug" className="text-white/70 text-xs">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, slug: e.target.value })}
                      className="bg-white/5 border-white/10 mt-1 font-mono text-sm text-white placeholder:text-white/30"
                      placeholder="two-sum"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="difficulty" className="text-white/70 text-xs">Difficulty</Label>
                    <select
                      id="difficulty"
                      value={formData.difficulty}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-sm text-white text-sm"
                    >
                      <option value="EASY" className="bg-[#0a0a0f] text-white">Easy</option>
                      <option value="MEDIUM" className="bg-[#0a0a0f] text-white">Medium</option>
                      <option value="HARD" className="bg-[#0a0a0f] text-white">Hard</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="timeLimit" className="text-white/70 text-xs">Time Limit (ms)</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        value={formData.timeLimitMs}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, timeLimitMs: parseInt(e.target.value) || 1000 })}
                        className="bg-white/5 border-white/10 mt-1 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="memoryLimit" className="text-white/70 text-xs">Memory (KB)</Label>
                      <Input
                        id="memoryLimit"
                        type="number"
                        value={formData.memoryLimitKb}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, memoryLimitKb: parseInt(e.target.value) || 262144 })}
                        className="bg-white/5 border-white/10 mt-1 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="rounded-sm accent-violet-500"
                    />
                    <Label htmlFor="isPublic" className="text-white/70 text-xs">Published</Label>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-white/10 bg-white/[0.02]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <Badge className="h-4 w-4 text-violet-400" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Select value={selectedTagId} onValueChange={setSelectedTagId} disabled={tagsLoading}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm flex-1">
                        <SelectValue placeholder={tagsLoading ? "Loading tags..." : "Select a tag"} />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f0f14] border-white/10 text-white">
                        {availableTags.map((tag: Tag) => (
                          <SelectItem 
                            key={tag.id} 
                            value={tag.id}
                            className="text-white hover:bg-white/10 focus:bg-white/10"
                          >
                            {tag.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={addTag}
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-white hover:bg-white/10"
                      disabled={!selectedTagId}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTags.map((tag: Tag) => (
                      <Badge
                        key={tag.id}
                        className="bg-violet-500/20 text-violet-200 border-violet-500/30 text-xs"
                      >
                        {tag.name}
                        <button
                          type="button"
                          onClick={() => removeTag(tag.id)}
                          className="ml-1.5 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedTags.length === 0 && (
                      <p className="text-white/30 text-xs py-2">No tags selected</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-white/10 bg-white/[0.02]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                      <Eye className="h-4 w-4 text-violet-400" />
                      Description (Markdown)
                    </CardTitle>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                      <TabsList className="bg-transparent border border-white/10 h-8">
                        <TabsTrigger value="write" className="text-xs px-3 py-1 text-white/70 data-[state=active]:bg-violet-500/20 data-[state=active]:text-white">
                          Write
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="text-xs px-3 py-1 text-white/70 data-[state=active]:bg-violet-500/20 data-[state=active]:text-white">
                          Preview
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeTab === 'write' ? (
                    <div data-color-mode="dark">
                      <MDEditor
                        value={description}
                        onChange={(val: string | undefined) => setDescription(val || '')}
                        preview="edit"
                        height={400}
                        visibleDragbar={false}
                        textareaProps={{
                          placeholder: 'Write your problem description in Markdown...',
                        }}
                        style={{ backgroundColor: '#0a0a0f' }}
                      />
                    </div>
                  ) : (
                    <div className="min-h-[400px] max-h-[500px] overflow-y-auto p-4 border border-white/10 rounded-sm bg-[#0f0f14]">
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {description}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="border-white/10 bg-white/[0.02]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                      <Code2 className="h-4 w-4 text-violet-400" />
                      Test Cases
                      <Badge className="bg-white/10 text-white/60 text-xs ml-2">
                        {testCases.length}
                      </Badge>
                    </CardTitle>
                    <Button
                      type="button"
                      onClick={addTestCase}
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-white hover:bg-white/10 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Test Case
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {testCases.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-sm">
                      <Code2 className="h-8 w-8 text-white/20 mx-auto mb-2" />
                      <p className="text-white/40 text-sm">No test cases added</p>
                      <Button
                        type="button"
                        onClick={addTestCase}
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-violet-400 hover:text-violet-300"
                      >
                        Add your first test case
                      </Button>
                    </div>
                  ) : (
                    testCases.map((tc: TestCase, index: number) => (
                      <div
                        key={tc.id}
                        className={`p-3 border rounded-sm ${
                          tc.isSample
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-white/10 bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/50 font-mono">
                              Test Case #{index + 1}
                            </span>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tc.isSample}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTestCase(tc.id, 'isSample', e.target.checked)}
                                className="rounded-sm accent-emerald-500"
                              />
                              <span className="text-xs text-emerald-400">Sample</span>
                            </label>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => duplicateTestCase(tc)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              title="Duplicate"
                            >
                              <Copy className="h-3 w-3 text-white/40" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeTestCase(tc.id)}
                              className="p-1 hover:bg-rose-500/20 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3 text-rose-400" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <Label className="text-white/50 text-xs">Input</Label>
                            <textarea
                              value={tc.input}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateTestCase(tc.id, 'input', e.target.value)}
                              className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-sm text-white font-mono text-xs resize-y"
                              rows={3}
                              placeholder="Enter input..."
                            />
                          </div>
                          <div>
                            <Label className="text-white/50 text-xs">Expected Output</Label>
                            <textarea
                              value={tc.output}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateTestCase(tc.id, 'output', e.target.value)}
                              className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-sm text-white font-mono text-xs resize-y"
                              rows={3}
                              placeholder="Enter expected output..."
                            />
                          </div>
                          {tc.isSample && (
                            <div>
                              <Label className="text-white/50 text-xs">Explanation (Optional)</Label>
                              <Input
                                value={tc.explanation || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTestCase(tc.id, 'explanation', e.target.value)}
                                className="bg-white/5 border-white/10 mt-1 text-xs text-white placeholder:text-white/30"
                                placeholder="Explain this example..."
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
            <Button
              type="submit"
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Problem
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}