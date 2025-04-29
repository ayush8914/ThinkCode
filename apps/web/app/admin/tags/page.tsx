'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Tag as TagIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
} from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  _count?: { problems: number };
}

const PAGE_SIZE = 10;

export default function AdminTagsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [tags, setTags] = useState<Tag[]>([]);
  const [totalTags, setTotalTags] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'name');
  const [sortOrder, setSortOrder] = useState(searchParams.get('order') || 'asc');
  
  const currentPage = parseInt(searchParams.get('page') || '1');
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchTags();
  }, [currentPage, sortBy, sortOrder, searchParams.get('search')]);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const currentSearch = searchParams.get('search') || '';
      const currentSort = searchParams.get('sort') || 'name';
      const currentOrder = searchParams.get('order') || 'asc';
      
      if (currentSearch) params.set('search', currentSearch);
      params.set('sort', currentSort);
      params.set('order', currentOrder);
      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', ((currentPage - 1) * PAGE_SIZE).toString());
      
      const res = await fetch(`/api/admin/tags?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTags(data.tags);
        setTotalTags(data.total);
        setTotalPages(Math.ceil(data.total / PAGE_SIZE));
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    if (updates.search !== undefined || updates.sort !== undefined || updates.order !== undefined) {
      params.set('page', '1');
    }
    
    router.push(`/admin/tags?${params.toString()}`);
  };

  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      updateUrlParams({ search: value || null });
    }, 400);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
      updateUrlParams({ order: newOrder });
    } else {
      setSortBy(field);
      setSortOrder('asc');
      updateUrlParams({ sort: field, order: 'asc' });
    }
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/admin/tags?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearchInput('');
    updateUrlParams({ search: null });
  };

  const handleOpenDialog = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setTagName(tag.name);
    } else {
      setEditingTag(null);
      setTagName('');
    }
    setDialogOpen(true);
  };

  const handleSaveTag = async () => {
    if (!tagName.trim()) {
      setError('Tag name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const url = editingTag 
        ? `/api/admin/tags/${editingTag.id}`
        : '/api/admin/tags';
      
      const method = editingTag ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        await fetchTags();
        setDialogOpen(false);
        setTagName('');
        setEditingTag(null);
        setSuccess(editingTag ? 'Tag updated successfully' : 'Tag created successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to save tag');
      }
    } catch (error) {
      setError('Failed to save tag');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    try {
      const res = await fetch(`/api/admin/tags/${tagToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setTags(tags.filter(t => t.id !== tagToDelete.id));
        setTotalTags(prev => prev - 1);
        setDeleteDialogOpen(false);
        setTagToDelete(null);
        setSuccess('Tag deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to delete tag');
      }
    } catch (error) {
      setError('Failed to delete tag');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return (
      <span className="ml-1">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tags Management</h1>
          <p className="text-white/50 mt-1">Manage problem tags</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-violet-600 hover:bg-violet-500 text-white">
          <Plus className="h-4 w-4 mr-0" />
          Add Tag
        </Button>
      </div>

      {success && (
        <Alert className="border-emerald-500/30 bg-emerald-500/10">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <AlertDescription className="text-emerald-200">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-rose-500/30 bg-rose-500/10">
          <AlertCircle className="h-4 w-4 text-rose-400" />
          <AlertDescription className="text-rose-200">{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-violet-400" />
              All Tags
              <Badge className="bg-white/10 text-white/60 ml-2">{totalTags}</Badge>
            </CardTitle>
            
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  type="text"
                  placeholder="Search tags..."
                  value={searchInput}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
                {searchInput && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead 
                  className="text-white/60 cursor-pointer hover:text-white"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Name {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead className="text-white/60">Slug (Auto-generated)</TableHead>
                <TableHead 
                  className="text-white/60 cursor-pointer hover:text-white"
                  onClick={() => handleSort('problems')}
                >
                  <div className="flex items-center">
                    Problems {getSortIcon('problems')}
                  </div>
                </TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-400 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : tags.length === 0 ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={4} className="text-center py-8 text-white/40">
                    {searchInput ? 'No tags match your search' : 'No tags found. Create your first tag!'}
                  </TableCell>
                </TableRow>
              ) : (
                tags.map((tag) => (
                  <TableRow key={tag.id} className="border-white/10">
                    <TableCell>
                      <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                        {tag.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/50 font-mono text-sm">
                      {tag.name.toLowerCase().replace(/\s+/g, '-')}
                    </TableCell>
                    <TableCell className="text-white/60">
                      {tag._count?.problems || 0} problems
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(tag)}
                          className="text-white/60 hover:text-black"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTagToDelete(tag);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-rose-400 hover:text-rose-700"
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
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-white/40">
            Showing {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, totalTags)} of {totalTags} tags
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-white/10 text-black/70"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
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
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className={pageNum === currentPage 
                      ? 'bg-violet-600 hover:bg-violet-500 text-white' 
                      : 'border-white/10 text-black/70'}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-white/10 text-black/70"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0f0f14] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit Tag' : 'Create New Tag'}</DialogTitle>
            <DialogDescription className="text-white/50">
              {editingTag ? 'Update the tag name' : 'Add a new tag for categorizing problems'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tagName" className="text-white/70">Tag Name</Label>
              <Input
                id="tagName"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="e.g., Array, Dynamic Programming"
                className="bg-white/5 border-white/10 text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTag()}
                autoFocus
              />
            </div>
            {tagName && (
              <div className="space-y-1">
                <Label className="text-white/50 text-xs">Preview</Label>
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                  {tagName}
                </Badge>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/10">
              Cancel
            </Button>
            <Button onClick={handleSaveTag} disabled={saving} className="bg-violet-600 hover:bg-violet-500">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingTag ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#0f0f14] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription className="text-white/50">
              Are you sure you want to delete "{tagToDelete?.name}"? 
              {tagToDelete?._count?.problems ? (
                <span className="block mt-2 text-amber-400">
                  Warning: This tag is used by {tagToDelete._count.problems} problem(s).
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-white/10">
              Cancel
            </Button>
            <Button onClick={handleDeleteTag} className="bg-rose-600 hover:bg-rose-500">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}