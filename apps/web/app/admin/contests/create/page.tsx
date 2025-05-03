'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

const DIVISIONS = [
  { value: 'DIV1', label: 'Division 1 (Rating ≥ 2000)' },
  { value: 'DIV2', label: 'Division 2 (Rating 1600-1999)' },
  { value: 'DIV3', label: 'Division 3 (Rating 1400-1599)' },
  { value: 'DIV4', label: 'Division 4 (Rating ≤ 1399)' },
];

const CONTEST_NAMES = [
  { value: 'STARTERS', label: 'Starters (Wednesday)' },
  { value: 'WEEKLY', label: 'Weekly (Sunday)' },
  { value: 'LONG_WEEK', label: 'Long Week (Sat-Mon)' },
];

const CONTEST_TYPES = [
  { value: 'RATED', label: 'Rated' },
  { value: 'UNRATED', label: 'Unrated' },
];

export default function CreateContestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    contestName: 'STARTERS',
    contestType: 'RATED',
    startTime: '',
    endTime: '',
    selectedDivisions: [] as string[],
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleTitleChange = (value: string) => {
    setFormData({ ...formData, title: value, slug: generateSlug(value) });
  };

  const toggleDivision = (division: string) => {
    const selected = formData.selectedDivisions.includes(division)
      ? formData.selectedDivisions.filter(d => d !== division)
      : [...formData.selectedDivisions, division];
    setFormData({ ...formData, selectedDivisions: selected });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (!formData.title || !formData.slug) {
      setError('Title and slug are required');
      setLoading(false);
      return;
    }
    
    if (!formData.startTime || !formData.endTime) {
      setError('Start and end times are required');
      setLoading(false);
      return;
    }
    
    if (formData.selectedDivisions.length === 0) {
      setError('Select at least one division');
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch('/api/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('Contest created successfully!');
        setTimeout(() => {
          router.push('/admin/contests');
        }, 1500);
      } else {
        setError(data.error || 'Failed to create contest');
      }
    } catch (error) {
      setError('Failed to create contest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white font-mono">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/admin/contests" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6">
          <ChevronLeft className="h-4 w-4" />
          Back to Contests
        </Link>
        
        <h1 className="text-3xl font-bold mb-6">Create New Contest</h1>
        
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

        <form onSubmit={handleSubmit}>
          <Card className="border-white/10 bg-white/[0.02] mb-6">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white/70">Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="bg-white/5 border-white/10 text-white mt-1"
                  placeholder="e.g., Starters 100"
                  required
                />
              </div>
              
              <div>
                <Label className="text-white/70">Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="bg-white/5 border-white/10 text-white font-mono mt-1"
                  placeholder="starters-100"
                  required
                />
              </div>
              
              <div>
                <Label className="text-white/70">Description (Optional)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-white/5 border-white/10 text-white min-h-24 mt-1"
                  placeholder="Contest description..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70">Contest Name</Label>
                  <Select 
                    value={formData.contestName} 
                    onValueChange={(v) => setFormData({ ...formData, contestName: v })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f0f14] border-white/10 text-white">
                      {CONTEST_NAMES.map((name) => (
                        <SelectItem key={name.value} value={name.value}>{name.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-white/70">Contest Type</Label>
                  <Select 
                    value={formData.contestType} 
                    onValueChange={(v) => setFormData({ ...formData, contestType: v })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f0f14] border-white/10 text-white">
                      {CONTEST_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70">Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="bg-white/5 border-white/10 text-white mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label className="text-white/70">End Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="bg-white/5 border-white/10 text-white mt-1"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.02] mb-6">
            <CardHeader>
              <CardTitle className="text-white">Divisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {DIVISIONS.map((division) => (
                  <label 
                    key={division.value} 
                    className="flex items-center gap-3 p-4 border border-white/10 rounded-sm cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedDivisions.includes(division.value)}
                      onChange={() => toggleDivision(division.value)}
                      className="rounded-sm accent-violet-500 w-4 h-4"
                    />
                    <span className="text-white/80">{division.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-500">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Contest
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()} 
              className="border-white/10 bg-white/5 text-white/70 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}