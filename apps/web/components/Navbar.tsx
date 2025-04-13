'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Braces, LogOut, User, Settings, Code } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const GitHubIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57C20.565 21.795 24 17.31 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();

const handleSignOut = async () => {
  try {
    await signOut({ 
      redirect: true,
      callbackUrl: '/' 
    });
  } catch (error) {
    console.error('SignOut error:', error);
  }
};

  return (
    <nav className="relative z-10 flex items-center justify-between px-4 md:px-6 lg:px-12 py-4 md:py-5 border-b border-white/5 bg-[#0a0a0f] font-mono">
      {/* Logo */}
      <div className="flex items-center gap-2 text-base md:text-lg font-bold tracking-tight">
        <Braces className="h-4 w-4 md:h-5 md:w-5 text-violet-400" />
        <Link href="/" className="text-white hover:text-violet-400 transition-colors">
          Think<span className="text-violet-400">Code</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
        <Button
          variant="ghost"
          asChild
          className="text-white/60 hover:text-white hover:bg-white/5 font-mono text-xs sm:text-sm px-2 sm:px-3 h-8"
        >
          <Link href="/problems">Problems</Link>
        </Button>

        <Button
          variant="ghost"
          asChild
          className="text-white/60 hover:text-white hover:bg-white/5 font-mono text-xs sm:text-sm px-2 sm:px-3 h-8 hidden xs:inline-flex"
        >
          <Link href="/contests">Contests</Link>
        </Button>

        {/* Auth Section */}
        {status === 'loading' ? (
          <div className="h-8 w-8 rounded-full bg-white/5 animate-pulse" />
        ) : session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-7 w-7 md:h-8 md:w-8 rounded-full p-0 hover:bg-white/5"
              >
                <Avatar className="h-7 w-7 md:h-8 md:w-8 border border-white/10">
                  <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs md:text-sm">
                    {session.user?.name?.charAt(0).toUpperCase() || 
                     session.user?.email?.charAt(0).toUpperCase() || 
                     'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 sm:w-56 bg-[#0a0a0f] border-white/10 text-white font-mono"
            >
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-white">
                    {session.user?.name || 'User'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-white/60 truncate max-w-[160px]">
                    {session.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              
              <DropdownMenuItem 
                asChild
                className="text-white/80 hover:text-white hover:bg-white/5 cursor-pointer text-xs sm:text-sm"
              >
                <Link href="/profile">
                  <User className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-violet-400" />
                  Profile
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                asChild
                className="text-white/80 hover:text-white hover:bg-white/5 cursor-pointer text-xs sm:text-sm"
              >
                <Link href="/submissions">
                  <Code className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-violet-400" />
                  My Submissions
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                asChild
                className="text-white/80 hover:text-white hover:bg-white/5 cursor-pointer text-xs sm:text-sm"
              >
                <Link href="/settings">
                  <Settings className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-violet-400" />
                  Settings
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-white/10" />
              
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer text-xs sm:text-sm"
              >
                <LogOut className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button
              variant="ghost"
              asChild
              className="text-white/60 hover:text-white hover:bg-white/5 font-mono text-xs sm:text-sm px-2 sm:px-3 h-8 hidden xs:inline-flex"
            >
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button
              asChild
              className="bg-violet-600 hover:bg-violet-700 text-white font-mono border-0 text-xs sm:text-sm px-3 sm:px-4 h-8"
            >
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}