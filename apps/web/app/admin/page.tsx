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
    <div className="text-white font-mono">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-white/50 mb-8">Overview of your platform</p>
      
      <AdminDashboard />
    </div>
  );
}