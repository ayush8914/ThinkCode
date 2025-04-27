'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Code2,
  Tag,
  Settings,
  Shield,
  ChevronRight,
} from 'lucide-react';

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/problems', label: 'Problems', icon: Code2 },
  { href: '/admin/tags', label: 'Tags', icon: Tag },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="w-64 h-screen sticky top-0 border-r border-white/10 bg-white/[0.02] relative overflow-y-auto">
      {/* Subtle grid overlay for sidebar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      
      <div className="relative z-10 p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-sm bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Shield className="h-4 w-4 text-violet-400" />
          </div>
          <span className="font-bold text-white tracking-tight">Admin Panel</span>
        </div>
        
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-all ${
                  isActive
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="font-mono">{item.label}</span>
                {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}