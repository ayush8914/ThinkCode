import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }
  
  return (
    <main className="relative min-h-screen bg-[#0a0a0f] text-white font-mono">
      {/* Background Grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      
      {/* Gradient Overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[420px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(ellipse at center, #7c3aed 0%, transparent 70%)",
        }}
      />
      
      <div className="relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Admin <span className="text-violet-400">Dashboard</span>
          </h1>
          <p className="text-white/50">Overview of your platform</p>
        </div>
        
        <AdminDashboard />
      </div>
    </main>
  );
}