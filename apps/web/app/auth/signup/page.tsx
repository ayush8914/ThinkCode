'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Code2, AlertCircle, UserPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/auth/signin?registered=true');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#06060e] text-white font-mono relative overflow-hidden flex items-center justify-center">

      {/* Background Grid + Gradient Orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        
        {/* Main Grid */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Subtle secondary finer grid */}
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Animated gradient orbs */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-30 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, #4f1db5 0%, transparent 65%)', 
            animationDuration: '4s' 
          }} 
        />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, #1d4ed8 0%, transparent 65%)', 
            animationDuration: '6s', 
            animationDelay: '1s' 
          }} 
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-10"
          style={{ 
            background: 'radial-gradient(ellipse, #7c3aed 0%, transparent 70%)' 
          }} 
        />
      </div>

      {/* Horizontal scanlines */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, white 2px, white 3px)',
          backgroundSize: '100% 6px',
        }}
      />

      {/* Card Container with Mask to hide grid behind card */}
      <div className="relative z-10 w-full max-w-[420px] px-4 py-10">
        
        {/* Dark Mask to hide grid behind card */}
        <div 
          className="absolute inset-x-0 top-0 bottom-0 mx-auto max-w-[420px] rounded-3xl pointer-events-none"
          style={{
            background: '#06060e',
            boxShadow: '0 0 80px 40px #06060e',
            zIndex: -1,
          }}
        />



        {/* Card */}
        <div className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 0 0 1px rgba(124,58,237,0.1), 0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)'
          }}>

          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, #7c3aed, #3b82f6, transparent)' }} />

          <div className="p-4">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight mb-1">Create Account</h1>
              <p className="text-white/40 text-sm font-sans">Join ThinkCode and start coding</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <span className="text-red-400">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-[11px] text-white/40 uppercase tracking-widest block">Full Name</label>
                <div className="relative">
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                    required
                    disabled={loading}
                    className="w-full h-11 px-4 rounded-md text-sm text-white placeholder:text-white/20 outline-none transition-all duration-200 font-mono"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: focused === 'name' ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: focused === 'name' ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[11px] text-white/40 uppercase tracking-widest block">Email</label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    required
                    disabled={loading}
                    className="w-full h-11 px-4 rounded-md text-sm text-white placeholder:text-white/20 outline-none transition-all duration-200 font-mono"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: focused === 'email' ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: focused === 'email' ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-[11px] text-white/40 uppercase tracking-widest block">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    required
                    disabled={loading}
                    minLength={6}
                    className="w-full h-11 px-4 rounded-md text-sm text-white placeholder:text-white/20 outline-none transition-all duration-200 font-mono"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: focused === 'password' ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: focused === 'password' ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
                    }}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #5b21b6, #1d4ed8)',
                    boxShadow: '0 0 24px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                    border: '1px solid rgba(124,58,237,0.4)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 36px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.15)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.15)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Sign in link */}
            <p className="text-center mt-8 text-white/30 text-sm font-sans">
              Already have an account?{' '}
              <Link href="/auth/signin"
                className="transition-colors font-medium"
                style={{ color: '#a78bfa' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#c4b5fd'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#a78bfa'}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}