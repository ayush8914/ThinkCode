'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import UserRoleSelect from '@/components/admin/UserRoleSelect';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const totalPages = Math.ceil(total / limit);
  
  useEffect(() => {
    fetchUsers();
  }, [page, searchParams.get('search')]);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const searchQuery = searchParams.get('search') || '';
      const res = await fetch(`/api/admin/users?page=${page}&limit=${limit}&search=${searchQuery}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', '1');
    router.push(`/admin/users?${params.toString()}`);
  };
  
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/admin/users?${params.toString()}`);
  };
  
  return (
    <div className="text-white font-mono">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-white/50">Manage user roles and permissions</p>
        </div>
      </div>
      
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>
        <Button onClick={handleSearch} className="bg-violet-600 hover:bg-violet-500">
          Search
        </Button>
      </div>
      
      <div className="rounded-sm border border-white/10 bg-white/[0.02]">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/60">User</TableHead>
              <TableHead className="text-white/60">Email</TableHead>
              <TableHead className="text-white/60">Role</TableHead>
              <TableHead className="text-white/60">Submissions</TableHead>
              <TableHead className="text-white/60">Joined</TableHead>
              <TableHead className="text-white/60 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-white/10">
                <TableCell colSpan={6} className="text-center py-8 text-white/40">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow className="border-white/10">
                <TableCell colSpan={6} className="text-center py-8 text-white/40">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: any) => (
                <TableRow key={user.id} className="border-white/10">
                  <TableCell>
                    <Link href={`/admin/users/${user.id}`} className="hover:text-violet-400">
                      {user.name || 'N/A'}
                    </Link>
                  </TableCell>
                  <TableCell className="text-white/70">{user.email}</TableCell>
                  <TableCell>
                    <UserRoleSelect userId={user.id} currentRole={user.role} />
                  </TableCell>
                  <TableCell className="text-white/50">{user._count.submissions}</TableCell>
                  <TableCell className="text-white/50">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-violet-400 hover:text-violet-300 text-sm"
                    >
                      View Details →
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => page > 1 && handlePageChange(page - 1)}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNum)}
                      isActive={page === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => page < totalPages && handlePageChange(page + 1)}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}