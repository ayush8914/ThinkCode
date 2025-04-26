'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const roleColors: Record<string, string> = {
  ADMIN: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  PROBLEM_SETTER: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  USER: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  PROBLEM_SETTER: 'Problem Setter',
  USER: 'User',
};

interface UserRoleSelectProps {
  userId: string;
  currentRole: string;
  onRoleChange?: (newRole: string) => void;
}

export default function UserRoleSelect({ userId, currentRole, onRoleChange }: UserRoleSelectProps) {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const handleRoleChange = async (newRole: string) => {
    if (newRole === role) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users/role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setRole(newRole);
        if (onRoleChange) {
          onRoleChange(newRole);
        }
        router.refresh();
      } else {
        console.error('Failed to update role:', data.error);
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
        <span className="text-white/40 text-sm">Updating...</span>
      </div>
    );
  }
  
  return (
    <Select value={role} onValueChange={handleRoleChange}>
      <SelectTrigger className="w-36 h-8 border-white/20 bg-white/5 text-xs">
        <SelectValue>
          <Badge className={`${roleColors[role]} text-xs`}>
            {roleLabels[role] || role}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-[#0f0f14] border-white/10">
        <SelectItem value="USER" className="text-white/80 hover:bg-white/10 focus:bg-white/10">
          <Badge className={`${roleColors.USER} text-xs`}>User</Badge>
        </SelectItem>
        <SelectItem value="PROBLEM_SETTER" className="text-white/80 hover:bg-white/10 focus:bg-white/10">
          <Badge className={`${roleColors.PROBLEM_SETTER} text-xs`}>Problem Setter</Badge>
        </SelectItem>
        <SelectItem value="ADMIN" className="text-white/80 hover:bg-white/10 focus:bg-white/10">
          <Badge className={`${roleColors.ADMIN} text-xs`}>Admin</Badge>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}