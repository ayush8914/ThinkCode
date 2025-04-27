'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Code2,
  Tag,
  Settings,
  Shield,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/problems', label: 'Problems', icon: Code2 },
  { href: '/admin/tags', label: 'Tags', icon: Tag },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-sm bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Shield className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">Admin Panel</span>
        </div>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="border-white/10 bg-white/5">
              <Menu className="h-4 w-4 text-white" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-[#0f0f14] border-r border-white/10">
            {/* Mobile Menu Content */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-violet-400" />
                  <span className="font-bold text-white">Admin Menu</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4 text-white/60" />
                </Button>
              </div>
              
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-all ${
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
              
              {/* Grid overlay for mobile menu */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}